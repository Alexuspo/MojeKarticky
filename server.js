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

// Pro Vercel vždy používáme ukázkový balíček, protože nemůžeme číst/zapisovat soubory
if (isServerless) {
    try {
        console.log('Serverless prostředí detekováno, používám ukázkový balíček');
        // Okamžitě vytvořit ukázkový balíček
        decks.push(ankiParser.createDummyDeck());
        console.log('Vytvořen ukázkový balíček pro serverless prostředí');
    } catch (err) {
        console.error('Chyba při vytváření ukázkového balíčku:', err);
    }
} else {
    // Pouze pro lokální vývoj
    const DECKS_FILE = path.join(__dirname, 'data', 'decks.json');
    const DEFAULT_ANKI_FILE = path.join(__dirname, 'public', 'anki', 'default-deck.apkg');
    
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
    
    // Pokud nemáme žádné balíčky, vytvoříme ukázkový
    if (decks.length === 0) {
        decks.push(ankiParser.createDummyDeck());
    }
}

// API Endpoint pro načtení výchozího balíčku
app.get('/api/load-default-deck', async (req, res) => {
    console.log('Požadavek na načtení výchozího balíčku');
    
    try {
        // V serverless prostředí vždy použijeme ukázkový balíček
        const dummyDeck = ankiParser.createDummyDeck();
        
        // Přidat nebo aktualizovat balíček
        const existingDummyIndex = decks.findIndex(d => d.name === dummyDeck.name);
        if (existingDummyIndex !== -1) {
            decks[existingDummyIndex] = dummyDeck;
        } else {
            decks.push(dummyDeck);
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
            message: 'Ukázkový balíček byl úspěšně načten', 
            deckId: dummyDeck.id,
            warning: isServerless ? 'Používám ukázkový balíček (serverless mód)' : undefined
        });
    } catch (error) {
        console.error('Chyba při generování balíčku:', error);
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
