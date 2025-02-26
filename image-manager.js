const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

/**
 * Nástroj pro správu obrázků v aplikaci
 */
class ImageManager {
    constructor() {
        this.imagesDir = path.join(__dirname, 'public', 'images');
        this.ensureDirectory();
    }

    /**
     * Zajistí existenci adresáře pro obrázky
     */
    ensureDirectory() {
        if (!fs.existsSync(this.imagesDir)) {
            try {
                fs.mkdirSync(this.imagesDir, { recursive: true });
                console.log(`Vytvořen adresář pro obrázky: ${this.imagesDir}`);
            } catch (err) {
                console.error(`Nepodařilo se vytvořit adresář pro obrázky: ${err.message}`);
            }
        }
    }

    /**
     * Stáhne obrázek z URL a uloží ho do adresáře pro obrázky
     * @param {string} imageUrl - URL obrázku
     * @returns {Promise<string>} - Cesta k uloženému obrázku
     */
    async downloadImage(imageUrl) {
        return new Promise((resolve, reject) => {
            if (!imageUrl || (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
                return reject(new Error(`Neplatná URL: ${imageUrl}`));
            }

            const fileName = path.basename(imageUrl.split('?')[0]);
            const destination = path.join(this.imagesDir, fileName);

            // Pokud soubor už existuje, nestahujem znovu
            if (fs.existsSync(destination)) {
                return resolve(destination);
            }

            console.log(`Stahuji obrázek: ${imageUrl}`);

            const protocol = imageUrl.startsWith('https') ? https : http;
            const request = protocol.get(imageUrl, response => {
                // Zpracování přesměrování
                if (response.statusCode === 301 || response.statusCode === 302) {
                    return this.downloadImage(response.headers.location)
                        .then(resolve)
                        .catch(reject);
                }

                // Kontrola stavového kódu
                if (response.statusCode !== 200) {
                    return reject(new Error(`HTTP kód ${response.statusCode} pro ${imageUrl}`));
                }

                const fileStream = fs.createWriteStream(destination);
                fileStream.on('finish', () => {
                    fileStream.close();
                    console.log(`Uložen obrázek: ${fileName}`);
                    resolve(destination);
                });

                fileStream.on('error', err => {
                    fs.unlinkSync(destination);
                    reject(err);
                });

                response.pipe(fileStream);
            });

            request.on('error', err => {
                reject(err);
            });

            request.setTimeout(10000, () => {
                request.abort();
                reject(new Error(`Časový limit vypršel při stahování ${imageUrl}`));
            });
        });
    }

    /**
     * Kopíruje lokální soubor do adresáře pro obrázky
     * @param {string} sourcePath - Zdrojová cesta k souboru
     * @returns {Promise<string>} - Cesta k zkopírovanému souboru
     */
    async copyLocalImage(sourcePath) {
        return new Promise((resolve, reject) => {
            try {
                if (!fs.existsSync(sourcePath)) {
                    return reject(new Error(`Zdrojový soubor neexistuje: ${sourcePath}`));
                }

                const fileName = path.basename(sourcePath);
                const destination = path.join(this.imagesDir, fileName);

                // Pokud soubor už existuje, nekopírujeme znovu
                if (fs.existsSync(destination) && 
                    fs.statSync(sourcePath).size === fs.statSync(destination).size) {
                    return resolve(destination);
                }

                const readStream = fs.createReadStream(sourcePath);
                const writeStream = fs.createWriteStream(destination);

                readStream.on('error', err => {
                    reject(err);
                });

                writeStream.on('error', err => {
                    reject(err);
                });

                writeStream.on('finish', () => {
                    console.log(`Zkopírován obrázek: ${fileName}`);
                    resolve(destination);
                });

                readStream.pipe(writeStream);
            } catch (err) {
                reject(err);
            }
        });
    }

    /**
     * Najde všechny URL obrázků v HTML řetězci
     * @param {string} html - HTML řetězec
     * @returns {string[]} - Pole URL obrázků
     */
    extractImagesFromHtml(html) {
        const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/g;
        const urls = [];
        let match;

        while ((match = imgRegex.exec(html)) !== null) {
            urls.push(match[1]);
        }

        return urls;
    }

    /**
     * Zpracuje HTML s obrázky, stáhne obrázky a aktualizuje cesty
     * @param {string} html - HTML obsah s obrázky
     * @returns {Promise<string>} - HTML s aktualizovanými cestami k obrázkům
     */
    async processHtmlWithImages(html) {
        if (!html || typeof html !== 'string') {
            return html;
        }

        // Extrahovat URL obrázků
        const imageUrls = this.extractImagesFromHtml(html);
        if (imageUrls.length === 0) {
            return html;
        }

        let processedHtml = html;
        
        // Zpracovat každý obrázek
        for (const url of imageUrls) {
            try {
                // Pokud URL již ukazuje na images/ adresář, přeskočit
                if (url.startsWith('images/')) {
                    continue;
                }

                let localPath;
                
                // Podle typu URL buď stáhnout nebo zkopírovat
                if (url.startsWith('http://') || url.startsWith('https://')) {
                    localPath = await this.downloadImage(url);
                } else {
                    // Relativní cesta, pokusit se najít lokálně
                    const sourcePath = path.join(__dirname, 'public', url);
                    localPath = await this.copyLocalImage(sourcePath);
                }

                // Nahradit URL v HTML
                const fileName = path.basename(localPath);
                const newSrc = `images/${fileName}`;
                
                // Použít regex pro nahrazení, aby se vyhnulo problémům s URL obsahujícím speciální znaky
                const urlRegex = new RegExp(`src=["']${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'g');
                processedHtml = processedHtml.replace(urlRegex, `src="${newSrc}"`);
                
                console.log(`Obrázek zpracován: ${url} -> ${newSrc}`);
            } catch (err) {
                console.error(`Chyba při zpracování obrázku ${url}: ${err.message}`);
                // Pokračovat s dalšími obrázky i když jeden selže
            }
        }

        return processedHtml;
    }
}

// Vytvořit instanci pro přímé použití v jiných modulech
const imageManager = new ImageManager();

// Pokud je skript spuštěn přímo, provést testovací operaci
if (require.main === module) {
    console.log('Spouštím test image-manager.js...');
    
    // Jednoduchý test funkčnosti
    const testHtml = `<div><img src="test.jpg" alt="Test"> <img src="https://via.placeholder.com/150" alt="Placeholder"></div>`;
    
    imageManager.processHtmlWithImages(testHtml)
        .then(result => {
            console.log('Zpracované HTML:', result);
            console.log('Test dokončen.');
        })
        .catch(error => {
            console.error('Test selhal:', error);
        });
}

module.exports = imageManager;
