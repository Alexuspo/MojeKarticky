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

// Pro Vercel vždy používáme Literatura-Test-karticky, protože nemůžeme číst/zapisovat soubory
if (isServerless) {
    try {
        console.log('Serverless prostředí detekováno, používám Literatura-Test-karticky');
        // Okamžitě vytvořit Literatura-Test-karticky
        decks.push(ankiParser.getLiteraturaTestData());
        console.log('Literatura-Test-karticky přidány do dostupných balíčků');
    } catch (err) {
        console.error('Chyba při vytváření Literatura-Test-karticky:', err);
    }
} else {
    // Pouze pro lokální vývoj
    const DECKS_FILE = path.join(__dirname, 'data', 'decks.json');
    
    // Ujistit se, že složka existuje
    if (!fs.existsSync(path.join(__dirname, 'data'))) {
        try {
            fs.mkdirSync(path.join(__dirname, 'data'));
        } catch (err) {
            console.error('Chyba při vytváření složky data:', err);
        }
    }
    
    // Načíst data z disku
    try {
        if (fs.existsSync(DECKS_FILE)) {
            const data = fs.readFileSync(DECKS_FILE, 'utf8');
            try {
                decks = JSON.parse(data);
                console.log(`Načteno ${decks.length} balíčků z disku`);
            } catch (parseErr) {
                console.error('Chyba při parsování decks.json:', parseErr);
            }
        }
    } catch (error) {
        console.error('Chyba při načítání balíčků:', error);
    }
    
    // Pokud nemáme žádné balíčky, vytvoříme Literatura-Test-karticky
    if (decks.length === 0) {
        decks.push(ankiParser.getLiteraturaTestData());
        console.log('Literatura-Test-karticky přidány jako výchozí balíček');
    }
}

// API Endpoint pro načtení výchozího balíčku
app.get('/api/load-default-deck', async (req, res) => {
    console.log('Požadavek na načtení výchozího balíčku');
    
    try {
        // Vždy použijeme Literatura-Test-karticky
        const literaturaDeck = ankiParser.getLiteraturaTestData();
        
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
                console.error('Chyba při ukládání balíčků:', saveErr);
            }
        }
        
        return res.status(200).json({ 
            message: 'Literatura-Test-karticky byly úspěšně načteny', 
            deckId: literaturaDeck.id
        });
    } catch (error) {
        console.error('Chyba při načítání Literatura-Test-karticky:', error);
        res.status(500).json({ 
            error: 'Nastala chyba při zpracování požadavku',
            details: error.message
        });
    }
});

// API pro vytvoření náhodného balíčku (pro testování)
app.post('/api/create-random-deck', (req, res) => {
    console.log('Požadavek na vytvoření náhodného balíčku');
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
                console.error('Chyba při ukládání balíčků:', saveErr);
            }
        }
        
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
    
    // Pokud nemáme žádné balíčky, vytvoříme ukázkový
    if (decks.length === 0) {
        const dummyDeck = ankiParser.createDummyDeck();
        decks.push(dummyDeck);
        console.log('Vytvořen ukázkový balíček, protože databáze byla prázdná');
    }
    
    res.json(decks);
});

// Získat konkrétní balíček
app.get('/api/decks/:id', (req, res) => {
    console.log(`Hledám balíček s ID: ${req.params.id}`);
    const deck = decks.find(d => d.id === req.params.id);
    if (!deck) {
        console.warn(`Balíček s ID ${req.params.id} nenalezen`);
        
        // Pokud balíček nenajdeme, vrátíme ukázkový
        const dummyDeck = ankiParser.createDummyDeck();
        return res.json(dummyDeck);
    }
    res.json(deck);
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
