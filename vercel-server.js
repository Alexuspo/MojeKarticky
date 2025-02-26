// Speciální serverová verze pro Vercel serverless prostředí
const express = require('express');
const path = require('path');
const crypto = require('crypto');

// Vytvoření Express aplikace
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pro zpracování JSON dat
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statické soubory
app.use(express.static(path.join(__dirname, 'public')));

// Globální proměnné
let decks = [];

// Logovací funkce
function logInfo(message) {
    console.log(`[INFO] ${message}`);
}

function logSuccess(message) {
    console.log(`[SUCCESS] ${message}`);
}

function logWarning(message) {
    console.warn(`[WARN] ${message}`);
}

function logError(message, error) {
    console.error(`[ERROR] ${message}`, error || '');
}

// Základní API pro získání všech balíčků
app.get('/api/decks', (req, res) => {
    try {
        // Ve Vercel prostředí vždy vrátíme statické balíčky
        if (!decks || decks.length === 0) {
            decks = getStaticDecks();
        }
        res.json(decks);
    } catch (error) {
        logError('Chyba při získávání balíčků:', error);
        res.status(500).json({
            error: 'Nastala chyba při získávání balíčků',
            details: error.message
        });
    }
});

// API pro získání konkrétního balíčku
app.get('/api/decks/:id', (req, res) => {
    try {
        const deck = decks.find(d => d.id === req.params.id);
        if (!deck) {
            return res.status(404).json({ error: 'Balíček nebyl nalezen' });
        }
        res.json(deck);
    } catch (error) {
        logError('Chyba při získávání balíčku:', error);
        res.status(500).json({
            error: 'Nastala chyba při získávání balíčku',
            details: error.message
        });
    }
});

// API pro server status check
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'ok', 
        serverTime: new Date().toISOString(),
        environment: 'vercel',
        decksCount: decks.length
    });
});

// API pro získání textových balíčků
app.get('/api/text-decks', (req, res) => {
    logInfo('Požadavek na získání textových balíčků');
    
    try {
        // V serverless prostředí vždy vrátíme statické balíčky
        if (!decks || decks.length === 0) {
            decks = getStaticDecks();
        }
        
        const textDecks = decks.filter(deck => deck.source === 'hardcoded');
        logSuccess(`Nalezeno ${textDecks.length} textových balíčků`);
        res.json(textDecks);
    } catch (error) {
        logError('Chyba při získávání textových balíčků:', error);
        const staticDecks = getStaticDecks();
        logInfo(`Vracím ${staticDecks.length} statických balíčků po chybě`);
        res.json(staticDecks);
    }
});

// API pro načtení textových balíčků 
app.post('/api/load-text-decks', (req, res) => {
    logInfo('Požadavek na načtení textových balíčků (Vercel)');
    
    try {
        // V serverless prostředí vždy vrátíme statické balíčky
        const staticDecks = getStaticDecks();
        decks = staticDecks;
        
        logSuccess(`Načteno ${staticDecks.length} předdefinovaných balíčků`);
        
        res.json({ 
            success: true, 
            decksCount: staticDecks.length, 
            isServerless: true,
            environment: 'Vercel'
        });
    } catch (error) {
        logError('Chyba při načítání textových balíčků:', error);
        res.status(500).json({ 
            success: false,
            error: 'Nastala chyba při načítání statických balíčků',
            details: error.message
        });
    }
});

// Funkce pro vytvoření statických balíčků
function getStaticDecks() {
    logInfo('Vytvářím statické balíčky pro Vercel');
    
    const staticDecks = [];
    staticDecks.push(createLiteraturaDeck());
    staticDecks.push(createAbstractArtDeck());
    staticDecks.push(createHistoryDeck());
    
    return staticDecks;
}

// Vytvoření balíčku Literatura
function createLiteraturaDeck() {
    const cards = [
        { front: "Májovci tvořili v", back: "v 2 polovině 19.století" },
        { front: "V jejich čele stál", back: "Jan Neruda" },
        { front: "Literární skupina se jmenovala podle", back: "Almanachu Máj" },
        { front: "Májovci se svým dílem hlásili k odkazu", back: "K. H. Máchy" },
        { front: "Autorem malostranských povídek je", back: "Jan Neruda" },
        { front: "Fejeton je", back: "Krátký vtipný text a často kritický. (na př v novinách)" },
        { front: "Neruda byl redaktorem", back: "Národních listů" },
        { front: "Jmenujte jednu Nerudovu básnickou sbírku", back: "Písně kosmické" },
        { front: "Autorem poezie večerní písně a Pohádky z naší vesnice je", back: "Vítězslav Hálek" },
        { front: "Autorem romaneta v české literatuře je", back: "Jakub Arbes" }
    ];
    
    // Přidat ID ke každé kartě
    const cardsWithId = cards.map((card, index) => ({
        id: `literatura${index}`,
        front: card.front,
        back: card.back,
        tags: ['literatura']
    }));
    
    return {
        id: "literatura_hardcoded",
        name: "Literatura-Test-karticky",
        cards: cardsWithId,
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        source: 'hardcoded',
        format: 'plain'
    };
}

// Vytvoření balíčku Abstraktní umění
function createAbstractArtDeck() {
    const cards = [
        { front: "Abstraktní umění se začalo rozvíjet zejména", back: "na počátku 20. století" },
        { front: "Hlavním představitelem abstraktního expresionismu byl", back: "Jackson Pollock" },
        { front: "Významným průkopníkem geometrické abstrakce byl", back: "Piet Mondrian" },
        { front: "Pojem 'abstraktní umění' poprvé použil", back: "Wassily Kandinsky" },
        { front: "Bauhaus byla škola, která značně ovlivnila", back: "abstraktní design a architekturu" },
        { front: "Suprematismus je charakterizován", back: "používáním základních geometrických tvarů a omezenou barevností" },
        { front: "Který český umělec se proslavil abstrakcí?", back: "František Kupka" },
        { front: "De Stijl bylo", back: "nizozemské umělecké hnutí založené v roce 1917" }
    ];
    
    // Přidat ID ke každé kartě
    const cardsWithId = cards.map((card, index) => ({
        id: `abstraktni${index}`,
        front: card.front,
        back: card.back,
        tags: ['umeni', 'abstrakt']
    }));
    
    return {
        id: "abstraktni_umeni_hardcoded",
        name: "Abstraktní umění",
        cards: cardsWithId,
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        source: 'hardcoded',
        format: 'plain'
    };
}

// Vytvoření balíčku Historie
function createHistoryDeck() {
    const cards = [
        { front: "Kdy byla bitva na Bílé hoře?", back: "8. listopadu 1620" },
        { front: "Kdo byl prvním československým prezidentem?", back: "Tomáš Garrigue Masaryk" },
        { front: "Ve kterém roce vznikla první Československá republika?", back: "1918" },
        { front: "Datum sametové revoluce", back: "17. listopadu 1989" },
        { front: "Jak dlouho trvala třicetiletá válka?", back: "1618-1648" },
        { front: "Kdy byl založen první koncentrační tábor na českém území?", back: "1941 - Terezín" },
        { front: "Kdo byl atentátníkem na následníka trůnu Františka Ferdinanda d'Este?", back: "Gavrilo Princip" },
        { front: "Ve kterém roce vstoupila ČR do EU?", back: "2004" }
    ];
    
    // Přidat ID ke každé kartě
    const cardsWithId = cards.map((card, index) => ({
        id: `historie${index}`,
        front: card.front,
        back: card.back,
        tags: ['historie']
    }));
    
    return {
        id: "historie_hardcoded",
        name: "Historie ČR",
        cards: cardsWithId,
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        source: 'hardcoded',
        format: 'plain'
    };
}

// Catch-all API pro ostatní endpointy
app.all('/api/*', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Vercel serverless API - tento endpoint není implementován',
        endpoint: req.path
    });
});

// Obsluha všech ostatních požadavků - servírování statických souborů
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Spuštění serveru (v Vercel toto není potřeba, ale užitečné pro lokální testování)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server běží na http://localhost:${PORT}`);
    });
}

// Export pro Vercel
module.exports = app;
