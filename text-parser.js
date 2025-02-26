const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
                console.log(`Úspěšně přidán balíček: ${deck.name} (${deck.cards.length} karet)`);
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
                }
                
                continue;
            }
            
            // Detekce typu souboru pro speciální zpracování
            const isAbstractArt = fileName.includes('Abstraktní') || fileName.includes('abstraktni');
            const isLiteratura = fileName.includes('Literatura') || fileName.includes('literatura');
            
            try {
                // Rozdělení řádku podle separátoru
                const parts = line.split(separator);
                
                // Zvolení správných indexů podle typu souboru
                let frontIndex, backIndex;
                
                if (isAbstractArt) {
                    frontIndex = 1; // Index pro přední stranu v Abstraktní umění
                    backIndex = 2;  // Index pro zadní stranu v Abstraktní umění
                } else if (isLiteratura) {
                    frontIndex = 2; // Index pro přední stranu v Literatura
                    backIndex = 3;  // Index pro zadní stranu v Literatura
                } else {
                    // Výchozí nastavení pro ostatní soubory
                    frontIndex = 1;
                    backIndex = 2;
                }
                
                // Ujistit se, že máme dostatečný počet částí
                if (parts.length <= Math.max(frontIndex, backIndex)) {
                    console.log(`Řádek ${i+1} nemá dostatečný počet částí, přeskakuji`);
                    continue;
                }
                
                // Vytvoření karty
                let front = parts[frontIndex] ? parts[frontIndex].trim() : '';
                let back = parts[backIndex] ? parts[backIndex].trim() : '';
                
                // Zpracování HTML obsahu
                if (isHtml) {
                    // Zpracovat obsah, pokud je HTML povoleno
                    front = processCardContentWithMedia(front);
                    back = processCardContentWithMedia(back);
                }
                
                // Přeskočit neplatné karty
                if (!front || !back) {
                    console.log('Přeskakuji řádek s prázdným obsahem');
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
                    tags: [fileName.toLowerCase().replace(/\s+/g, '_')]
                });
            } catch (lineError) {
                console.error(`Chyba při zpracování řádku ${i+1}:`, lineError);
                console.log(`Problematický řádek: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
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

/**
 * Zpracování obsahu kartiček obsahujících média
 * @param {string} content - Obsah kartičky
 * @returns {string} - Zpracovaný obsah
 */
function processCardContentWithMedia(content) {
    if (!content) return '';
    
    // Nahradit odkazy na lokální obrázky (pokud existují)
    const mediaPattern = /<img[^>]*src=["']([^"']+)["'][^>]*>/g;
    
    content = content.replace(mediaPattern, (match, src) => {
        // Pokud je odkaz relativní, upravit cestu
        if (!src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('images/')) {
            // Pokud je cesta k obrázku relativní, přidáme cestu k veřejným obrázkům
            const imageSrc = `images/${path.basename(src)}`;
            return match.replace(src, imageSrc);
        }
        return match;
    });
    
    return content;
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
                deck.name = "Literatura-Test-karticky"; // Nastavit standardní název
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
                if (file.toLowerCase().includes('literatura') && file.endsWith('.txt')) {
                    const filePath = path.join(kartickyDir, file);
                    console.log(`Zkouším alternativní soubor Literatura: ${filePath}`);
                    const deck = parseTextFile(filePath);
                    
                    if (deck) {
                        deck.name = "Literatura-Test-karticky";
                        console.log(`Úspěšně načten alternativní balíček s ${deck.cards.length} kartičkami`);
                        return deck;
                    }
                }
            }
        }
        
        // Pokud nepomohlo ani jedno, zkusíme vytvořit integrované kartičky
        console.log('Použití integrovaných kartiček');
        return createHardcodedDeck();
        
    } catch (error) {
        console.error('Chyba při získávání Literatura-Test-karticky z textového souboru:', error);
        return createHardcodedDeck();
    }
}

/**
 * Vytvoří hardcoded balíček kartiček pro případ, že selže načtení ze souboru
 * @returns {Object} - Hardcoded balíček kartiček
 */
function createHardcodedDeck() {
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
        id: `hardcoded${index}`,
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

module.exports = {
    parseTextFile,
    loadAllTextDecks,
    getLiteraturaFromTextFile,
    createHardcodedDeck,
    processCardContentWithMedia
};
