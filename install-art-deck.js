const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Script pro přímou instalaci balíčku Abstraktní umění
 */

function installAbstraktniUmeni() {
    console.log('===== INSTALACE BALÍČKU ABSTRAKTNÍ UMĚNÍ =====');

    // 1. Cesty k souborům
    const sourceFilePath = path.join(__dirname, 'public', 'Karticky', 'Abstraktní umění.txt');
    const destinationDir = path.join(__dirname, 'data');
    const imagesDir = path.join(__dirname, 'public', 'images');

    // 2. Zkontrolovat, zda existuje zdrojový soubor
    if (!fs.existsSync(sourceFilePath)) {
        const alternativeSourcePath = path.join(__dirname, 'public', 'Karticky', 'Abstraktni umeni.txt');
        
        if (fs.existsSync(alternativeSourcePath)) {
            console.log(`Nalezen alternativní soubor: ${alternativeSourcePath}`);
            // Použít alternativní soubor
            sourceFilePath = alternativeSourcePath;
        } else {
            console.error(`Chyba: Soubor s balíčkem nebyl nalezen.`);
            console.error(`Očekáván v: ${sourceFilePath}`);
            console.error(`nebo: ${alternativeSourcePath}`);
            return false;
        }
    }

    // 3. Vytvořit cílové složky, pokud neexistují
    if (!fs.existsSync(destinationDir)) {
        fs.mkdirSync(destinationDir, { recursive: true });
    }
    
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
    }

    // 4. Načíst a parsovat soubor s balíčkem
    try {
        console.log(`Načítám soubor: ${sourceFilePath}`);
        const content = fs.readFileSync(sourceFilePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim() !== '' && !line.startsWith('#'));
        
        console.log(`Balíček obsahuje ${lines.length} řádků`);

        // 5. Vytvořit karty
        const cards = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const parts = line.split('\t');
            
            if (parts.length < 3) {
                console.warn(`Přeskakuji řádek ${i+1}: Nedostatek sloupců`);
                continue;
            }
            
            const front = parts[1].trim();
            const back = parts[2].trim();
            
            if (!front || !back) {
                console.warn(`Přeskakuji řádek ${i+1}: Prázdný obsah`);
                continue;
            }
            
            // Generování ID
            const cardId = crypto.createHash('md5').update(`abstract_${i}_${front}`).digest('hex').substring(0, 8);
            
            // Extrahovat a zpracovat obrázky z HTML
            const processedFront = processImagesInHtml(front, imagesDir);
            
            // Přidat kartu
            cards.push({
                id: cardId,
                front: processedFront,
                back: back,
                tags: ["abstraktní_umění"]
            });
            
            console.log(`Vytvořena karta ${i+1}: ${cardId}`);
        }

        // 6. Vytvořit balíček
        const deck = {
            id: 'abstract_art_' + Date.now().toString(36),
            name: 'Abstraktní umění',
            cards: cards,
            created: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            source: 'textfile',
            format: 'html'
        };

        // 7. Uložit balíček samostatně (pro zálohování)
        const deckJsonPath = path.join(destinationDir, 'abstraktni-umeni.json');
        fs.writeFileSync(deckJsonPath, JSON.stringify(deck, null, 2));
        console.log(`Balíček uložen do ${deckJsonPath}`);

        // 8. Přidat balíček do hlavního souboru decks.json, pokud existuje
        const decksJsonPath = path.join(destinationDir, 'decks.json');
        let decks = [];
        
        if (fs.existsSync(decksJsonPath)) {
            try {
                const decksData = fs.readFileSync(decksJsonPath, 'utf8');
                decks = JSON.parse(decksData);
                console.log(`Načten existující decks.json s ${decks.length} balíčky`);
                
                // Odstranit případný existující balíček s podobným názvem
                decks = decks.filter(d => !d.name.includes('Abstraktní') && !d.name.includes('abstraktni'));
            } catch (err) {
                console.warn(`Nelze načíst decks.json, vytvářím nový: ${err.message}`);
                decks = [];
            }
        }
        
        // Přidat nový balíček
        decks.push(deck);
        
        // Uložit aktualizovaný decks.json
        fs.writeFileSync(decksJsonPath, JSON.stringify(decks, null, 2));
        console.log(`Balíček přidán do decks.json (celkem ${decks.length} balíčků)`);
        
        return true;
    } catch (error) {
        console.error('Chyba při instalaci balíčku:', error);
        return false;
    }
}

/**
 * Zpracuje HTML s obrázky, zajistí správnou cestu k obrázkům
 * @param {string} html - HTML obsah
 * @param {string} imagesDir - Cílová složka pro obrázky
 * @returns {string} - Upravené HTML
 */
function processImagesInHtml(html, imagesDir) {
    // Najít všechny obrázky ve formátu <img src="...">
    const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/g;
    let match;
    
    // Vytvořit kopii HTML pro úpravy
    let processedHtml = html;
    
    // Pro každý nalezený obrázek
    while ((match = imgRegex.exec(html)) !== null) {
        const originalSrc = match[1];
        
        // Pokud src neobsahuje 'images/', přesměrovat na 'images/'
        if (!originalSrc.startsWith('images/')) {
            const fileName = path.basename(originalSrc);
            const newSrc = `images/${fileName}`;
            
            // Nahradit cestu v HTML
            processedHtml = processedHtml.replace(
                new RegExp(`src=["']${originalSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'g'),
                `src="${newSrc}"`
            );
            
            console.log(`Upraven odkaz na obrázek: ${originalSrc} -> ${newSrc}`);
        }
    }
    
    return processedHtml;
}

// Pokud je skript spuštěn přímo, nainstalovat balíček
if (require.main === module) {
    const result = installAbstraktniUmeni();
    
    if (result) {
        console.log('\n===== INSTALACE DOKONČENA =====');
        console.log('Balíček byl úspěšně nainstalován.');
        console.log('Pro použití:');
        console.log('1. Spusťte server: npm start');
        console.log('2. Otevřete aplikaci v prohlížeči: http://localhost:3000');
        console.log('3. Měli byste vidět balíček "Abstraktní umění" v seznamu balíčků');
    } else {
        console.error('\n===== INSTALACE SELHALA =====');
        console.error('Prosím zkontrolujte výše uvedené chyby');
    }
}

module.exports = { installAbstraktniUmeni };
