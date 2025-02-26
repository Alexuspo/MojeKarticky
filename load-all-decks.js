const fs = require('fs');
const path = require('path');
const textParser = require('./text-parser');

/**
 * Načte všechny balíčky kartiček z textových souborů
 */
function loadAllDecksList() {
    console.log('===== NAČÍTÁNÍ VŠECH BALÍČKŮ KARTIČEK =====');
    
    // Cesta ke složce s textovými soubory
    const kartickyDir = path.join(__dirname, 'public', 'Karticky');
    
    // Kontrola, zda složka existuje
    if (!fs.existsSync(kartickyDir)) {
        console.error(`Složka ${kartickyDir} neexistuje!`);
        return;
    }
    
    // Získání seznamu souborů
    try {
        const files = fs.readdirSync(kartickyDir);
        
        console.log(`\nNalezeny následující soubory ve složce ${kartickyDir}:`);
        files.forEach(file => {
            const filePath = path.join(kartickyDir, file);
            const stats = fs.statSync(filePath);
            const fileSize = stats.size / 1024; // velikost v KB
            
            if (stats.isDirectory()) {
                console.log(` - [ADRESÁŘ] ${file}`);
            } else {
                console.log(` - ${file} (${fileSize.toFixed(2)} KB)`);
            }
        });
        
        // Filtrovat jen textové soubory
        const textFiles = files.filter(file => file.endsWith('.txt'));
        
        if (textFiles.length === 0) {
            console.log('\nŽádné textové soubory nebyly nalezeny!');
            return;
        }
        
        console.log(`\nNalezeno ${textFiles.length} textových souborů s potenciálními kartičkami:`);
        
        // Detailní informace o každém souboru
        textFiles.forEach((file, index) => {
            const filePath = path.join(kartickyDir, file);
            
            // Základní analýza obsahu
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const lines = content.split('\n');
                const nonEmptyLines = lines.filter(line => line.trim() !== '').length;
                const headerLines = lines.filter(line => line.startsWith('#')).length;
                
                console.log(`\n${index + 1}. Soubor: ${file}`);
                console.log(`   - Počet řádků: ${lines.length} (neprázdných: ${nonEmptyLines})`);
                console.log(`   - Počet hlavičkových řádků: ${headerLines}`);
                
                // Odhad počtu kartiček
                const estimatedCards = nonEmptyLines - headerLines;
                console.log(`   - Odhadovaný počet kartiček: ${estimatedCards}`);
                
                // Detekce formátu
                if (content.includes('\t')) {
                    console.log('   - Detekován formát s tabulátory jako oddělovači');
                } else if (content.includes(';')) {
                    console.log('   - Detekován formát se středníky jako oddělovači');
                } else {
                    console.log('   - Neurčený formát oddělovačů');
                }
                
                // Detekce HTML obsahu
                if (content.includes('<img') || content.includes('<br>') || content.includes('<p>')) {
                    console.log('   - Detekován HTML obsah');
                }
                
                // Ukázka prvního řádku obsahu
                if (lines.length > headerLines) {
                    const sampleLine = lines.find(line => !line.startsWith('#') && line.trim() !== '');
                    if (sampleLine) {
                        console.log(`   - Ukázka obsahu: ${sampleLine.substring(0, 80)}${sampleLine.length > 80 ? '...' : ''}`);
                    }
                }
            } catch (err) {
                console.error(`   - Chyba při analýze souboru: ${err.message}`);
            }
        });
        
        console.log('\n===== ZKOUŠKA NAČÍTÁNÍ BALÍČKŮ =====');
        
        // Zkusit načíst balíčky
        const decks = textParser.loadAllTextDecks(kartickyDir);
        
        if (decks.length === 0) {
            console.log('Nepodařilo se načíst žádné balíčky kartiček.');
        } else {
            console.log(`Úspěšně načteno ${decks.length} balíčků kartiček:`);
            decks.forEach(deck => {
                console.log(`- ${deck.name} (${deck.cards.length} kartiček)`);
            });
            
            console.log('\nPro zobrazení balíčků v aplikaci:');
            console.log('1. Spusťte aplikaci příkazem: npm start');
            console.log('2. Otevřete webový prohlížeč na adrese: http://localhost:3000');
            console.log('3. Klikněte na tlačítko "Načíst z textu" v navigaci');
        }
    } catch (error) {
        console.error('Chyba při listování souborů:', error);
    }
}

// Spustit, pokud je skript přímo volán
if (require.main === module) {
    loadAllDecksList();
}

module.exports = { loadAllDecksList };
