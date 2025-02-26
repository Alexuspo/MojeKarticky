const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const cheerio = require('cheerio');

// Cesta k textovému souboru s kartičkami
let sourceFile = path.join(__dirname, 'public', 'Karticky', 'Abstraktní umění.txt');
// Cílová složka pro obrázky
const targetDir = path.join(__dirname, 'public', 'images');

// Funkce pro stažení souboru z URL
function downloadFile(url, destination) {
    return new Promise((resolve, reject) => {
        // Zjistit správný protokol (http nebo https)
        const protocol = url.startsWith('https') ? https : http;
        
        const request = protocol.get(url, response => {
            // Přesměrování
            if (response.statusCode === 301 || response.statusCode === 302) {
                console.log(`Přesměrování z ${url} na ${response.headers.location}`);
                return downloadFile(response.headers.location, destination)
                    .then(resolve)
                    .catch(reject);
            }
            
            if (response.statusCode !== 200) {
                return reject(new Error(`Status code ${response.statusCode} for ${url}`));
            }
            
            const file = fs.createWriteStream(destination);
            
            file.on('finish', () => {
                file.close(() => resolve(destination));
            });
            
            file.on('error', err => {
                fs.unlink(destination, () => {}); // Odstranit nezdařený soubor
                reject(err);
            });
            
            response.pipe(file);
        });
        
        request.on('error', err => {
            reject(err);
        });
        
        // Časový limit na stažení (30 sekund)
        request.setTimeout(30000, function() {
            request.abort();
            reject(new Error(`Timeout after 30s for ${url}`));
        });
    });
}

// Funkce pro extrahování URL obrázků z textového souboru
async function extractImagesFromFile(filePath) {
    try {
        console.log(`Čtu soubor: ${filePath}`);
        if (!fs.existsSync(filePath)) {
            console.error(`Soubor ${filePath} neexistuje`);
            return [];
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        const images = [];
        
        // Dočasné parsování pomocí cheerio pro extrakci obrázků
        const lines = content.split('\n');
        
        for (const line of lines) {
            if (!line.includes('<img')) continue;
            
            // Použít cheerio pro parsování HTML obsahu
            const $ = cheerio.load(line);
            
            $('img').each((i, img) => {
                // Získat URL obrázku z atributu src
                const src = $(img).attr('src');
                if (src) {
                    // Extrahovat název souboru z URL
                    let fileName = path.basename(src).split('!')[0]; // Odstranit případné parametry za !
                    
                    // Případně odstranit query parametry
                    fileName = fileName.split('?')[0];
                    
                    // Přidat informace o obrázku
                    images.push({
                        original: src,
                        fileName: fileName,
                        alt: $(img).attr('alt') || 'Umělecké dílo'
                    });
                }
            });
        }
        
        console.log(`Nalezeno ${images.length} odkazů na obrázky`);
        return images;
    } catch (err) {
        console.error('Chyba při čtení souboru:', err);
        return [];
    }
}

// Funkce pro vytvoření lokální cesty k obrázku
function createLocalImageName(fileName) {
    // Upravit název pro použití v souborovém systému
    return fileName.replace(/[^a-zA-Z0-9\-_.]/g, '_');
}

// Funkce pro aktualizaci odkazů v souboru
async function updateImageLinks(filePath, images) {
    try {
        console.log('Aktualizuji odkazy v souboru...');
        let content = fs.readFileSync(filePath, 'utf8');
        
        for (const img of images) {
            // Pokud byl obrázek úspěšně stažen, aktualizovat odkaz
            if (img.localPath) {
                const localFileName = path.basename(img.localPath);
                // Nahradit původní URL lokálním souborem
                const regex = new RegExp(`src=["']${img.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'g');
                content = content.replace(regex, `src="images/${localFileName}"`);
            }
        }
        
        // Uložit aktualizovaný soubor
        const backupPath = `${filePath}.backup`;
        fs.writeFileSync(backupPath, fs.readFileSync(filePath)); // Nejdřív vytvořit zálohu
        fs.writeFileSync(filePath, content);
        console.log(`Soubor aktualizován, záloha uložena jako ${backupPath}`);
        
        return true;
    } catch (err) {
        console.error('Chyba při aktualizaci odkazů:', err);
        return false;
    }
}

// Hlavní funkce pro stažení obrázků
async function downloadImages(imageFile) {
    if (imageFile) {
        sourceFile = imageFile;
    }
    
    console.log(`Spouštím stahování obrázků pro soubor: ${sourceFile}`);
    
    // Ujistit se, že cílový adresář existuje
    if (!fs.existsSync(targetDir)) {
        try {
            fs.mkdirSync(targetDir, { recursive: true });
            console.log(`Vytvořena složka pro obrázky: ${targetDir}`);
        } catch (err) {
            console.error(`Nepodařilo se vytvořit složku ${targetDir}:`, err);
            return;
        }
    }
    
    // Získat odkazy na obrázky ze souboru
    const images = await extractImagesFromFile(sourceFile);
    
    if (images.length === 0) {
        console.log('Nenalezeny žádné obrázky ke stažení.');
        return;
    }
    
    console.log(`Začínám stahovat ${images.length} obrázků...`);
    
    // Stáhnout každý obrázek
    for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const localFileName = createLocalImageName(img.fileName);
        const destination = path.join(targetDir, localFileName);
        
        // Přeskočit, pokud soubor už existuje
        if (fs.existsSync(destination)) {
            console.log(`[${i+1}/${images.length}] Soubor ${localFileName} již existuje, přeskakuji...`);
            img.localPath = destination;
            continue;
        }
        
        try {
            console.log(`[${i+1}/${images.length}] Stahuji: ${img.original}`);
            
            // Zjistit, zda URL začíná http/https
            if (!img.original.match(/^https?:\/\//)) {
                console.log(`  Neplatná URL: ${img.original}, přeskakuji...`);
                continue;
            }
            
            // Stáhnout obrázek
            const downloadedPath = await downloadFile(img.original, destination);
            console.log(`  Uloženo jako: ${path.basename(downloadedPath)}`);
            img.localPath = downloadedPath;
        } catch (err) {
            console.error(`  Chyba při stahování ${img.original}:`, err.message);
        }
    }
    
    // Aktualizovat odkazy v souboru
    const updated = await updateImageLinks(sourceFile, images);
    
    if (updated) {
        console.log(`\nStatistika:`);
        console.log(`- Celkem nalezeno: ${images.length} obrázků`);
        console.log(`- Úspěšně staženo: ${images.filter(img => img.localPath).length} obrázků`);
        console.log(`- Chyba při stahování: ${images.length - images.filter(img => img.localPath).length} obrázků`);
        console.log('\nObrázky byly staženy a odkazy aktualizovány. Pro zobrazení spusťte aplikaci a načtěte kartičky.');
    } else {
        console.log('\nObrázky byly staženy, ale nepodařilo se aktualizovat odkazy. Prosím, zkontrolujte soubor ručně.');
    }
}

// Spustit stahování, pokud je tento soubor spuštěn přímo
if (require.main === module) {
    // Zkontrolovat, zda byl předán parametr s jiným souborem
    const args = process.argv.slice(2);
    if (args.length > 0) {
        downloadImages(args[0]);
    } else {
        downloadImages();
    }
}

module.exports = { downloadImages };
