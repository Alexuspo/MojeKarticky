const fs = require('fs');
const path = require('path');

// Funkce pro výpis obsahu adresáře a podadresářů
function listDirectoryContents(directoryPath, prefix = '') {
    console.log(`${prefix}📁 ${path.basename(directoryPath)}/`);

    try {
        // Získat seznam souborů a složek
        const items = fs.readdirSync(directoryPath);
        
        // Rozdělit na soubory a složky
        const directories = [];
        const files = [];
        
        for (const item of items) {
            const itemPath = path.join(directoryPath, item);
            const stats = fs.statSync(itemPath);
            
            if (stats.isDirectory()) {
                directories.push(item);
            } else {
                files.push({
                    name: item,
                    size: stats.size,
                    modified: stats.mtime
                });
            }
        }
        
        // Nejprve vypsat soubory
        for (const file of files) {
            console.log(`${prefix}  📄 ${file.name} (${formatFileSize(file.size)}, poslední změna: ${file.modified.toLocaleDateString()})`);
        }
        
        // Pak rekurzivně vypsat složky
        for (const dir of directories) {
            const dirPath = path.join(directoryPath, dir);
            listDirectoryContents(dirPath, `${prefix}  `);
        }
    } catch (error) {
        console.error(`Chyba při čtení adresáře ${directoryPath}:`, error);
    }
}

// Formátování velikosti souboru
function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// Hlavní funkce
function main() {
    console.log('============================================');
    console.log('📋 Kontrola souborů pro Moje Kartičky');
    console.log('============================================');
    
    // Získat cestu k aktuálnímu adresáři
    const rootDir = __dirname;
    console.log(`Rootdir: ${rootDir}`);
    
    // Vypsat obsah public/Karticky
    const kartickyDir = path.join(rootDir, 'public', 'Karticky');
    
    try {
        if (fs.existsSync(kartickyDir)) {
            console.log('\n📁 Obsah složky public/Karticky:');
            listDirectoryContents(kartickyDir);
        } else {
            console.log(`\n❌ Složka ${kartickyDir} neexistuje!`);
            console.log('Vytvářím složku...');
            
            try {
                fs.mkdirSync(kartickyDir, { recursive: true });
                console.log(`✅ Složka ${kartickyDir} byla úspěšně vytvořena!`);
            } catch (mkdirErr) {
                console.error(`❌ Nepodařilo se vytvořit složku ${kartickyDir}:`, mkdirErr);
            }
        }
    } catch (error) {
        console.error('Chyba při kontrole složky public/Karticky:', error);
    }

    console.log('\n============================================');
    console.log('📋 Zkontrolujte umístění textového souboru');
    console.log('============================================');
    console.log('Pro správné načtení kartiček:');
    console.log('1. Ujistěte se, že soubor "Literatura - Test karticky..txt" je ve složce public/Karticky');
    console.log('2. Spusťte aplikaci příkazem: npm start');
    console.log('3. V aplikaci klikněte na tlačítko "Načíst z textu"');
}

// Spuštění hlavní funkce
main();
