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

/**
 * Skript pro přímou instalaci balíčku abstraktního umění
 * Spouští se příkazem: node install-art-deck.js
 */

console.log('Zahajuji instalaci balíčku Abstraktní umění...');

// Funkce pro vytvoření složky, pokud neexistuje
function ensureDirectoryExists(directory) {
    if (!fs.existsSync(directory)) {
        console.log(`Vytvářím složku: ${directory}`);
        fs.mkdirSync(directory, { recursive: true });
        return true;
    }
    return false;
}

// Cesta ke složce s kartičkami
const kartickyDir = path.join(__dirname, 'public', 'Karticky');
ensureDirectoryExists(kartickyDir);

// Obsah souboru s kartičkami
const abstractArtContent = `#separator:tab
#html:true
#name:Abstraktní umění - 20 kartiček

Kdy byl vytvořen první abstraktní obraz?	V roce 1910.
Kdo je považován za tvůrce prvního abstraktního akvarelu?	Vasilij Kandinskij (vytvořil ho údajně náhodou, když otočil svůj obraz).
Jaké jsou klíčové znaky abstraktního umění?	Nefigurativnost, soustředění na výtvarné prostředky (linie, tvar, barva, plocha), vyjádření emocí čistě výtvarnými prvky.
Z jakých uměleckých směrů se vyvinulo abstraktní umění?	Ze symbolismu, fauvismu, expresionismu a zejména kubismu, který rozkladem forem vytvořil předpoklady pro opuštění předmětnosti.
Kdo byl František Kupka a jaká byla jeho role v abstraktním umění?	Český malíř, grafik a ilustrátor, jeden z průkopníků abstraktního umění, který v roce 1912 vystavoval abstraktní obrazy na Podzimním salónu v Paříži.
Co je suprematismus a kdo je jeho zakladatelem?	Ruský směr založený Kazimimem Malevičem, používající jednoduché geometrické tvary a omezený počet barev. Název odkazuje k latínskému "supremus" (nejvyšší).
Jaké je nejznámější dílo Kazimira Maleviče?	Černý čtverec na bílém pozadí (1915).
Co je neoplasticismus (De Stijl) a jaké jsou jeho hlavní znaky?	Holandský směr usilující o absolutní čistotu výrazu. Používá jen vodorovné a svislé čáry, pravé úhly a základní barvy (červená, modrá, žlutá) plus černá, bílá a šedá.
Která díla patří mezi klíčová v tvorbě Františka Kupky?	Amorfa - Dvoubarevná fuga, Amorfa - Teplá chromatika, Klávesy piana, Vertikální plány, Tryskání II.
Co je orfismus a jak souvisí s hudbou?	Směr odvozený od kubismu, zdůrazňující barevnost a rytmus, inspirovaný hudbou. Název odkazuje k mytickému hudebníkovi Orfeovi.
Kteří umělci byli hlavními představiteli orfismu?	Robert Delaunay, František Kupka a Francis Picabia.
Ve kterém období se rozvíjela druhá vlna abstrakce a kde?	1945-1960, zejména v USA a západní Evropě.
Který český umělec byl průkopníkem počítačového umění v rámci abstrakce?	Zdeněk Sýkora (od 60. let využíval počítač pro tvorbu struktur a linií).
Jaký byl význam abstraktního umění pro vývoj umění 20. století?	Osvobození umění od povinnosti napodobovat realitu, důraz na vlastní výrazové prostředky, propojení s ostatními druhy umění, vliv na architekturu a design.
Jaká byla inspirace pro Pieta Mondriana při tvorbě jeho pozdějších děl?	Jazzová hudba (série Boogie Woogie).
Co je rayonismus (lučismus) a kdo byli jeho hlavní představitelé?	Ruský směr zaměřený na zachycení světelných paprsků a pohyb mimo čas a prostor. Hlavní představitelé byli Michail Larionov a Natalie Gončarovová.
Jakými fázemi prošla tvorba Kazimira Maleviče během jeho umělecké kariéry?	Od nabismu přes futurismus a kubismus k suprematismu, později architektura a nakonec návrat k figurální malbě s uniformními postavami bez tváří.
Co spojovalo Mikalojuse Konstantinase Čiurlionise s abstraktním uměním?	Byl synestetik - propojoval hudbu a výtvarné umění, jeho dílo předjímalo abstraktní umění díky důrazu na barvu, rytmus a stylizovanou formu.
Která díla patří mezi nejvýznamnější práce Pieta Mondriana?	Kompozice se žlutou, modrou a červenou, Broadway Boogie Woogie, série Stromů (ukazující vývoj od realismu k abstrakci).
Jak se abstraktní umění inspirovalo hudbou?	Abstraktní povaha zvuků a jejich rytmické uspořádání poskytly model pro nereprezentativní umění, kde rytmus, harmonie a kompozice fungují podobně jako v hudbě.`;

// Uložení souboru
const filePath = path.join(kartickyDir, 'abstraktni_umeni.txt');
fs.writeFileSync(filePath, abstractArtContent, 'utf8');

console.log(`Soubor s abstraktním uměním byl úspěšně uložen: ${filePath}`);
console.log('Instalace dokončena. Soubor je nyní připraven k použití.');
console.log('\nPro načtení balíčků:');
console.log('1. Spusťte aplikaci (npm start)');
console.log('2. V aplikaci klikněte na "Načíst z textu"');
console.log('3. Klikněte na "Načíst kartičky ze složky"');
