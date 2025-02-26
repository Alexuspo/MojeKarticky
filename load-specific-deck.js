const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Nástroj pro přímé načtení konkrétního balíčku karet
 */

function parseAbstraktniUmeniFile() {
    console.log('Analyzuji soubor Abstraktní umění.txt...');
    
    // Cesta k souboru
    const filePath = path.join(__dirname, 'public', 'Karticky', 'Abstraktní umění.txt');
    
    if (!fs.existsSync(filePath)) {
        console.error(`Soubor ${filePath} neexistuje!`);
        return null;
    }
    
    try {
        // Načtení obsahu souboru
        const content = fs.readFileSync(filePath, 'utf8');
        console.log(`Soubor načten, velikost: ${content.length} bajtů`);
        
        // Rozdělit na řádky
        const lines = content.split('\n');
        console.log(`Počet řádků v souboru: ${lines.length}`);
        
        // Získat hlavičky (první řádky s #)
        const headers = lines.filter(line => line.startsWith('#'));
        console.log('Hlavičky v souboru:');
        headers.forEach(header => console.log(`  ${header}`));
        
        // Pole pro karty
        const cards = [];
        
        // Zpracovat řádky s kartami
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Přeskočit prázdné řádky a hlavičky
            if (!line || line.startsWith('#')) continue;
            
            // Rozdělit řádek tabulátorem
            const parts = line.split('\t');
            
            if (parts.length < 3) {
                console.log(`Řádek ${i+1} nemá dostatek částí, přeskakuji`);
                continue;
            }
            
            // Pro Abstraktní umění je front ve druhém sloupci a back ve třetím
            const front = parts[1] ? parts[1].trim() : '';
            const back = parts[2] ? parts[2].trim() : '';
            
            if (!front || !back) {
                console.log(`Řádek ${i+1} má prázdný obsah, přeskakuji`);
                continue;
            }
            
            // Vytvořit ID
            const cardId = crypto.createHash('md5')
                .update(`abstract_art_${i}_${front}`)
                .digest('hex')
                .substring(0, 8);
            
            // Přidat kartu
            cards.push({
                id: cardId,
                front: front,
                back: back,
                tags: ['umění', 'abstraktní']
            });
        }
        
        console.log(`Zpracováno ${cards.length} karet`);
        
        if (cards.length === 0) {
            console.error('Nebyly nalezeny žádné platné karty!');
            return null;
        }
        
        // Vytvořit balíček
        const deck = {
            id: 'abstract_art_' + Date.now().toString().substring(6),
            name: 'Abstraktní umění',
            cards: cards,
            created: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            source: 'textfile',
            format: 'html'
        };
        
        // Uložit výsledek do JSON pro snazší import
        const outputPath = path.join(__dirname, 'data', 'abstraktni-umeni.json');
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, JSON.stringify(deck, null, 2));
        
        console.log(`Balíček byl vytvořen a uložen do ${outputPath}`);
        
        return deck;
    } catch (error) {
        console.error('Chyba při zpracování souboru:', error);
        return null;
    }
}

// Spustit, pokud je skript přímo volán
if (require.main === module) {
    console.log('===== PŘÍMÉ NAČTENÍ BALÍČKU ABSTRAKTNÍ UMĚNÍ =====');
    const result = parseAbstraktniUmeniFile();
    
    if (result) {
        console.log(`Úspěšně načten balíček "${result.name}" s ${result.cards.length} kartami.`);
        console.log('Pro použití v aplikaci spusťte aplikaci s příkazem `npm start` a pak v navigaci klikněte na "Načíst z textu"');
    } else {
        console.error('Nepodařilo se načíst balíček.');
    }
}

module.exports = { parseAbstraktniUmeniFile };
