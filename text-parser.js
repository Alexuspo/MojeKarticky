// ...existing code...

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
        console.log(`Nalezeno ${files.length} souborů ve složce:`);
        files.forEach(file => console.log(` - ${file}`));
        
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
            
            // Vytvořit jméno balíčku z názvu souboru (bez přípony)
            const deckName = path.basename(textFile, '.txt');
            console.log(`Vytvářím balíček s názvem: ${deckName}`);
            
            const deck = parseTextFile(filePath);
            
            if (deck) {
                // Nastavit název balíčku podle souboru
                deck.name = deckName;
                decks.push(deck);
                console.log(`Úspěšně přidán balíček: ${deck.name} s ${deck.cards.length} kartami`);
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
        const fileName = path.basename(filePath, '.txt');
        let deckName = fileName; // Použít název souboru jako název balíčku
        let separator = '\t'; // Výchozí oddělovač je tabulátor
        let isHtml = false; // Výchozí hodnota pro HTML podporu
        
        console.log(`Název balíčku odvozen ze souboru: ${deckName}`);
        
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
                    
                    console.log(`Detekována hlavička: ${key}=${value}`);
                    
                    // Typ oddělovače
                    if (key === 'separator') {
                        if (value === 'tab') {
                            separator = '\t';
                            console.log('Nastavení oddělovače: tabulátor');
                        } else {
                            separator = value;
                            console.log(`Nastavení oddělovače: ${value}`);
                        }
                    }
                    
                    // Povolení HTML obsahu
                    if (key === 'html') {
                        isHtml = value.toLowerCase() === 'true';
                        console.log(`HTML formátování: ${isHtml ? 'povoleno' : 'zakázáno'}`);
                    }
                    
                    // Název balíčku (pokud je specifikován)
                    if (key === 'deck') {
                        // deckName zachováme z názvu souboru
                        console.log('Detekován název balíčku, ale zachováváme název ze souboru');
                    }
                }
                
                continue;
            }
            
            // Zpracování řádků s kartičkami
            try {
                // Zřetelnější logování pro ladění
                console.log(`Řádek ${i+1}: ${line.substring(0, 50)}${line.length > 50 ? '...' : ''}`);
                
                const parts = line.split(separator);
                console.log(`  Rozděleno na ${parts.length} částí`);
                
                if (parts.length < 3) {
                    console.log(`  Přeskakuji řádek s nedostatkem částí (${parts.length})`);
                    continue;
                }
                
                // Získat indexy pro přední a zadní stranu - podpora různých formátů exportů
                // Pro "Abstraktní umění.txt" jsou to indexy 1 a 2
                let frontIndex = 2; // Výchozí index pro přední stranu
                let backIndex = 3;  // Výchozí index pro zadní stranu
                
                // Pro soubor "Abstraktní umění.txt" je speciální uspořádání
                if (fileName.includes("Abstraktní")) {
                    frontIndex = 1;
                    backIndex = 2;
                    console.log(`  Detekován soubor Abstraktní umění, použity indexy: front=${frontIndex}, back=${backIndex}`);
                }
                
                // Vytvoření karty
                let front = parts[frontIndex] ? parts[frontIndex].trim() : '';
                let back = parts[backIndex] ? parts[backIndex].trim() : '';
                
                // Kontrola obsahu
                console.log(`  Front: ${front.substring(0, 30)}${front.length > 30 ? '...' : ''}`);
                console.log(`  Back: ${back.substring(0, 30)}${back.length > 30 ? '...' : ''}`);
                
                // Zpracování HTML obsahu
                if (isHtml) {
                    front = processCardContentWithMedia(front);
                    back = processCardContentWithMedia(back);
                }
                
                // Přeskočit neplatné karty
                if (!front || !back) {
                    console.log('  Přeskakuji řádek s prázdným obsahem');
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
                    tags: ['abstraktní_umění']
                });
                
                console.log(`  Vytvořena karta s ID: ${cardId}`);
            } catch (lineError) {
                console.error(`Chyba při zpracování řádku ${i+1}:`, lineError);
                continue;
            }
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
            format: isHtml ? 'html' : 'plain'
        };
    } catch (error) {
        console.error('Chyba při parsování textového souboru:', error);
        return null;
    }
}

// ...existing code...
