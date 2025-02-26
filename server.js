const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const ankiParser = require('./anki-parser');
const textParser = require('./text-parser');

// Konfigurace serveru
const app = express();
const PORT = process.env.PORT || 3000;

// Na Vercel použijeme In-memory úložiště místo souborového systému
const isServerless = process.env.VERCEL || process.env.NOW;

// Nastavení logování pro lepší diagnostiku
function logInfo(message) {
    console.log(`\x1b[36m[INFO]\x1b[0m ${message}`);
}

function logError(message, error) {
    console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`, error ? error : '');
}

function logWarning(message) {
    console.warn(`\x1b[33m[WARNING]\x1b[0m ${message}`);
}

function logSuccess(message) {
    console.log(`\x1b[32m[SUCCESS]\x1b[0m ${message}`);
}

// Middleware
app.use(cors({
    origin: '*', // Povolit všechny origins pro vývoj
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Middleware pro logování požadavků
app.use((req, res, next) => {
    logInfo(`${req.method} ${req.url}`);
    next();
});

// Statické soubory
app.use(express.static('public'));

// Databáze kartiček (v paměti pro serverless, soubor pro lokální vývoj)
let decks = [];

// API cesta pro diagnostiku serveru
app.get('/api/health', (req, res) => {
    logInfo('Kontrola zdraví serveru');
    try {
        res.status(200).json({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            environment: isServerless ? 'serverless' : 'local',
            decksCount: decks.length
        });
    } catch (error) {
        logError('Chyba při kontrole zdraví serveru', error);
        res.status(500).json({ error: 'Interní chyba serveru' });
    }
});

// API cesta pro načtení kartiček z textového souboru
app.get('/api/load-text-decks', (req, res) => {
    logInfo('Požadavek na načtení textových kartiček');
    try {
        // Cesta ke složce s textovými soubory
        const textFolderPath = path.join(__dirname, 'public', 'Karticky');
        
        // Kontrola existence složky, případně ji vytvořit
        if (!fs.existsSync(textFolderPath)) {
            logWarning(`Složka ${textFolderPath} neexistuje, vytvářím ji`);
            fs.mkdirSync(textFolderPath, { recursive: true });
        }
        
        // Načtení všech balíčků
        const textDecks = textParser.loadAllTextDecks(textFolderPath);
        
        if (textDecks.length === 0) {
            logWarning('Nebyly nalezeny žádné textové soubory s kartičkami');
            
            // Kontrola existence souboru a případné vytvoření ukázkového
            const defaultFilePath = path.join(textFolderPath, 'Literatura - Test karticky..txt');
            if (!fs.existsSync(defaultFilePath)) {
                logWarning(`Vytvářím ukázkový soubor ${defaultFilePath}`);
                try {
                    // Vytvořit ukázkový soubor
                    require('./setup');
                    
                    // Znovu zkusit načíst balíčky
                    const newTextDecks = textParser.loadAllTextDecks(textFolderPath);
                    if (newTextDecks.length > 0) {
                        logSuccess('Úspěšně vytvořen a načten ukázkový soubor s kartičkami');
                        
                        // Přidat načtené balíčky do seznamu
                        for (const deck of newTextDecks) {
                            const existingIndex = decks.findIndex(d => d.name === deck.name);
                            if (existingIndex !== -1) {
                                decks[existingIndex] = deck;
                            } else {
                                decks.push(deck);
                            }
                        }
                        
                        return res.status(200).json({
                            message: `Úspěšně vytvořen a načten ukázkový balíček`,
                            decks: newTextDecks.map(d => ({ id: d.id, name: d.name, cardCount: d.cards.length }))
                        });
                    }
                } catch (setupErr) {
                    logError('Chyba při vytváření ukázkového souboru', setupErr);
                }
            }
            
            return res.status(404).json({ 
                error: 'Nebyly nalezeny žádné textové soubory s kartičkami',
                solution: 'Byl vytvořen ukázkový soubor, zkuste požadavek znovu'
            });
        }
        
        // Přidat načtené balíčky do seznamu
        for (const deck of textDecks) {
            const existingIndex = decks.findIndex(d => d.name === deck.name);
            if (existingIndex !== -1) {
                decks[existingIndex] = deck;
            } else {
                decks.push(deck);
            }
        }
        
        // V lokálním prostředí ukládáme do souboru
        if (!isServerless) {
            try {
                const DECKS_FILE = path.join(__dirname, 'data', 'decks.json');
                if (!fs.existsSync(path.dirname(DECKS_FILE))) {
                    fs.mkdirSync(path.dirname(DECKS_FILE), { recursive: true });
                }
                fs.writeFileSync(DECKS_FILE, JSON.stringify(decks, null, 2));
                logSuccess(`Balíčky uloženy do ${DECKS_FILE}`);
            } catch (saveErr) {
                logError('Chyba při ukládání balíčků', saveErr);
            }
        }
        
        logSuccess(`Úspěšně načteno ${textDecks.length} balíčků z textových souborů`);
        res.status(200).json({ 
            message: `Úspěšně načteno ${textDecks.length} balíčků z textových souborů`,
            decks: textDecks.map(d => ({ id: d.id, name: d.name, cardCount: d.cards.length }))
        });
    } catch (error) {
        logError('Chyba při načítání textových souborů', error);
        res.status(500).json({ 
            error: 'Nastala chyba při načítání textových souborů',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Inicializace aplikace
if (isServerless) {
    // Pro Vercel - najít a načíst balíčky z textového souboru
    try {
        logInfo('Serverless prostředí detekováno, načítám Literatura-Test-karticky z textového souboru');
        const textDeck = textParser.getLiteraturaFromTextFile();
        
        if (textDeck) {
            decks.push(textDeck);
            logSuccess('Úspěšně načteny kartičky z textového souboru');
        } else {
            const hardcodedDeck = ankiParser.getLiteraturaTestData();
            decks.push(hardcodedDeck);
            logWarning('Použita záložní verze Literatura-Test-karticky');
        }
    } catch (err) {
        logError('Chyba při vytváření Literatura-Test-karticky', err);
    }
} else {
    // Pouze pro lokální vývoj
    const DECKS_FILE = path.join(__dirname, 'data', 'decks.json');
    
    // Ujistit se, že složka existuje
    if (!fs.existsSync(path.join(__dirname, 'data'))) {
        try {
            fs.mkdirSync(path.join(__dirname, 'data'));
        } catch (err) {
            logError('Chyba při vytváření složky data', err);
        }
    }
    
    // Načíst data z disku
    try {
        if (fs.existsSync(DECKS_FILE)) {
            const data = fs.readFileSync(DECKS_FILE, 'utf8');
            try {
                decks = JSON.parse(data);
                logSuccess(`Načteno ${decks.length} balíčků z disku`);
            } catch (parseErr) {
                logError('Chyba při parsování decks.json', parseErr);
            }
        }
    } catch (error) {
        logError('Chyba při načítání balíčků', error);
    }
    
    // Zkusit načíst Literatura-Test-karticky z textového souboru
    try {
        const textDeck = textParser.getLiteraturaFromTextFile();
        
        if (textDeck) {
            // Aktualizovat nebo přidat do seznamu balíčků
            const existingIndex = decks.findIndex(d => d.name === textDeck.name);
            if (existingIndex !== -1) {
                decks[existingIndex] = textDeck;
            } else {
                decks.push(textDeck);
            }
            logSuccess('Literatura-Test-karticky načteny z textového souboru');
        }
    } catch (textError) {
        logError('Chyba při načítání Literatura-Test-karticky z textového souboru', textError);
    }
    
    // Pokud nemáme žádné balíčky, vytvoříme Literatura-Test-karticky z hardcoded dat
    if (decks.length === 0) {
        decks.push(ankiParser.getLiteraturaTestData());
        logWarning('Použita záložní verze Literatura-Test-karticky');
    }
}

// API Endpoint pro načtení výchozího balíčku
app.get('/api/load-default-deck', async (req, res) => {
    logInfo('Požadavek na načtení výchozího balíčku');
    
    try {
        // Nejprve zkusíme načíst Literatura-Test-karticky z textového souboru
        const literaturaDeck = textParser.getLiteraturaFromTextFile() || ankiParser.getLiteraturaTestData();
        
        // Přidat nebo aktualizovat balíček
        const existingIndex = decks.findIndex(d => d.name === literaturaDeck.name);
        if (existingIndex !== -1) {
            decks[existingIndex] = literaturaDeck;
        } else {
            decks.push(literaturaDeck);
        }
        
        // V lokálním prostředí ukládáme do souboru
        if (!isServerless) {
            try {
                const DECKS_FILE = path.join(__dirname, 'data', 'decks.json');
                fs.writeFileSync(DECKS_FILE, JSON.stringify(decks, null, 2));
            } catch (saveErr) {
                logError('Chyba při ukládání balíčků', saveErr);
            }
        }
        
        return res.status(200).json({ 
            message: 'Literatura-Test-karticky byly úspěšně načteny', 
            deckId: literaturaDeck.id,
            source: literaturaDeck.source || 'unknown'
        });
    } catch (error) {
        logError('Chyba při načítání Literatura-Test-karticky', error);
        res.status(500).json({ 
            error: 'Nastala chyba při zpracování požadavku',
            details: error.message
        });
    }
});

// API pro vytvoření náhodného balíčku (pro testování)
app.post('/api/create-random-deck', (req, res) => {
    logInfo('Požadavek na vytvoření náhodného balíčku');
    const { name, count } = req.body;
    
    try {
        const randomDeck = ankiParser.createRandomDeck(name || undefined, count || undefined);
        decks.push(randomDeck);
        
        // V lokálním prostředí ukládáme do souboru
        if (!isServerless) {
            try {
                const DECKS_FILE = path.join(__dirname, 'data', 'decks.json');
                fs.writeFileSync(DECKS_FILE, JSON.stringify(decks, null, 2));
            } catch (saveErr) {
                logError('Chyba při ukládání balíčků', saveErr);
            }
        }
        
        res.status(201).json({ 
            message: 'Náhodný balíček byl vytvořen', 
            deckId: randomDeck.id 
        });
    } catch (error) {
        logError('Chyba při vytváření náhodného balíčku', error);
        res.status(500).json({ error: 'Chyba při vytváření náhodného balíčku' });
    }
});

// Získat všechny balíčky
app.get('/api/decks', (req, res) => {
    logInfo(`Požadavek na získání všech balíčků (počet: ${decks.length})`);
    
    try {
        // Pokud nemáme žádné balíčky, zkusíme nejprve načíst z textového souboru
        if (decks.length === 0) {
            logWarning('Žádné balíčky nejsou k dispozici, zkouším načíst z textových souborů');
            
            try {
                const textFolderPath = path.join(__dirname, 'public', 'Karticky');
                if (!fs.existsSync(textFolderPath)) {
                    fs.mkdirSync(textFolderPath, { recursive: true });
                    logInfo('Vytvořena složka Karticky');
                }
                
                const textDeck = textParser.getLiteraturaFromTextFile();
                if (textDeck) {
                    decks.push(textDeck);
                    logSuccess('Úspěšně načten balíček kartiček z textového souboru');
                } else {
                    // Pokud ani to nefunguje, vytvoříme ukázkový
                    const dummyDeck = ankiParser.createDummyDeck();
                    decks.push(dummyDeck);
                    logWarning('Vytvořen ukázkový balíček, protože nebyl nalezen žádný soubor s kartičkami');
                }
            } catch (textError) {
                logError('Chyba při pokusu načíst textový balíček, přecházím na ukázkový', textError);
                const dummyDeck = ankiParser.createDummyDeck();
                decks.push(dummyDeck);
                logWarning('Vytvořen ukázkový balíček kvůli chybě při načítání textového souboru');
            }
        }
        
        logSuccess(`Odesílám ${decks.length} balíčků klientovi`);
        res.json(decks);
    } catch (error) {
        logError('Chyba při získávání všech balíčků', error);
        res.status(500).json({ 
            error: 'Nastala chyba při získávání balíčků',
            details: error.message 
        });
    }
});

// Získat konkrétní balíček
app.get('/api/decks/:id', (req, res) => {
    logInfo(`Hledám balíček s ID: ${req.params.id}`);
    try {
        const deck = decks.find(d => d.id === req.params.id);
        if (!deck) {
            logWarning(`Balíček s ID ${req.params.id} nenalezen`);
            
            // Pokud balíček nenajdeme, vrátíme ukázkový
            const dummyDeck = ankiParser.createDummyDeck();
            logInfo('Vracím ukázkový balíček jako náhradu');
            return res.json(dummyDeck);
        }
        
        logSuccess(`Balíček s ID ${req.params.id} úspěšně nalezen`);
        res.json(deck);
    } catch (error) {
        logError(`Chyba při hledání balíčku s ID ${req.params.id}`, error);
        res.status(500).json({ 
            error: 'Nastala chyba při hledání balíčku',
            details: error.message
        });
    }
});

// Přidat obecné ošetření chyb
app.use((err, req, res, next) => {
    logError('Neošetřená chyba', err);
    res.status(500).json({ 
        error: 'Došlo k chybě na serveru',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Pro Vercel exportujeme aplikaci
if (isServerless) {
    logInfo('Exportuji Express aplikaci pro serverless prostředí');
    module.exports = app;
} else {
    // Spustit server
    app.listen(PORT, () => {
        logSuccess(`Server běží na http://localhost:${PORT}`);
    });
}
