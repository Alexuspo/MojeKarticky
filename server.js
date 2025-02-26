const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const ankiParser = require('./anki-parser');

// Konfigurace serveru
const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Databáze kartiček (prozatím jednoduchý JSON soubor)
let decks = [];
const DECKS_FILE = path.join(__dirname, 'data', 'decks.json');

// Ujistit se, že složka data existuje
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
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

// API Endpoint pro nahrání Anki souboru
app.post('/api/upload', upload.single('ankiFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Žádný soubor nebyl nahrán' });
    }

    try {
        // Zpracování Anki souboru
        const deck = await ankiParser.parseAnkiFile(req.file.path);
        
        // Přidat do seznamu balíčků
        decks.push(deck);
        
        // Uložit do souboru
        fs.writeFileSync(DECKS_FILE, JSON.stringify(decks));
        
        // Smazat dočasný soubor
        fs.unlinkSync(req.file.path);
        
        res.status(200).json({ message: 'Soubor byl úspěšně zpracován', deckId: deck.id });
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
