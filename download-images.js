const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Cesta k textovému souboru s kartičkami
const sourceFile = path.join(__dirname, 'public', 'Karticky', 'abstraktni_umeni_obrazky.txt');
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
    });
}

// Funkce pro extrahování URL obrázků z textového souboru
async function extractImagesFromFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`Soubor ${filePath} neexistuje`);
        return [];
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const images = [];
    
    // Regulární výraz pro hledání img tagů
    const imgRegex = /<img.*?src=["'](.*?)["'].*?>/g;
    let match;
    
    while (match = imgRegex.exec(content)) {
        const src = match[1];
        if (src && src.startsWith('images/')) {
            // Extrahovat pouze název souboru z cesty
            const fileName = src.replace('images/', '');
            images.push({
                fileName: fileName,
                localPath: path.join(targetDir, fileName)
            });
        }
    }
    
    return images;
}

// Hlavní funkce
async function main() {
    try {
        // Ujistit se, že cílový adresář existuje
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
            console.log(`Vytvořena složka: ${targetDir}`);
        }
        
        // Získat seznam obrázků z textového souboru
        const images = await extractImagesFromFile(sourceFile);
        console.log(`Nalezeno ${images.length} obrázků v souboru ${sourceFile}`);
        
        // Zobrazit seznam souborů, které je potřeba stáhnout
        console.log('\nPro plnou funkčnost kartiček je potřeba mít následující soubory ve složce images:');
        images.forEach((img, index) => {
            console.log(`${index + 1}. ${img.fileName}`);
        });
        
        // Zobrazit instrukce
        console.log('\nPokud již máte tyto soubory, umístěte je do složky:');
        console.log(targetDir);
        console.log('\nJinak budete muset stáhnout obrázky ručně z jejich zdrojů a umístit je do této složky.');
        console.log('\nPro správné zobrazení kartiček je důležité, aby názvy souborů přesně odpovídaly výše uvedenému seznamu.');
        
    } catch (error) {
        console.error('Chyba:', error);
    }
}

main();
