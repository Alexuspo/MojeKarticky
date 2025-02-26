const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Parsuje textový soubor s exportovanými kartičkami
 * @param {string} filePath - Cesta k textovému souboru
 * @returns {Object} - Balíček kartiček
 */
function parseTextFile(filePath) {
    try {
        // Kontrola, zda soubor existuje
        if (!fs.existsSync(filePath)) {
            console.warn(`Soubor ${filePath} neexistuje`);
            return null;
        }

        // Načtení obsahu souboru
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const lines = fileContent.split('\n');
        
        // Základní informace o balíčku
        let deckName = path.basename(filePath, path.extname(filePath));
        let separator = '\t'; // Výchozí oddělovač je tabulátor
        let isHtml = false;
        
        // Pole pro kartičky
        const cards = [];
        
        // Zpracování řádků
        lines.forEach((line, index) => {
            // Přeskočit prázdné řádky
            if (line.trim() === '') return;
            
            // Zpracování hlavičkových řádků
            if (line.startsWith('#')) {
                const headerParts = line.substring(1).split(':');
                
                if (headerParts.length >= 2) {
                    const key = headerParts[0].trim().toLowerCase();
                    const value = headerParts.slice(1).join(':').trim();
                    
                    // Typ oddělovače
                    if (key === 'separator') {
                        if (value === 'tab') separator = '\t';
                        else separator = value;
                    }
                    
                    // HTML povolení
                    if (key === 'html' && value.toLowerCase() === 'true') {
                        isHtml = true;
                    }
                }
                
                return;
            }
            
            // Zpracování řádků s kartičkami
            const parts = line.split(separator);
            
            // Kontrola, zda má řádek dostatek částí
            if (parts.length < 4) return;
            
            // Vytvoření karty
            // Index 2 je přední strana, index 3 je zadní strana
            const front = parts[2].trim();
            const back = parts[3].trim();
            
            // Přeskočit neplatné karty
            if (!front || !back) return;
            
            // Získání názvu balíčku z druhé kolonky, pokud existuje
            if (!deckName && parts[1] && parts[1].trim()) {
                deckName = parts[1].trim();
            }
            
            // Generování ID karty
            const cardId = crypto.createHash('md5')
                .update(`${front}${back}${index}`)
                .digest('hex')
                .substring(0, 8);
            
            // Tagy z páté kolonky
            const tags = parts.length >= 5 && parts[4] ? 
                parts[4].split(',').map(tag => tag.trim()).filter(tag => tag) : 
                ['literatura'];
            
            // Přidat kartu do seznamu
            cards.push({
                id: cardId,
                front: front,
                back: back,
                tags: tags
            });
        });
        
        // Pokud nebyly nalezeny žádné karty, vrátit null
        if (cards.length === 0) {
            console.warn('V souboru nebyly nalezeny žádné platné kartičky');
            return null;
        }
        
        // Vytvořit a vrátit balíček
        const deckId = crypto.createHash('md5')
            .update(deckName + new Date().toISOString())
            .digest('hex')
            .substring(0, 8);
        
        return {
            id: deckId,
            name: deckName,
            cards: cards,
            created: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            source: 'textfile',
            format: isHtml ? 'html' : 'plain'
        };
    } catch (error) {
        console.error('Chyba při parsování textového souboru:', error);
        return null;
    }
}

/**
 * Najde a načte všechny textové soubory s kartičkami ve složce
 * @param {string} folderPath - Cesta ke složce s textovými soubory
 * @returns {Array} - Pole balíčků kartiček
 */
function loadAllTextDecks(folderPath) {
    try {
        if (!fs.existsSync(folderPath)) {
            console.warn(`Složka ${folderPath} neexistuje`);
            return [];
        }
        
        // Získání seznamu souborů
        const files = fs.readdirSync(folderPath);
        const textFiles = files.filter(file => file.endsWith('.txt'));
        
        if (textFiles.length === 0) {
            console.warn('Nebyly nalezeny žádné textové soubory s kartičkami');
            return [];
        }
        
        // Parsování každého textového souboru
        const decks = [];
        
        for (const textFile of textFiles) {
            const filePath = path.join(folderPath, textFile);
            const deck = parseTextFile(filePath);
            
            if (deck) {
                decks.push(deck);
            }
        }
        
        return decks;
    } catch (error) {
        console.error('Chyba při načítání textových balíčků:', error);
        return [];
    }
}

/**
 * Získá balíček Literatura-Test-karticky z textového souboru
 * @returns {Object} - Balíček Literatura-Test-karticky
 */
function getLiteraturaFromTextFile() {
    try {
        // Cesta k textovému souboru (lze přizpůsobit)
        const textFilePath = path.join(__dirname, 'public', 'Karticky', 'Literatura - Test karticky..txt');
        
        // Pokusit se parsovat soubor
        const deck = parseTextFile(textFilePath);
        
        // Pokud byl soubor úspěšně parsován, vrátit balíček
        if (deck) {
            // Přejmenovat balíček pro lepší zobrazení
            deck.name = "Literatura-Test-karticky";
            return deck;
        }
        
        // Při neúspěchu vrátit null
        return null;
    } catch (error) {
        console.error('Chyba při získávání Literatura-Test-karticky z textového souboru:', error);
        return null;
    }
}

module.exports = {
    parseTextFile,
    loadAllTextDecks,
    getLiteraturaFromTextFile
};
