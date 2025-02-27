const fs = require('fs');
const path = require('path');
const imageManager = require('./image-manager');
const https = require('https');
const http = require('http');

// Mapování obtížných názvů souborů na jednodušší
const IMAGE_MAP = {
    'Wassily_Kandinsky_-_Color_Study_Squares_with_Concentric_Circles_1913_-_(MeisterDrucke-1185849).jpg': 'kandinsky.jpg',
    'hera.jpg!Large.jpg': 'picabia_hera.jpg',
    '1023px-Francis_Picabia,_1913,_Udnie_(Young_American_Girl,_The_Dance),_oil_on_canvas,_290_x_300_cm,_Musée_National_.jpg': 'picabia_dance.jpg',
    'album_alb3342850.jpg': 'ciurlionis_sonata.jpg',
    '800px-Чёрный_супрематический_квадрат._1915._ГТГ.png': 'malevich_black_square.jpg',
    '8136.webp': 'mondrian_composition.jpg',
    'CZE_NG.O_5942.jpeg': 'kupka_amorfa.jpg',
    'Sykora04-Linie100.jpg': 'sykora_linie.jpg'
};

// Seznam URL pro stažení základních obrázků
const FALLBACK_IMAGES = [
    { url: 'https://upload.wikimedia.org/wikipedia/commons/b/b4/Wassily_Kandinsky_-_Color_Study_Squares_with_Concentric_Circles_%28Farbstudie_Quadrate%29_%281913%29.jpg', name: 'kandinsky.jpg' },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Malevich_-_Black_Square_%281915%29.jpg', name: 'malevich_black_square.jpg' },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/Piet_Mondriaan%2C_1930_-_Mondrian_Composition_II_in_Red%2C_Blue%2C_and_Yellow.jpg', name: 'mondrian_composition.jpg' },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Franti%C5%A1ek_Kupka_-_Amorpha%2C_Fugue_%C3%A0_deux_couleurs_%28Fugue_in_Two_Colors%29.jpg', name: 'kupka_amorfa.jpg' },
    { url: 'https://www.artplus.cz/uploads/img/timeline_item/z/d/e/c/zdeneksykoralinie23.jpeg', name: 'sykora_linie.jpg' }
];

// Složky pro práci se soubory
const SOURCE_IMAGE_DIR = path.join(__dirname, 'public', 'images');
const TARGET_IMAGE_DIR = path.join(__dirname, 'public', 'images');
const SOURCE_DECK_DIR = path.join(__dirname, 'public', 'Karticky');

// Funkce pro stažení souboru z URL
function downloadFile(url, destination) {
    return new Promise((resolve, reject) => {
        console.log(`Stahuji: ${url} -> ${destination}`);
        
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

// Funkce pro kontrolu a vytvoření složky
function ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
        console.log(`Vytvářím složku: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Funkce pro kopírování souboru
function copyFile(source, target) {
    return new Promise((resolve, reject) => {
        const rd = fs.createReadStream(source);
        const wr = fs.createWriteStream(target);
        
        rd.on('error', err => reject(err));
        wr.on('error', err => reject(err));
        wr.on('finish', () => resolve());
        
        rd.pipe(wr);
    });
}

// Hlavní funkce pro opravu obrázků
async function fixImagesForAbstractArt() {
    try {
        console.log('Začínám opravovat obrázky pro abstraktní umění...');
        
        // Ujistit se, že existují potřebné složky
        ensureDirectoryExists(TARGET_IMAGE_DIR);
        
        // 1. Kontrola, které originální soubory existují
        const existingFiles = fs.existsSync(SOURCE_IMAGE_DIR) ? fs.readdirSync(SOURCE_IMAGE_DIR) : [];
        console.log(`Nalezeno ${existingFiles.length} stávajících obrázků v ${SOURCE_IMAGE_DIR}`);
        
        // 2. Pro každý mapovaný soubor zkontrolovat, zda existuje zdrojový soubor
        const processedFiles = [];
        let missingCount = 0;
        
        for (const [originalName, newName] of Object.entries(IMAGE_MAP)) {
            const sourcePath = path.join(SOURCE_IMAGE_DIR, originalName);
            const targetPath = path.join(TARGET_IMAGE_DIR, newName);
            
            // Zkontrolovat, zda existuje cílový soubor
            if (fs.existsSync(targetPath)) {
                console.log(`✓ Cílový soubor ${newName} už existuje, přeskakuji`);
                processedFiles.push(newName);
                continue;
            }
            
            // Zkontrolovat, zda existuje zdrojový soubor
            if (fs.existsSync(sourcePath)) {
                console.log(`Kopíruji soubor: ${originalName} -> ${newName}`);
                await copyFile(sourcePath, targetPath);
                processedFiles.push(newName);
            } else {
                console.log(`✗ Zdrojový soubor nenalezen: ${originalName}`);
                missingCount++;
            }
        }
        
        // 3. Pokud nějaké soubory chybí, stáhnout záložní obrázky
        if (missingCount > 0) {
            console.log(`\nChybí ${missingCount} souborů, stahuji záložní obrázky...`);
            
            for (const imageInfo of FALLBACK_IMAGES) {
                const targetPath = path.join(TARGET_IMAGE_DIR, imageInfo.name);
                
                // Pokud soubor ještě neexistuje, stáhnout ho
                if (!fs.existsSync(targetPath) && !processedFiles.includes(imageInfo.name)) {
                    try {
                        await downloadFile(imageInfo.url, targetPath);
                        console.log(`✓ Stažen záložní soubor: ${imageInfo.name}`);
                        processedFiles.push(imageInfo.name);
                    } catch (err) {
                        console.error(`✗ Nepodařilo se stáhnout ${imageInfo.name}:`, err.message);
                    }
                }
            }
        }

        // 4. Vytvořit nový textový soubor s kartičkami
        const fixedDeckPath = path.join(SOURCE_DECK_DIR, 'fix-abstraktni-umeni-obrazky.txt');
        if (!fs.existsSync(fixedDeckPath)) {
            console.log('\nVytvářím opravený soubor s kartičkami...');
            
            // Obsah souboru je definován na začátku skriptu
            const fixedContent = `#separator:tab
#html:true
#name:Abstraktní umění - obrazová galerie

<img alt="Barevná studie" src="images/kandinsky.jpg" style="max-height: 300px;">	Vasilij Kandinskij - Soustředné Kruhy (1913). Jeden z nejznámějších obrazů tohoto průkopníka abstraktního umění.
<img alt="Hera" src="images/picabia_hera.jpg" style="max-height: 300px;">	Francis Picabia - Hera. Picabia byl francouzský avantgardní malíř a básník spojovaný s kubismem, dadaismem a surrealismem.
<img alt="Mladá americká dívka" src="images/picabia_dance.jpg" style="max-height: 300px;">	Francis Picabia - Mladá americká dívka (tanec), 1913. Malba kombinující prvky kubismu a futurismu, zachycující rytmus a pohyb.
<img alt="Sonata VI" src="images/ciurlionis_sonata.jpg" style="max-height: 300px;">	Mikalojus Konstantinas Čiurlionis - Sonáta č.6. Litevský skladatel a malíř, jehož dílo předjímalo abstraktní umění.
<img alt="Černý čtverec" src="images/malevich_black_square.jpg" style="max-height: 300px;">	Kazimir Malevič - Černý čtverec na bílém pozadí (1915). Ikona suprematismu a klíčové dílo abstraktního umění 20. století.
<img alt="Kompozice" src="images/mondrian_composition.jpg" style="max-height: 300px;">	Piet Mondrian - Kompozice v červené, žluté, modré a černé. Typické dílo neoplasticismu používající pouze základní barvy a pravoúhlé tvary.
<img alt="Amorfa" src="images/kupka_amorfa.jpg" style="max-height: 300px;">	František Kupka - Amorfa: Dvoubarevná fuga (1912). Jedno z prvních plně abstraktních děl v historii malířství.
<img alt="Sýkora - linie" src="images/sykora_linie.jpg" style="max-height: 300px;">	Zdeněk Sýkora - Linie č. 100. Průkopník využití počítačů v umění, tvořil struktury a linie generované algoritmicky.`;
            
            fs.writeFileSync(fixedDeckPath, fixedContent, 'utf8');
            console.log(`✓ Vytvořen opravený soubor: ${fixedDeckPath}`);
        } else {
            console.log(`Soubor ${fixedDeckPath} již existuje, přeskakuji vytvoření`);
        }
        
        console.log('\nOprava obrázků dokončena!');
        console.log(`\nProvedené změny:`);
        console.log('1. Zjednodušeny názvy obrázků pro lepší kompatibilitu');
        console.log('2. Staženy záložní verze obrázků, pokud originály chyběly');
        console.log('3. Vytvořen opravený soubor s kartičkami');
        console.log('\nPro použití opraveného balíčku:');
        console.log('1. Spusťte aplikaci: npm start');
        console.log('2. Klikněte na "Načíst z textu"');
        console.log('3. Klikněte na "Načíst kartičky ze složky"');
        console.log('4. Balíček by měl být viditelný jako "Abstraktní umění - obrazová galerie"');
    } catch (error) {
        console.error('Chyba při opravě obrázků:', error);
    }
}

// Spustit opravu
fixImagesForAbstractArt();

/**
 * Script pro opravu cest k obrázkům v balíčcích kartiček
 */
async function fixImagesInDecks() {
    console.log('===== OPRAVUJI CESTY K OBRÁZKŮM V BALÍČCÍCH =====');
    
    // Cesta k souboru decks.json
    const decksPath = path.join(__dirname, 'data', 'decks.json');
    
    // Kontrola, zda soubor existuje
    if (!fs.existsSync(decksPath)) {
        console.error(`Soubor ${decksPath} neexistuje!`);
        return false;
    }
    
    try {
        // Načíst balíčky
        const decksData = fs.readFileSync(decksPath, 'utf8');
        const decks = JSON.parse(decksData);
        
        console.log(`Načteno ${decks.length} balíčků`);
        
        let fixedCardsCount = 0;
        let fixedDecksCount = 0;
        
        // Zpracovat každý balíček
        for (const deck of decks) {
            console.log(`\nZpracovávám balíček: ${deck.name}`);
            
            let deckModified = false;
            
            // Zpracovat každou kartu
            for (let i = 0; i < deck.cards.length; i++) {
                const card = deck.cards[i];
                
                // Zpracování přední strany karty
                if (card.front && typeof card.front === 'string' && card.front.includes('<img')) {
                    try {
                        console.log(`Zpracovávám obrázky na přední straně karty ${i+1}`);
                        const processedFront = await imageManager.processHtmlWithImages(card.front);
                        
                        if (processedFront !== card.front) {
                            card.front = processedFront;
                            deckModified = true;
                            fixedCardsCount++;
                        }
                    } catch (frontError) {
                        console.error(`Chyba při zpracování přední strany karty ${i+1}:`, frontError);
                    }
                }
                
                // Zpracování zadní strany karty
                if (card.back && typeof card.back === 'string' && card.back.includes('<img')) {
                    try {
                        console.log(`Zpracovávám obrázky na zadní straně karty ${i+1}`);
                        const processedBack = await imageManager.processHtmlWithImages(card.back);
                        
                        if (processedBack !== card.back) {
                            card.back = processedBack;
                            deckModified = true;
                            if (!card.front.includes('<img')) {
                                fixedCardsCount++;
                            }
                        }
                    } catch (backError) {
                        console.error(`Chyba při zpracování zadní strany karty ${i+1}:`, backError);
                    }
                }
            }
            
            // Počítat upravené balíčky
            if (deckModified) {
                fixedDecksCount++;
                deck.lastModified = new Date().toISOString();
                console.log(`Balíček ${deck.name} byl aktualizován`);
            }
        }
        
        // Uložit aktualizované balíčky zpět
        if (fixedDecksCount > 0) {
            fs.writeFileSync(decksPath, JSON.stringify(decks, null, 2));
            console.log(`\n✅ Aktualizováno ${fixedDecksCount} balíčků a ${fixedCardsCount} karet`);
        } else {
            console.log('\n✅ Žádné balíčky nevyžadovaly aktualizaci');
        }
        
        // Vytvoření zálohy balíčku Abstraktní umění
        const artDeck = decks.find(d => d.name.includes('Abstraktní'));
        if (artDeck) {
            const artDeckPath = path.join(__dirname, 'data', 'abstraktni-umeni.json');
            fs.writeFileSync(artDeckPath, JSON.stringify(artDeck, null, 2));
            console.log(`Balíček Abstraktní umění byl zálohován do ${artDeckPath}`);
        }
        
        return true;
    } catch (error) {
        console.error('Chyba při opravě obrázků:', error);
        return false;
    }
}

// Spustit skript, pokud je volán přímo
if (require.main === module) {
    fixImagesInDecks()
        .then(success => {
            if (success) {
                console.log('\n===== OPRAVA DOKONČENA =====');
                console.log('Obrázky v kartičkách byly úspěšně opraveny.');
                console.log('Pro použití:');
                console.log('1. Spusťte server: npm start');
                console.log('2. Otevřete aplikaci v prohlížeči: http://localhost:3000');
            } else {
                console.error('\n===== OPRAVA SELHALA =====');
                console.error('Prosím zkontrolujte výše uvedené chyby');
            }
        })
        .catch(err => {
            console.error('\n===== NEOŠETŘENÁ CHYBA =====');
            console.error(err);
        });
}

module.exports = { fixImagesInDecks };
