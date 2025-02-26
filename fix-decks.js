const fs = require('fs');
const path = require('path');
const textParser = require('./text-parser');

/**
 * Nástroj pro diagnostiku a opravu balíčků kartiček
 */
function diagnoseDeckIssues() {
    console.log('===== DIAGNOSTIKA BALÍČKŮ KARTIČEK =====\n');
    
    // 1. Zkontrolovat textové soubory v adresáři Karticky
    const kartickyDir = path.join(__dirname, 'public', 'Karticky');
    if (!fs.existsSync(kartickyDir)) {
        console.error(`! CHYBA: Složka ${kartickyDir} neexistuje!`);
        
        // Vytvořit složku
        try {
            fs.mkdirSync(kartickyDir, { recursive: true });
            console.log(`✓ Vytvořena chybějící složka ${kartickyDir}`);
        } catch (err) {
            console.error(`! KRITICKÁ CHYBA: Nepodařilo se vytvořit složku ${kartickyDir}: ${err.message}`);
            return false;
        }
    }
    
    // 2. Najít textové soubory
    let textFiles = [];
    try {
        const files = fs.readdirSync(kartickyDir);
        textFiles = files.filter(file => file.endsWith('.txt'));
        
        if (textFiles.length === 0) {
            console.error('! CHYBA: Ve složce Karticky nejsou žádné textové soubory!');
            
            // Vytvořit ukázkový soubor
            try {
                require('./setup');
                console.log('✓ Spuštěn setup.js pro vytvoření ukázkových souborů');
                
                // Znovu načíst soubory
                const updatedFiles = fs.readdirSync(kartickyDir);
                textFiles = updatedFiles.filter(file => file.endsWith('.txt'));
                
                if (textFiles.length === 0) {
                    console.error('! KRITICKÁ CHYBA: Ani po spuštění setup.js nejsou žádné soubory!');
                    return false;
                }
                console.log(`✓ Nyní nalezeno ${textFiles.length} textových souborů`);
            } catch (setupErr) {
                console.error(`! KRITICKÁ CHYBA: Nelze spustit setup.js: ${setupErr.message}`);
                return false;
            }
        }
    } catch (err) {
        console.error(`! KRITICKÁ CHYBA: Nelze číst složku ${kartickyDir}: ${err.message}`);
        return false;
    }
    
    // 3. Vyzkoušet zpracování každého textového souboru
    console.log('\n----- ANALÝZA TEXTOVÝCH SOUBORŮ -----\n');
    
    let successCount = 0;
    let failCount = 0;
    
    for (const file of textFiles) {
        const filePath = path.join(kartickyDir, file);
        console.log(`> Kontroluji soubor: ${file}`);
        
        try {
            // Zkusit načíst
            const deck = textParser.parseTextFile(filePath);
            
            if (deck && deck.cards && deck.cards.length > 0) {
                console.log(`  ✓ Úspěšně zpracováno ${deck.cards.length} karet`);
                successCount++;
            } else {
                console.log(`  ! Soubor neobsahuje žádné platné karty`);
                failCount++;
                
                // Pokus o opravu - zkontrolovat formát souboru
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const lines = content.split('\n');
                    
                    // Zkontrolovat, zda má soubor hlavičky
                    if (!lines.some(line => line.startsWith('#'))) {
                        console.log('  ! Soubor nemá hlavičku s nastavením, přidávám...');
                        
                        // Přidat hlavičku
                        const newContent = `#separator:tab\n#html:true\n#notetype column:1\n#deck column:2\n#tags column:5\n${content}`;
                        fs.writeFileSync(filePath, newContent);
                        console.log('  ✓ Přidána hlavička do souboru');
                        
                        // Zkusit znovu načíst
                        const fixedDeck = textParser.parseTextFile(filePath);
                        if (fixedDeck && fixedDeck.cards && fixedDeck.cards.length > 0) {
                            console.log(`  ✓ Po opravě úspěšně zpracováno ${fixedDeck.cards.length} karet`);
                            successCount++;
                            failCount--;
                        }
                    }
                } catch (fixErr) {
                    console.error(`  ! Nepodařilo se opravit soubor: ${fixErr.message}`);
                }
            }
        } catch (err) {
            console.error(`  ! Chyba při zpracování souboru: ${err.message}`);
            failCount++;
        }
    }
    
    // 4. Zkontrolovat data adresář
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        console.log('\n! Adresář data neexistuje, vytvářím...');
        try {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log('✓ Vytvořen adresář data');
        } catch (err) {
            console.error(`! Nepodařilo se vytvořit adresář data: ${err.message}`);
        }
    }
    
    // 5. Zkontrolovat platnost decks.json, pokud existuje
    const decksFile = path.join(dataDir, 'decks.json');
    if (fs.existsSync(decksFile)) {
        try {
            const decksData = fs.readFileSync(decksFile, 'utf8');
            const decks = JSON.parse(decksData);
            console.log(`\n✓ Soubor decks.json existuje a obsahuje ${decks.length} balíčků`);
        } catch (err) {
            console.error(`\n! Soubor decks.json je poškozený: ${err.message}`);
            console.log('  Vytvářím zálohu a připravuji nový...');
            
            try {
                // Vytvořit zálohu poškozeného souboru
                const backupPath = path.join(dataDir, `decks.json.backup-${Date.now()}`);
                fs.renameSync(decksFile, backupPath);
                console.log(`✓ Záloha vytvořena: ${backupPath}`);
                
                // Vytvořit nový soubor z načtených balíčků
                const newDecks = [];
                for (const file of textFiles) {
                    try {
                        const deck = textParser.parseTextFile(path.join(kartickyDir, file));
                        if (deck) newDecks.push(deck);
                    } catch (e) {}
                }
                
                if (newDecks.length > 0) {
                    fs.writeFileSync(decksFile, JSON.stringify(newDecks, null, 2));
                    console.log(`✓ Vytvořen nový decks.json s ${newDecks.length} balíčky`);
                } else {
                    console.log('! Nelze vytvořit nový decks.json - žádné balíčky nezpracovány');
                }
            } catch (fixErr) {
                console.error(`! Nepodařilo se opravit decks.json: ${fixErr.message}`);
            }
        }
    } else {
        console.log('\n! Soubor decks.json neexistuje, bude vytvořen při spuštění aplikace');
    }
    
    // 6. Shrnutí a doporučení
    console.log('\n===== SHRNUTÍ DIAGNOSTIKY =====');
    console.log(`✓ Zpracováno souborů: ${successCount}`);
    console.log(`✗ Problematických souborů: ${failCount}`);
    
    if (failCount > 0) {
        console.log('\nPro opravu zkuste:');
        console.log('1. Spusťte "npm run setup" pro vytvoření ukázkových souborů');
        console.log('2. Restartujte aplikaci "npm run restart"');
        console.log('3. Po spuštění klikněte na "Načíst z textu"');
        return false;
    } else {
        console.log('\nVše vypadá v pořádku! Pro použití:');
        console.log('1. Spusťte aplikaci "npm start"');
        console.log('2. V prohlížeči otevřete http://localhost:3000');
        console.log('3. Klikněte na "Načíst z textu" pro načtení balíčků');
        return true;
    }
}

// Spustit diagnostiku, pokud je tento soubor spuštěn přímo
if (require.main === module) {
    diagnoseDeckIssues();
}

module.exports = { diagnoseDeckIssues };
