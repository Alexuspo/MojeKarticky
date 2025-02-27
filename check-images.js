/**
 * Kontrolní skript pro ověření dostupnosti obrázků
 */

const fs = require('fs');
const path = require('path');

// Hlavní funkce pro kontrolu dostupnosti obrázků
function checkImages() {
    console.log('Kontroluji dostupnost obrázků pro abstraktní umění...');
    
    // Cesta ke složce s obrázky
    const imagesDir = path.join(__dirname, 'public', 'images');
    
    // Kontrola existence složky
    if (!fs.existsSync(imagesDir)) {
        console.error(`CHYBA: Složka s obrázky neexistuje: ${imagesDir}`);
        console.log('Vytvářím složku...');
        try {
            fs.mkdirSync(imagesDir, { recursive: true });
            console.log(`Složka vytvořena: ${imagesDir}`);
        } catch (err) {
            console.error(`Nepodařilo se vytvořit složku: ${err.message}`);
            return;
        }
    }
    
    // Získání seznamu souborů
    let files = [];
    try {
        files = fs.readdirSync(imagesDir);
        console.log(`Nalezeno ${files.length} souborů ve složce`);
    } catch (err) {
        console.error(`CHYBA: Nepodařilo se načíst obsah složky: ${err.message}`);
        return;
    }
    
    // Zjistit, které obrázky jsou použity v tekstových balíčcích
    const textDeckFiles = findTextDeckFiles();
    const requiredImages = extractImagesFromTextDecks(textDeckFiles);
    
    console.log(`\nVýsledky kontroly obrazků:\n`);
    console.log(`Celkem je potřeba ${requiredImages.length} obrázků`);
    
    // Kontrola každého požadovaného obrázku
    let missing = 0;
    for (const image of requiredImages) {
        if (files.includes(image)) {
            console.log(`✓ Nalezen: ${image}`);
        } else {
            console.log(`✗ CHYBÍ: ${image}`);
            missing++;
        }
    }
    
    console.log(`\nSOUHRN: ${missing} chybějících obrázků z ${requiredImages.length} celkem.`);
    
    if (missing > 0) {
        console.log(`\nPro zajištění správného fungování aplikace je potřeba doplnit chybějící obrázky.`);
        console.log(`Umístěte je do složky: ${imagesDir}`);
    } else {
        console.log(`\nVšechny potřebné obrázky jsou k dispozici.`);
    }
}

// Funkce pro nalezení textových souborů s balíčky
function findTextDeckFiles() {
    const textDecksDir = path.join(__dirname, 'public', 'Karticky');
    
    if (!fs.existsSync(textDecksDir)) {
        console.warn(`Složka s textovými balíčky neexistuje: ${textDecksDir}`);
        return [];
    }
    
    try {
        const files = fs.readdirSync(textDecksDir);
        const textFiles = files.filter(file => 
            file.endsWith('.txt') && 
            (file.toLowerCase().includes('abstrakt') || file.toLowerCase().includes('umeni'))
        );
        
        console.log(`Nalezeno ${textFiles.length} relevantních textových souborů`);
        return textFiles.map(file => path.join(textDecksDir, file));
    } catch (err) {
        console.error(`Chyba při hledání textových balíčků: ${err.message}`);
        return [];
    }
}

// Funkce pro extrakci odkazů na obrázky z textových balíčků
function extractImagesFromTextDecks(filePaths) {
    const imageSet = new Set();
    
    // Projít všechny soubory
    for (const filePath of filePaths) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Hledat odkazy na obrázky
            const imgRegex = /src=["'](?:images\/)?([^"']+)["']/g;
            let match;
            
            while (match = imgRegex.exec(content)) {
                const imageName = match[1];
                imageSet.add(imageName);
            }
            
        } catch (err) {
            console.error(`Chyba při zpracování souboru ${filePath}: ${err.message}`);
        }
    }
    
    // Vrátit jedinečné názvy obrázků
    return Array.from(imageSet);
}

// Spustit kontrolu
checkImages();
