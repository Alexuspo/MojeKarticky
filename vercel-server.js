// Speciální serverová verze pro Vercel serverless prostředí
const express = require('express');
const path = require('path');
const crypto = require('crypto');

// Vytvoření Express aplikace
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pro zpracování JSON dat
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statické soubory
app.use(express.static(path.join(__dirname, 'public')));

// Globální proměnné
let decks = [];

// Logovací funkce
function logInfo(message) {
    console.log(`[INFO] ${message}`);
}

function logSuccess(message) {
    console.log(`[SUCCESS] ${message}`);
}

function logWarning(message) {
    console.warn(`[WARN] ${message}`);
}

function logError(message, error) {
    console.error(`[ERROR] ${message}`, error || '');
}

// Základní API pro získání všech balíčků
app.get('/api/decks', (req, res) => {
    try {
        // Ve Vercel prostředí vždy vrátíme statické balíčky
        if (!decks || decks.length === 0) {
            decks = getStaticDecks();
        }
        res.json(decks);
    } catch (error) {
        logError('Chyba při získávání balíčků:', error);
        res.status(500).json({
            error: 'Nastala chyba při získávání balíčků',
            details: error.message
        });
    }
});

// API pro získání konkrétního balíčku
app.get('/api/decks/:id', (req, res) => {
    try {
        // Zajistit, že máme načtené balíčky
        if (!decks || decks.length === 0) {
            decks = getStaticDecks();
        }
        
        const deckId = req.params.id;
        logInfo(`Hledám balíček s ID: ${deckId}`);
        
        // Najít balíček podle ID
        const deck = decks.find(d => d.id === deckId);
        
        if (!deck) {
            logWarning(`Balíček s ID ${deckId} nebyl nalezen, zkouším alternativní metody`);
            
            // Zkusit najít podle názvu (pro případ, že ID se liší, ale název je stejný)
            if (deckId.includes('literatura')) {
                const literaturaDeck = createLiteraturaDeck();
                logInfo(`Vracím alternativní balíček literatury: ${literaturaDeck.name}`);
                return res.json(literaturaDeck);
            } else if (deckId.includes('abstrakt')) {
                const abstraktDeck = createAbstractArtDeck();
                logInfo(`Vracím alternativní balíček abstraktního umění: ${abstraktDeck.name}`);
                return res.json(abstraktDeck);
            }
            
            // Pokud všechno selže, vrátit první balíček
            const firstDeck = decks[0];
            if (firstDeck) {
                logWarning(`Vracím první dostupný balíček: ${firstDeck.name}`);
                return res.json(firstDeck);
            }
            
            // Jako poslední možnost vrátit znovu vytvořený balíček literatury
            logWarning('Vracím nový balíček literatury jako poslední možnost');
            return res.json(createLiteraturaDeck());
        }
        
        logSuccess(`Balíček nalezen: ${deck.name}`);
        res.json(deck);
    } catch (error) {
        logError('Chyba při získávání balíčku:', error);
        
        // V případě chyby vrátit první dostupný balíček (záchranná metoda)
        const backupDecks = getStaticDecks();
        if (backupDecks && backupDecks.length > 0) {
            logInfo(`Vracím záložní balíček: ${backupDecks[0].name}`);
            return res.json(backupDecks[0]);
        }
        
        res.status(500).json({
            error: 'Nastala chyba při získávání balíčku',
            details: error.message
        });
    }
});

// API pro server status check
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'ok', 
        serverTime: new Date().toISOString(),
        environment: 'vercel',
        decksCount: decks.length
    });
});

// API pro získání textových balíčků
app.get('/api/text-decks', (req, res) => {
    logInfo('Požadavek na získání textových balíčků');
    
    try {
        // V serverless prostředí vždy vrátíme statické balíčky
        if (!decks || decks.length === 0) {
            decks = getStaticDecks();
        }
        
        const textDecks = decks.filter(deck => deck.source === 'hardcoded');
        logSuccess(`Nalezeno ${textDecks.length} textových balíčků`);
        res.json(textDecks);
    } catch (error) {
        logError('Chyba při získávání textových balíčků:', error);
        const staticDecks = getStaticDecks();
        logInfo(`Vracím ${staticDecks.length} statických balíčků po chybě`);
        res.json(staticDecks);
    }
});

// API pro načtení textových balíčků 
app.post('/api/load-text-decks', (req, res) => {
    logInfo('Požadavek na načtení textových balíčků (Vercel)');
    
    try {
        // V serverless prostředí vždy vrátíme statické balíčky
        const staticDecks = getStaticDecks();
        decks = staticDecks;
        
        logSuccess(`Načteno ${staticDecks.length} předdefinovaných balíčků`);
        
        res.json({ 
            success: true, 
            decksCount: staticDecks.length, 
            isServerless: true,
            environment: 'Vercel'
        });
    } catch (error) {
        logError('Chyba při načítání textových balíčků:', error);
        res.status(500).json({ 
            success: false,
            error: 'Nastala chyba při načítání statických balíčků',
            details: error.message
        });
    }
});

// Funkce pro vytvoření statických balíčků
function getStaticDecks() {
    logInfo('Vytvářím statické balíčky pro Vercel');
    
    const staticDecks = [];
    staticDecks.push(createLiteraturaDeck());
    staticDecks.push(createAbstractArtDeck());
    staticDecks.push(createAbstractArtImagesDeck()); // Přidáno: balíček s obrázky
    
    return staticDecks;
}

// Vytvoření balíčku Literatura
function createLiteraturaDeck() {
    const cards = [
        { front: "Májovci tvořili v", back: "v 2 polovině 19.století" },
        { front: "V jejich čele stál", back: "Jan Neruda" },
        { front: "Literární skupina se jmenovala podle", back: "Almanachu Máj" },
        { front: "Májovci se svým dílem hlásili k odkazu", back: "K. H. Máchy" },
        { front: "Autorem malostranských povídek je", back: "Jan Neruda" },
        { front: "Fejeton je", back: "Krátký vtipný text a často kritický. (na př v novinách)" },
        { front: "Neruda byl redaktorem", back: "Národních listů" },
        { front: "Jmenujte jednu Nerudovu básnickou sbírku", back: "Písně kosmické" },
        { front: "Autorem poezie večerní písně a Pohádky z naší vesnice je", back: "Vítězslav Hálek" },
        { front: "Autorem romaneta v české literatuře je", back: "Jakub Arbes" },
        { front: "Romaneto je", back: "Krátká mystická novela která se musí odehrává v Praze" },
        { front: "Jmenujte jedno Arbesovo romaneto", back: "Newtonův mozek" },
        { front: "Karolina světlá ve své tvorbě zobrazovala", back: "Postavy těžce zkoušených žen" },
        { front: "Jmenujte jedno dílo K. světlé", back: "Vesnický román" },
        { front: "Libreto je", back: "předloha k opeře" },
        { front: "Libreta psala", back: "Eliška Krásnohorská" },
        { front: "Libreta vytvořila k opeře", back: "Eliška Krásnohorská" },
        { front: "Povídku muzikanstká Libuška napsala", back: "Vítězslav Hálek" },
        { front: "Karolina světlá se jmenovala vlastním jménem", back: "Johana Mužáková" },
        { front: "Jan Neruda podepisoval své fejetony", back: "△" }
    ];
    
    // Přidat ID ke každé kartě
    const cardsWithId = cards.map((card, index) => ({
        id: `literatura${index}`,
        front: card.front,
        back: card.back,
        tags: ['literatura']
    }));
    
    return {
        id: "literatura_hardcoded",
        name: "Literatura-Test-karticky",
        cards: cardsWithId,
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        source: 'hardcoded',
        format: 'plain'
    };
}

// Vytvoření balíčku Abstraktní umění
function createAbstractArtDeck() {
    const cards = [
        { front: "Kdy byl vytvořen první abstraktní obraz?", back: "V roce 1910." },
        { front: "Kdo je považován za tvůrce prvního abstraktního akvarelu?", back: "Vasilij Kandinskij (vytvořil ho údajně náhodou, když otočil svůj obraz)." },
        { front: "Jaké jsou klíčové znaky abstraktního umění?", back: "Nefigurativnost, soustředění na výtvarné prostředky (linie, tvar, barva, plocha), vyjádření emocí čistě výtvarnými prvky." },
        { front: "Z jakých uměleckých směrů se vyvinulo abstraktní umění?", back: "Ze symbolismu, fauvismu, expresionismu a zejména kubismu, který rozkladem forem vytvořil předpoklady pro opuštění předmětnosti." },
        { front: "Kdo byl František Kupka a jaká byla jeho role v abstraktním umění?", back: "Český malíř, grafik a ilustrátor, jeden z průkopníků abstraktního umění, který v roce 1912 vystavoval abstraktní obrazy na Podzimním salónu v Paříži." },
        { front: "Co je suprematismus a kdo je jeho zakladatelem?", back: "Ruský směr založený Kazimimem Malevičem, používající jednoduché geometrické tvary a omezený počet barev. Název odkazuje k latínskému \"supremus\" (nejvyšší)." },
        { front: "Jaké je nejznámější dílo Kazimira Maleviče?", back: "Černý čtverec na bílém pozadí (1915)." },
        { front: "Co je neoplasticismus (De Stijl) a jaké jsou jeho hlavní znaky?", back: "Holandský směr usilující o absolutní čistotu výrazu. Používá jen vodorovné a svislé čáry, pravé úhly a základní barvy (červená, modrá, žlutá) plus černá, bílá a šedá." },
        { front: "Která díla patří mezi klíčová v tvorbě Františka Kupky?", back: "Amorfa - Dvoubarevná fuga, Amorfa - Teplá chromatika, Klávesy piana, Vertikální plány, Tryskání II." },
        { front: "Co je orfismus a jak souvisí s hudbou?", back: "Směr odvozený od kubismu, zdůrazňující barevnost a rytmus, inspirovaný hudbou. Název odkazuje k mytickému hudebníkovi Orfeovi." },
        { front: "Kteří umělci byli hlavními představiteli orfismu?", back: "Robert Delaunay, František Kupka a Francis Picabia." },
        { front: "Ve kterém období se rozvíjela druhá vlna abstrakce a kde?", back: "1945-1960, zejména v USA a západní Evropě." },
        { front: "Který český umělec byl průkopníkem počítačového umění v rámci abstrakce?", back: "Zdeněk Sýkora (od 60. let využíval počítač pro tvorbu struktur a linií)." },
        { front: "Jaký byl význam abstraktního umění pro vývoj umění 20. století?", back: "Osvobození umění od povinnosti napodobovat realitu, důraz na vlastní výrazové prostředky, propojení s ostatními druhy umění, vliv na architekturu a design." },
        { front: "Jaká byla inspirace pro Pieta Mondriana při tvorbě jeho pozdějších děl?", back: "Jazzová hudba (série Boogie Woogie)." },
        { front: "Co je rayonismus (lučismus) a kdo byli jeho hlavní představitelé?", back: "Ruský směr zaměřený na zachycení světelných paprsků a pohyb mimo čas a prostor. Hlavní představitelé byli Michail Larionov a Natalie Gončarovová." },
        { front: "Jakými fázemi prošla tvorba Kazimira Maleviče během jeho umělecké kariéry?", back: "Od nabismu přes futurismus a kubismus k suprematismu, později architektura a nakonec návrat k figurální malbě s uniformními postavami bez tváří." },
        { front: "Co spojovalo Mikalojuse Konstantinase Čiurlionise s abstraktním uměním?", back: "Byl synestetik - propojoval hudbu a výtvarné umění, jeho dílo předjímalo abstraktní umění díky důrazu na barvu, rytmus a stylizovanou formu." },
        { front: "Která díla patří mezi nejvýznamnější práce Pieta Mondriana?", back: "Kompozice se žlutou, modrou a červenou, Broadway Boogie Woogie, série Stromů (ukazující vývoj od realismu k abstrakci)." },
        { front: "Jak se abstraktní umění inspirovalo hudbou?", back: "Abstraktní povaha zvuků a jejich rytmické uspořádání poskytly model pro nereprezentativní umění, kde rytmus, harmonie a kompozice fungují podobně jako v hudbě." }
    ];
    
    // Přidat ID ke každé kartě
    const cardsWithId = cards.map((card, index) => ({
        id: `abstraktni${index}`,
        front: card.front,
        back: card.back,
        tags: ['umeni', 'abstrakt']
    }));
    
    return {
        id: "abstraktni_umeni_hardcoded",
        name: "Abstraktní umění - 20 kartiček",
        cards: cardsWithId,
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        source: 'hardcoded',
        format: 'plain'
    };
}

// Vytvoření balíčku Abstraktní umění s obrázky
function createAbstractArtImagesDeck() {
    const cards = [
        {
            front: '<img alt="Barevná studie. Čtverce se soustřednými kruhy, 1913." src="images/Wassily_Kandinsky_-_Color_Study_Squares_with_Concentric_Circles_1913_-_(MeisterDrucke-1185849).jpg" style="max-height: 300px;">',
            back: 'Vasilij Kandinskij - Soustředné Kruhy (1913). Jeden z nejznámějších obrazů tohoto průkopníka abstraktního umění.'
        },
        {
            front: '<img alt="Černý čtverec" src="images/800px-Чёрный_супрематический_квадрат._1915._ГТГ.png" style="max-height: 300px;">',
            back: 'Kazimir Malevič - Černý čtverec na bílém pozadí (1915). Ikona suprematismu a klíčové dílo abstraktního umění 20. století.'
        },
        {
            front: '<img alt="František Kupka - Amorfa. Dvoubarevná fuga" src="images/CZE_NG.O_5942.jpeg" style="max-height: 300px;">',
            back: 'František Kupka - Amorfa: Dvoubarevná fuga (1912). Jedno z prvních plně abstraktních děl v historii malířství.'
        },
        {
            front: '<img alt="Piet Mondrian: Kompozice v červené, žluté, modré a černé" src="images/8136.webp" style="max-height: 300px;">',
            back: 'Piet Mondrian - Kompozice v červené, žluté, modré a černé. Typické dílo neoplasticismu používající pouze základní barvy a pravoúhlé tvary.'
        }
    ];
    
    // Přidat ID ke každé kartě
    const cardsWithId = cards.map((card, index) => ({
        id: `abstrakt_obrazky_${index}`,
        front: card.front,
        back: card.back,
        tags: ['umeni', 'abstraktni', 'obrazky']
    }));
    
    return {
        id: "abstraktni_umeni_obrazky_hardcoded",
        name: "Abstraktní umění - obrazová galerie",
        cards: cardsWithId,
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        source: 'hardcoded',
        format: 'html'
    };
}

// Catch-all API pro ostatní endpointy
app.all('/api/*', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'Vercel serverless API - tento endpoint není implementován',
        endpoint: req.path
    });
});

// Obsluha všech ostatních požadavků - servírování statických souborů
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Spuštění serveru (v Vercel toto není potřeba, ale užitečné pro lokální testování)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server běží na http://localhost:${PORT}`);
    });
}

// Export pro Vercel
module.exports = app;
