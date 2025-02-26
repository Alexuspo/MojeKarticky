const crypto = require('crypto');

/**
 * Dummy funkce pro zpracování Anki souboru - ve verzi pro Vercel vždy vrací ukázkový balíček
 */
async function parseAnkiFile() {
    return createDummyDeck();
}

/**
 * Vytvoří testovací balíček karet
 * @returns {Object} - Testovací balíček
 */
function createDummyDeck() {
    const id = 'demo' + Math.floor(Math.random() * 1000);
    
    return {
        id,
        name: 'Ukázkový balíček pro skauty',
        cards: [
            {
                id: 'card001',
                front: 'Jak se jmenuje zakladatel skautingu?',
                back: 'Robert Baden-Powell',
                tags: ['skauting', 'historie']
            },
            {
                id: 'card002',
                front: 'Jaké je skautské heslo?',
                back: 'Buď připraven!',
                tags: ['skauting', 'základy']
            },
            {
                id: 'card003',
                front: 'Co symbolizují tři prsty při skautském pozdravu?',
                back: 'Tři body skautského slibu:<br>1. povinnost k Bohu a vlasti<br>2. pomoc bližnímu<br>3. poslušnost skautského zákona',
                tags: ['skauting', 'symboly']
            },
            {
                id: 'card004',
                front: 'Kolik je skautských zákonů?',
                back: '10',
                tags: ['skauting', 'základy']
            },
            {
                id: 'card005',
                front: 'Vyjmenuj alespoň 3 skautské zákony:',
                back: '1. Skaut je pravdomluvný<br>2. Skaut je věrný a oddaný<br>3. Skaut je prospěšný a pomáhá jiným<br>4. Skaut je přítelem všech lidí dobré vůle a bratrem každého skauta<br>5. Skaut je zdvořilý<br>6. Skaut je ochráncem přírody a cenných výtvorů lidských<br>7. Skaut je poslušný rodičů, představených a vůdců<br>8. Skaut je veselé mysli<br>9. Skaut je hospodárný<br>10. Skaut je čistý v myšlení, slovech i skutcích',
                tags: ['skauting', 'zákony']
            },
            {
                id: 'card006',
                front: 'Co je to skautská lilie?',
                back: 'Základní skautský symbol, který připomíná severku na kompasu a ukazuje správný směr v životě',
                tags: ['skauting', 'symboly']
            },
            {
                id: 'card007',
                front: 'Jakou barvu má skautský kroj pro skauty a skautky v ČR?',
                back: 'Písková/béžová košile',
                tags: ['skauting', 'kroj']
            },
            {
                id: 'card008',
                front: 'Kdy vznikl český skauting?',
                back: 'V roce 1911',
                tags: ['skauting', 'historie', 'čr']
            }
        ],
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
    };
}

/**
 * Vytvoří náhodný balíček karet pro testování
 * @param {string} name - Název balíčku
 * @param {number} count - Počet karet
 * @returns {Object} - Vygenerovaný balíček
 */
function createRandomDeck(name = 'Náhodný balíček', count = 10) {
    const id = 'rand' + Math.floor(Math.random() * 1000);
    const cards = [];
    
    for (let i = 0; i < count; i++) {
        cards.push({
            id: 'card' + i,
            front: `Otázka #${i + 1}: Kolik je ${Math.floor(Math.random() * 10)} + ${Math.floor(Math.random() * 10)}?`,
            back: `Odpověď bude vypočítána při zobrazení`,
            tags: ['matematika', 'náhodné']
        });
    }
    
    return {
        id,
        name,
        cards,
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
    };
}

module.exports = {
    parseAnkiFile,
    createDummyDeck,
    createRandomDeck
};
