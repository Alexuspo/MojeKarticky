const crypto = require('crypto');

/**
 * Dummy funkce pro zpracování Anki souboru - ve verzi pro Vercel vždy vrací ukázkový balíček
 */
async function parseAnkiFile() {
    return createDummyDeck();
}

/**
 * Vytvoří testovací balíček karet s literárním zaměřením
 * @returns {Object} - Testovací balíček
 */
function createDummyDeck() {
    const id = 'lit' + Math.floor(Math.random() * 1000);
    
    return {
        id,
        name: 'Literatura-Test-karticky',
        cards: [
            {
                id: 'lit001',
                front: 'Kdo je autorem knihy Máj?',
                back: 'Karel Hynek Mácha',
                tags: ['literatura', 'česká literatura', '19. století']
            },
            {
                id: 'lit002',
                front: 'Ve kterém roce vydal Karel Čapek román R.U.R.?',
                back: '1920',
                tags: ['literatura', 'česká literatura', '20. století', 'sci-fi']
            },
            {
                id: 'lit003',
                front: 'Co je to Stínadla?',
                back: 'Tajemná čtvrť ze série Rychlé šípy od Jaroslava Foglara',
                tags: ['literatura', 'česká literatura', 'pro mládež']
            },
            {
                id: 'lit004',
                front: 'Který literární žánr je charakteristický nadpřirozenými jevy a strašidelnými prvky?',
                back: 'Horor',
                tags: ['literatura', 'žánry']
            },
            {
                id: 'lit005',
                front: 'Kdo napsal Babičku?',
                back: 'Božena Němcová',
                tags: ['literatura', 'česká literatura', '19. století']
            },
            {
                id: 'lit006',
                front: 'Co je to sonet?',
                back: 'Básnická forma o 14 verších, obvykle rozdělená na dvě čtyřverší a dvě trojverší',
                tags: ['literatura', 'poezie', 'formy']
            },
            {
                id: 'lit007',
                front: 'Kdo je považován za otce science fiction?',
                back: 'Jules Verne',
                tags: ['literatura', 'světová literatura', 'sci-fi']
            },
            {
                id: 'lit008',
                front: 'Jaká je hlavní myšlenka románu 1984 od George Orwella?',
                back: 'Kritika totalitních režimů, sledování občanů a manipulace s pravdou',
                tags: ['literatura', 'světová literatura', '20. století', 'dystopie']
            },
            {
                id: 'lit009',
                front: 'Jaký je rozdíl mezi lyrikou a epikou?',
                back: 'Lyrika vyjadřuje pocity a nálady, zatímco epika vypráví příběh s dějem',
                tags: ['literatura', 'teorie literatury']
            },
            {
                id: 'lit010',
                front: 'Co je to metafora?',
                back: 'Básnický přenos významu na základě vnější či vnitřní podobnosti',
                tags: ['literatura', 'stylistika']
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
