const fs = require('fs');
const path = require('path');
const imageManager = require('./image-manager');

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
