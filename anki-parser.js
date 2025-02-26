const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');
const AnkiParser = require('anki-apkg-parser');

/**
 * Zpracuje Anki .apkg soubor a převede ho na formát použitelný v naší aplikaci
 * @param {string} filePath - Cesta k Anki souboru
 * @returns {Object} - Zpracovaný balíček
 */
async function parseAnkiFile(filePath) {
    try {
        // Vygenerovat unikátní ID pro balíček
        const fileBuffer = fs.readFileSync(filePath);
        const hash = createHash('md5').update(fileBuffer).digest('hex');
        const id = hash.substring(0, 8);

        // Zpracovat .apkg soubor
        const ankiData = await AnkiParser.parse(filePath);
        
        // Převést do formátu naší aplikace
        const deck = {
            id,
            name: ankiData.name || `Balíček ${id}`,
            cards: ankiData.cards.map(card => ({
                id: createHash('md5').update(card.front + card.back).digest('hex').substring(0, 8),
                front: card.front,
                back: card.back,
                tags: card.tags || []
            })),
            created: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        return deck;
    } catch (error) {
        console.error('Chyba při zpracování Anki souboru:', error);
        throw new Error('Nepodařilo se zpracovat Anki soubor');
    }
}

module.exports = {
    parseAnkiFile
};
