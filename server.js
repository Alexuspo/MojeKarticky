// ...existing code...

// API pro resetování balíčků (užitečné pro vývoj a řešení problémů)
app.post('/api/reset-decks', (req, res) => {
    logInfo('Požadavek na resetování všech balíčků');
    
    try {
        // Smazat balíčky z paměti
        decks = [];
        
        // V lokálním prostředí smazat i disk
        if (!isServerless) {
            const DECKS_FILE = path.join(__dirname, 'data', 'decks.json');
            if (fs.existsSync(DECKS_FILE)) {
                // Vytvořit zálohu
                const backupFile = `${DECKS_FILE}.backup.${Date.now()}`;
                fs.copyFileSync(DECKS_FILE, backupFile);
                
                // Přepsat původní soubor prázdným polem
                fs.writeFileSync(DECKS_FILE, JSON.stringify([], null, 2));
                logSuccess(`Balíčky resetovány, záloha v ${backupFile}`);
            }
        }
        
        res.status(200).json({ 
            message: 'Balíčky byly resetovány',
        });
    } catch (error) {
        logError('Chyba při resetování balíčků:', error);
        res.status(500).json({ 
            error: 'Nastala chyba při resetování balíčků',
            details: error.message
        });
    }
});

// API pro načtení nového balíčku z JSON souboru
app.post('/api/load-deck-file', (req, res) => {
    const { filePath } = req.body;
    
    if (!filePath) {
        return res.status(400).json({ error: 'Nebyla zadána cesta k souboru' });
    }
    
    try {
        const fullPath = path.join(__dirname, filePath);
        logInfo(`Načítám balíček ze souboru: ${fullPath}`);
        
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ error: `Soubor ${filePath} nebyl nalezen` });
        }
        
        const fileContent = fs.readFileSync(fullPath, 'utf8');
        const deckData = JSON.parse(fileContent);
        
        // Přidat nebo aktualizovat balíček
        const existingIndex = decks.findIndex(d => d.name === deckData.name);
        if (existingIndex !== -1) {
            decks[existingIndex] = deckData;
            logInfo(`Aktualizován balíček: ${deckData.name}`);
        } else {
            decks.push(deckData);
            logInfo(`Přidán nový balíček: ${deckData.name}`);
        }
        
        // Uložit na disk, pokud nejsme v serverless prostředí
        if (!isServerless) {
            const DECKS_FILE = path.join(__dirname, 'data', 'decks.json');
            fs.writeFileSync(DECKS_FILE, JSON.stringify(decks, null, 2));
        }
        
        res.status(200).json({ 
            message: `Balíček ${deckData.name} byl úspěšně načten`,
            deckId: deckData.id
        });
    } catch (error) {
        logError('Chyba při načítání balíčku ze souboru:', error);
        res.status(500).json({ 
            error: 'Nastala chyba při načítání balíčku ze souboru',
            details: error.message
        });
    }
});

// Přidání text-parseru
const textParser = require('./text-parser');

// API pro získání textových balíčků
app.get('/api/text-decks', (req, res) => {
    logInfo('Požadavek na získání textových balíčků');
    
    try {
        // Filtrace balíčků podle zdroje ('textfile')
        const textDecks = decks.filter(deck => deck.source === 'textfile');
        
        logSuccess(`Nalezeno ${textDecks.length} textových balíčků`);
        res.json(textDecks);
    } catch (error) {
        logError('Chyba při získávání textových balíčků:', error);
        res.status(500).json({ 
            error: 'Nastala chyba při získávání textových balíčků',
            details: error.message
        });
    }
});

// API pro načtení textových balíčků ze složky
app.post('/api/load-text-decks', (req, res) => {
    logInfo('Požadavek na načtení textových balíčků ze složky');
    
    try {
        // Cesta ke složce s textovými balíčky
        const folderPath = path.join(__dirname, 'public', 'Karticky');
        logInfo(`Hledám textové soubory ve složce: ${folderPath}`);
        
        // Načtení všech textových balíčků
        const textDecks = textParser.loadAllTextDecks(folderPath);
        
        if (!textDecks || textDecks.length === 0) {
            logWarning('Nebyly nalezeny žádné textové balíčky');
            return res.json({ 
                success: false, 
                error: 'Nebyly nalezeny žádné textové balíčky' 
            });
        }
        
        // Přidat nebo aktualizovat balíčky
        let addedCount = 0;
        let updatedCount = 0;
        
        textDecks.forEach(textDeck => {
            const existingIndex = decks.findIndex(d => d.name === textDeck.name);
            
            if (existingIndex !== -1) {
                // Aktualizovat existující balíček
                decks[existingIndex] = textDeck;
                updatedCount++;
            } else {
                // Přidat nový balíček
                decks.push(textDeck);
                addedCount++;
            }
        });
        
        logSuccess(`Načteno ${textDecks.length} textových balíčků (${addedCount} přidáno, ${updatedCount} aktualizováno)`);
        
        // Uložit aktualizované balíčky, pokud nejsme v serverless prostředí
        if (!isServerless) {
            const DECKS_FILE = path.join(__dirname, 'data', 'decks.json');
            fs.writeFileSync(DECKS_FILE, JSON.stringify(decks, null, 2));
        }
        
        res.json({ 
            success: true, 
            decksCount: textDecks.length, 
            added: addedCount, 
            updated: updatedCount 
        });
    } catch (error) {
        logError('Chyba při načítání textových balíčků:', error);
        res.status(500).json({ 
            success: false,
            error: 'Nastala chyba při načítání textových balíčků',
            details: error.message
        });
    }
});

// ...existing code...
