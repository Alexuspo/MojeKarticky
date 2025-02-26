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
        console.log(`Pokus o parsování textového souboru: ${filePath}`);
        
        // Kontrola, zda soubor existuje
        if (!fs.existsSync(filePath)) {
            console.warn(`Soubor ${filePath} neexistuje`);
            return null;
        }

        // Načtení obsahu souboru
        const fileContent = fs.readFileSync(filePath, 'utf8');
        console.log(`Soubor načten, velikost: ${fileContent.length} bajtů`);
        
        const lines = fileContent.split('\n');
        console.log(`Počet řádků v souboru: ${lines.length}`);
        
        // Základní informace o balíčku
        let deckName = 'Literatura-Test-karticky';
        let separator = '\t'; // Výchozí oddělovač je tabulátor
        
        // Pole pro kartičky
        const cards = [];
        
        // Zpracování řádků
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Přeskočit prázdné řádky
            if (!line || line.trim() === '') {
                continue;
            }
            
            // Zpracování hlavičkových řádků
            if (line.startsWith('#')) {
                const headerParts = line.substring(1).split(':');
                
                if (headerParts.length >= 2) {
                    const key = headerParts[0].trim().toLowerCase();
                    const value = headerParts.slice(1).join(':').trim();
                    
                    // Typ oddělovače
                    if (key === 'separator') {
                        if (value === 'tab') {
                            separator = '\t';
                        } else {
                            separator = value;
                        }
                    }
                }
                
                continue;
            }
            
            // Zpracování řádků s kartičkami
            const parts = line.split(separator);
            
            // Kontrola, zda má řádek dostatek částí
            if (parts.length < 4) {
                continue;
            }
            
            // Vytvoření karty
            // Index 2 je přední strana, index 3 je zadní strana
            const front = parts[2] ? parts[2].trim() : '';
            const back = parts[3] ? parts[3].trim() : '';
            
            // Přeskočit neplatné karty
            if (!front || !back) {
                continue;
            }
            
            // Generování ID karty
            const cardId = crypto.createHash('md5')
                .update(`${front}${back}${i}`)
                .digest('hex')
                .substring(0, 8);
            
            // Přidat kartu do seznamu
            cards.push({
                id: cardId,
                front: front,
                back: back,
                tags: ['literatura']
            });
        }
        
        // Pokud nebyly nalezeny žádné karty, vrátit null
        if (cards.length === 0) {
            console.warn('V souboru nebyly nalezeny žádné platné kartičky');
            return null;
        }
        
        console.log(`Parsování dokončeno, vytvořen balíček "${deckName}" s ${cards.length} kartičkami`);
        
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
            format: 'html'
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
        console.log(`Hledám textové soubory ve složce: ${folderPath}`);
        
        if (!fs.existsSync(folderPath)) {
            console.warn(`Složka ${folderPath} neexistuje`);
            return [];
        }
        
        // Získání seznamu souborů
        const files = fs.readdirSync(folderPath);
        console.log(`Nalezeno ${files.length} souborů ve složce`);
        
        const textFiles = files.filter(file => file.endsWith('.txt'));
        console.log(`Z toho ${textFiles.length} textových souborů`);
        
        if (textFiles.length === 0) {
            console.warn('Nebyly nalezeny žádné textové soubory s kartičkami');
            return [];
        }
        
        // Parsování každého textového souboru
        const decks = [];
        
        for (const textFile of textFiles) {
            const filePath = path.join(folderPath, textFile);
            console.log(`Zpracovávám soubor: ${filePath}`);
            
            const deck = parseTextFile(filePath);
            
            if (deck) {
                decks.push(deck);
                console.log(`Úspěšně přidán balíček: ${deck.name}`);
            } else {
                console.log(`Nepodařilo se zpracovat soubor: ${textFile}`);
            }
        }
        
        console.log(`Celkem zpracováno ${decks.length} balíčků z textových souborů`);
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
        console.log('Načítám Literatura-Test-karticky z textového souboru');
        
        // Nejprve zkusit přímou cestu k souboru
        const textFilePath = path.join(__dirname, 'public', 'Karticky', 'Literatura - Test karticky..txt');
        
        if (fs.existsSync(textFilePath)) {
            console.log(`Nalezen soubor: ${textFilePath}`);
            const deck = parseTextFile(textFilePath);
            
            if (deck) {
                console.log(`Úspěšně načten balíček s ${deck.cards.length} kartičkami`);
                return deck;
            }
        } else {
            console.log(`Soubor neexistuje: ${textFilePath}`);
        }
        
        // Zkusit načíst jakýkoliv textový soubor ve složce Karticky
        const kartickyDir = path.join(__dirname, 'public', 'Karticky');
        if (fs.existsSync(kartickyDir)) {
            const files = fs.readdirSync(kartickyDir);
            for (const file of files) {
                if (file.endsWith('.txt')) {
            const filePath = path.join(folderPath, textFile);
            console.log(`Zpracovávám soubor: ${filePath}`);
            
            const deck = parseTextFile(filePath);
            
            if (deck) {
                decks.push(deck);
                console.log(`Úspěšně přidán balíček: ${deck.name}`);
            } else {
                console.log(`Nepodařilo se zpracovat soubor: ${textFile}`);
            }
        }
        
        console.log(`Celkem zpracováno ${decks.length} balíčků z textových souborů`);
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
        console.log('Načítám Literatura-Test-karticky z textového souboru');
        
        // Zkusíme najít soubor s různými cestami a názvy
        const possiblePaths = [
            path.join(__dirname, 'public', 'Karticky', 'Literatura - Test karticky..txt'),
            path.join(__dirname, 'public', 'Karticky', 'Literatura - Test karticky.txt'),
            path.join(__dirname, 'public', 'Karticky', 'Literatura-Test-karticky.txt'),
            path.join(__dirname, 'public', 'Literatura - Test karticky..txt'),
            path.join(__dirname, 'public', 'Literatura - Test karticky.txt')
        ];
        
        console.log('Zkouším následující cesty:', possiblePaths);
        
        let textFilePath = null;
        
        // Zkusit najít existující soubor mezi možnými cestami
        for (const testPath of possiblePaths) {
            if (fs.existsSync(testPath)) {
                textFilePath = testPath;
                console.log(`Nalezen soubor: ${textFilePath}`);
                break;
            } else {
                console.log(`Soubor neexistuje: ${testPath}`);
            }
        }
        
        // Pokud nebyl nalezen žádný soubor, zkusíme prohledat složku Karticky
        if (!textFilePath) {
            const kartickyDir = path.join(__dirname, 'public', 'Karticky');
            
            if (fs.existsSync(kartickyDir)) {
                const files = fs.readdirSync(kartickyDir);
                console.log(`Obsah složky ${kartickyDir}:`, files);
                
                // Hledat soubor s "literatura" nebo "test" v názvu
                const literatureFile = files.find(f => 
                    f.toLowerCase().includes('literatura') || 
                    f.toLowerCase().includes('test') || 
                    f.toLowerCase().includes('kartičky') ||
                    f.toLowerCase().includes('karticky'));
                
                if (literatureFile) {
                    textFilePath = path.join(kartickyDir, literatureFile);
                    console.log(`Nalezen odpovídající soubor: ${textFilePath}`);
                }
            } else {
                console.log(`Složka ${kartickyDir} neexistuje`);
            }
        }
        
        // Pokud nebyl nalezen žádný soubor, vrátíme null
        if (!textFilePath) {
            console.warn('Nenalezen žádný textový soubor s Literatura-Test-karticky');
            return null;
        }
        
        // Pokusit se parsovat soubor
        const deck = parseTextFile(textFilePath);
        
        // Pokud byl soubor úspěšně parsován, vrátit balíček
        if (deck) {
            // Přejmenovat balíček pro lepší zobrazení
            deck.name = "Literatura-Test-karticky";
            console.log(`Úspěšně načten balíček Literatura-Test-karticky s ${deck.cards.length} kartičkami`);
            return deck;
        }
        
        // Při neúspěchu vrátit null
        console.warn('Nepodařilo se zpracovat textový soubor s Literatura-Test-karticky');
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
