const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const ankiParser = require('./anki-parser');

// Konfigurace serveru
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Databáze kartiček (prozatím jednoduchý JSON soubor)
let decks = [];
const DECKS_FILE = path.join(__dirname, 'data', 'decks.json');
const DEFAULT_ANKI_FILE = path.join(__dirname, 'public', 'anki', 'default-deck.apkg');

// Ujistit se, že složka data existuje
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// Ujistit se, že složka pro Anki soubory existuje
if (!fs.existsSync(path.join(__dirname, 'public', 'anki'))) {
    fs.mkdirSync(path.join(__dirname, 'public', 'anki'), { recursive: true });
}

// Načíst uložená balíčky, pokud existují
try {
    if (fs.existsSync(DECKS_FILE)) {
        const data = fs.readFileSync(DECKS_FILE, 'utf8');
        decks = JSON.parse(data);
    } else {
        // Vytvořit prázdný soubor
        fs.writeFileSync(DECKS_FILE, JSON.stringify(decks));
    }
} catch (error) {
    console.error('Chyba při načítání balíčků:', error);
}

// API Endpoint pro načtení Anki souboru z public/anki adresáře
app.get('/api/load-default-deck', async (req, res) => {
    try {
        if (!fs.existsSync(DEFAULT_ANKI_FILE)) {
            return res.status(404).json({ error: 'Výchozí Anki soubor nebyl nalezen' });
        }

        // Zpracování Anki souboru
        const deck = await ankiParser.parseAnkiFile(DEFAULT_ANKI_FILE);
        
        // Kontrola, zda balíček s tímto ID už neexistuje
        const existingDeckIndex = decks.findIndex(d => d.id === deck.id);
        
        if (existingDeckIndex !== -1) {
            // Aktualizovat existující balíček
            decks[existingDeckIndex] = {
                ...deck,
                lastModified: new Date().toISOString()
            };
        } else {
            // Přidat nový balíček do seznamu
            decks.push(deck);
        }
        
        // Uložit do souboru
        fs.writeFileSync(DECKS_FILE, JSON.stringify(decks));
        
        res.status(200).json({ 
            message: 'Výchozí balíček byl úspěšně načten', 
            deckId: deck.id 
        });
    } catch (error) {
        console.error('Chyba při zpracování souboru:', error);
        res.status(500).json({ error: 'Nastala chyba při zpracování souboru' });
    }
});

// Získat všechny balíčky
app.get('/api/decks', (req, res) => {
    res.json(decks);
});

// Získat konkrétní balíček
app.get('/api/decks/:id', (req, res) => {
    const deck = decks.find(d => d.id === req.params.id);
    if (!deck) {
        return res.status(404).json({ error: 'Balíček nenalezen' });
    }
    res.json(deck);
});

// Spustit server
app.listen(PORT, () => {
    console.log(`Server běží na http://localhost:${PORT}`);
});
