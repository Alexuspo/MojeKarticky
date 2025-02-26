const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const ankiParser = require('./anki-parser');

// Konfigurace serveru
const app = express();
const PORT = process.env.PORT || 3000;

// Na Vercel použijeme In-memory úložiště místo souborového systému
const isServerless = process.env.VERCEL || process.env.NOW;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Databáze kartiček (v paměti pro serverless, soubor pro lokální vývoj)
let decks = [];
const DECKS_FILE = path.join(__dirname, 'data', 'decks.json');
const DEFAULT_ANKI_FILE = path.join(__dirname, 'public', 'anki', 'default-deck.apkg');

// Funkce pro ukládání a načítání dat
function saveDecks() {
    if (isServerless) {
        // V serverless prostředí pouze logujeme
        console.log(`Ukládám ${decks.length} balíčků do paměti`);
        return true;
    }

    try {
        // Ujistit se, že složka existuje
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        fs.writeFileSync(DECKS_FILE, JSON.stringify(decks, null, 2));
        console.log(`Uloženo ${decks.length} balíčků do souboru`);
        return true;
    } catch (error) {
        console.error('Chyba při ukládání balíčků:', error);
        return false;
    }
}

function loadDecks() {
    // V serverless prostředí použijeme výchozí ukázkový balíček
    if (isServerless) {
        console.log('Serverless prostředí detekováno, používám ukázkový balíček');
        if (decks.length === 0) {
            try {
                decks.push(ankiParser.createDummyDeck());
                console.log('Vytvořen ukázkový balíček pro serverless prostředí');
            } catch (err) {
                console.error('Chyba při vytváření ukázkového balíčku:', err);
            }
        }
        return;
    }

    try {
        if (fs.existsSync(DECKS_FILE)) {
            const data = fs.readFileSync(DECKS_FILE, 'utf8');
            try {
                decks = JSON.parse(data);
                console.log(`Načteno ${decks.length} balíčků z disku`);
            } catch (parseErr) {
                console.error('Chyba při parsování decks.json:', parseErr);
                decks = [];
                // Pokud je soubor poškozený, vytvořit zálohu a čistý nový
                fs.copyFileSync(DECKS_FILE, `${DECKS_FILE}.backup-${Date.now()}`);
                saveDecks();
            }
        } else {
            // Vytvořit prázdný soubor
            saveDecks();
        }
    } catch (error) {
        console.error('Chyba při načítání balíčků:', error);
    }
}

// Inicializace aplikace
loadDecks();

// API Endpoint pro načtení výchozího balíčku
app.get('/api/load-default-deck', async (req, res) => {
    console.log('Požadavek na načtení výchozího balíčku');
    
    try {
        // V serverless prostředí nebo pokud soubor neexistuje, použijeme ukázkový balíček
        if (isServerless || !fs.existsSync(DEFAULT_ANKI_FILE)) {
            console.log('Používám ukázkový balíček');
            
            // Pokud soubor neexistuje, pokusíme se vytvořit ukázkový balíček
            const dummyDeck = ankiParser.createDummyDeck();
            
            // Přidat ukázkový balíček
            const existingDummyIndex = decks.findIndex(d => d.name === dummyDeck.name);
            if (existingDummyIndex !== -1) {
                decks[existingDummyIndex] = dummyDeck;
            } else {
                decks.push(dummyDeck);
            }
            
            saveDecks();
            
            console.log('Vytvořen a uložen ukázkový balíček');
            
            return res.status(200).json({ 
                message: 'Ukázkový balíček byl úspěšně vytvořen a načten', 
                deckId: dummyDeck.id,
                warning: 'Používám ukázkový balíček'
            });
        }

        // Lokální režim - zpracování Anki souboru
        console.log('Začínám zpracovávat Anki soubor');
        
        const deck = await ankiParser.parseAnkiFile(DEFAULT_ANKI_FILE);
        
        // Kontrola, zda balíček s tímto ID už neexistuje
        const existingDeckIndex = decks.findIndex(d => d.id === deck.id);
        
        if (existingDeckIndex !== -1) {
            // Aktualizovat existující balíček
            decks[existingDeckIndex] = {
                ...deck,
                lastModified: new Date().toISOString()
            };
            console.log(`Aktualizován existující balíček s ID ${deck.id}`);
        } else {
            // Přidat nový balíček do seznamu
            decks.push(deck);
            console.log(`Přidán nový balíček s ID ${deck.id}`);
        }
        
        saveDecks();
        
        res.status(200).json({ 
            message: 'Výchozí balíček byl úspěšně načten', 
            deckId: deck.id 
        });
    } catch (error) {
        console.error('Chyba při zpracování souboru:', error);
        
        // Pokud dojde k chybě, pokusíme se vrátit ukázkový balíček
        try {
            const dummyDeck = ankiParser.createDummyDeck();
            
            // Přidat ukázkový balíček jako zálohu
            decks.push(dummyDeck);
            saveDecks();
            
            res.status(200).json({ 
                message: 'Ukázkový balíček byl načten z důvodu chyby',
                deckId: dummyDeck.id,
                warning: 'Došlo k chybě při načítání souboru, používám ukázkový balíček',
                originalError: error.message
            });
        } catch (fallbackError) {
            res.status(500).json({ 
                error: 'Nastala kritická chyba při zpracování souboru',
                details: error.message
            });
        }
    }
});

// API pro vytvoření náhodného balíčku (pro testování)
app.post('/api/create-random-deck', (req, res) => {
    console.log('Požadavek na vytvoření náhodného balíčku');
    const { name, count } = req.body;
    
    try {
        const randomDeck = ankiParser.createRandomDeck(name || undefined, count || undefined);
        decks.push(randomDeck);
        saveDecks();
        
        res.status(201).json({ 
            message: 'Náhodný balíček byl vytvořen', 
            deckId: randomDeck.id 
        });
    } catch (error) {
        console.error('Chyba při vytváření náhodného balíčku:', error);
        res.status(500).json({ error: 'Chyba při vytváření náhodného balíčku' });
    }
});

// Získat všechny balíčky
app.get('/api/decks', (req, res) => {
    console.log(`Odesílám ${decks.length} balíčků klientovi`);
    
    // Pokud nejsou žádné balíčky, vytvoříme ukázkový
    if (decks.length === 0) {
        try {
            const dummyDeck = ankiParser.createDummyDeck();
            decks.push(dummyDeck);
            saveDecks();
            console.log('Vytvořen ukázkový balíček, protože databáze byla prázdná');
        } catch (err) {
            console.error('Chyba při vytváření ukázkového balíčku:', err);
        }
    }
    
    res.json(decks);
});

// Získat konkrétní balíček
app.get('/api/decks/:id', (req, res) => {
    console.log(`Hledám balíček s ID: ${req.params.id}`);
    const deck = decks.find(d => d.id === req.params.id);
    if (!deck) {
        console.warn(`Balíček s ID ${req.params.id} nenalezen`);
        return res.status(404).json({ error: 'Balíček nenalezen' });
    }
    res.json(deck);
});

// Smazat balíček
app.delete('/api/decks/:id', (req, res) => {
    console.log(`Požadavek na smazání balíčku s ID: ${req.params.id}`);
    const deckIndex = decks.findIndex(d => d.id === req.params.id);
    
    if (deckIndex === -1) {
        console.warn(`Balíček s ID ${req.params.id nenalezen při pokusu o smazání`);
        return res.status(404).json({ error: 'Balíček nenalezen' });
    }
    
    decks.splice(deckIndex, 1);
    saveDecks();
    
    res.status(200).json({ message: 'Balíček byl úspěšně smazán' });
});

// Reset statistik balíčku (nebo celého balíčku)
app.post('/api/decks/:id/reset', (req, res) => {
    const { id } = req.params;
    const { resetType } = req.body; // 'stats' nebo 'all'
    
    const deckIndex = decks.findIndex(d => d.id === id);
    if (deckIndex === -1) {
        return res.status(404).json({ error: 'Balíček nenalezen' });
    }
    
    if (resetType === 'all') {
        // Načíst znovu ze souboru, pokud existuje, jinak vytvořit ukázkový
        if (fs.existsSync(DEFAULT_ANKI_FILE)) {
            ankiParser.parseAnkiFile(DEFAULT_ANKI_FILE)
                .then(newDeck => {
                    decks[deckIndex] = newDeck;
                    saveDecks();
                    res.status(200).json({ message: 'Balíček byl úspěšně resetován' });
                })
                .catch(err => {
                    console.error('Chyba při resetování balíčku:', err);
                    res.status(500).json({ error: 'Chyba při resetování balíčku' });
                });
        } else {
            // Použít dummy balíček
            decks[deckIndex] = ankiParser.createDummyDeck();
            saveDecks();
            res.status(200).json({ 
                message: 'Balíček byl resetován do výchozího stavu',
                warning: 'Použil se ukázkový balíček, protože původní soubor nebyl nalezen'
            });
        }
    } else {
        // Resetovat jen statistiky
        if (decks[deckIndex].stats) {
            decks[deckIndex].stats = {};
            decks[deckIndex].lastModified = new Date().toISOString();
            saveDecks();
        }
        res.status(200).json({ message: 'Statistiky balíčku byly resetovány' });
    }
});

// Přidat obecné ošetření chyb
app.use((err, req, res, next) => {
    console.error('Neošetřená chyba:', err);
    res.status(500).json({ 
        error: 'Došlo k chybě na serveru',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Pro Vercel exportujeme aplikaci
if (isServerless) {
    console.log('Exportuji Express aplikaci pro serverless prostředí');
    module.exports = app;
} else {
    // Spustit server
    app.listen(PORT, () => {
        console.log(`Server běží na http://localhost:${PORT}`);
    });
}

// Přidání metody pro vytváření dummy dat
if (!ankiParser.createDummyDeck) {
    ankiParser.createDummyDeck = function() {
        const id = 'demo' + Math.floor(Math.random() * 1000);
        
        return {
            id,
            name: 'Ukázkový balíček',
            cards: [
                {
                    id: 'card001',
                    front: 'Co je hlavní město České republiky?',
                    back: 'Praha',
                    tags: ['geografie', 'čr']
                },
                {
                    id: 'card002',
                    front: 'Kolik má průměrná dešťovka nohou?',
                    back: 'Žádnou',
                    tags: ['biologie', 'zábavné']
                },
                {
                    id: 'card003',
                    front: 'Jaký je chemický vzorec vody?',
                    back: 'H<sub>2</sub>O',
                    tags: ['chemie', 'základy']
                },
                {
                    id: 'card004',
                    front: 'Jaký je počet planet ve sluneční soustavě?',
                    back: '8<br><small>(Pluto bylo v roce 2006 reklasifikováno jako trpasličí planeta)</small>',
                    tags: ['astronomie']
                },
                {
                    id: 'card005',
                    front: 'Kdo napsal Romea a Julii?',
                    back: 'William Shakespeare',
                    tags: ['literatura', 'historie']
                }
            ],
            created: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
    };
}
