document.addEventListener('DOMContentLoaded', () => {
    // Elementy UI
    const homeBtn = document.getElementById('homeBtn');
    const studyBtn = document.getElementById('studyBtn');
    const loadDeckBtn = document.getElementById('loadDeckBtn');
    const aboutBtn = document.getElementById('aboutBtn');
    
    const homeSection = document.getElementById('home-section');
    const studySection = document.getElementById('study-section');
    const aboutSection = document.getElementById('about-section');
    
    const decksContainer = document.getElementById('decks-container');
    const noDecksMessage = document.getElementById('no-decks');
    
    const flashcard = document.getElementById('flashcard');
    const cardFront = document.getElementById('card-front');
    const cardBack = document.getElementById('card-back');
    const flipBtn = document.getElementById('flipBtn');
    const ratingBtns = document.getElementById('rating-btns');
    const deckTitle = document.getElementById('deck-title');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    
    // Tlačítka pro studium
    const endSessionBtn = document.getElementById('endSessionBtn');
    const restartSessionBtn = document.getElementById('restartSessionBtn');

    // Přidání přepínače pro náhodné pořadí
    const randomOrderToggle = document.getElementById('randomOrderToggle');

    // Stav aplikace
    let currentDeck = null;
    let currentCardIndex = 0;
    let isCardFlipped = false;
    let isLoading = false;
    let originalDeckOrder = []; // Pro uložení původního pořadí karet

    // Offline ukázkový balíček přímo v klientu pro případ výpadku serveru
    const fallbackDeck = {
        id: 'offline001',
        name: 'Offline ukázkový balíček',
        cards: [
            {
                id: 'card001',
                front: 'Co je hlavní město České republiky?',
                back: 'Praha',
                tags: ['geografie', 'čr']
            },
            {
                id: 'card002',
                front: 'Kolik má průměrná dešťovka nohou?',
                back: 'Žádnou',
                tags: ['biologie', 'zábavné']
            },
            {
                id: 'card003',
                front: 'Jaký je chemický vzorec vody?',
                back: 'H<sub>2</sub>O',
                tags: ['chemie', 'základy']
            }
        ],
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
    };

    // Načtení uživatelského nastavení z localStorage
    const loadUserSettings = () => {
        try {
            const settings = JSON.parse(localStorage.getItem('userSettings')) || {};
            if (settings.randomOrder !== undefined && randomOrderToggle) {
                randomOrderToggle.checked = settings.randomOrder;
            }
        } catch (e) {
            console.warn('Nepodařilo se načíst uživatelská nastavení:', e);
        }
    };

    // Uložení uživatelského nastavení do localStorage
    const saveUserSettings = () => {
        try {
            const settings = {
                randomOrder: randomOrderToggle ? randomOrderToggle.checked : false
            };
            localStorage.setItem('userSettings', JSON.stringify(settings));
        } catch (e) {
            console.warn('Nepodařilo se uložit uživatelská nastavení:', e);
        }
    };

    // Inicializace nastavení
    loadUserSettings();

    // Navigační akce
    homeBtn.addEventListener('click', () => showSection(homeSection));
    studyBtn.addEventListener('click', () => {
        if (currentDeck) {
            showSection(studySection);
        } else {
            showSection(homeSection);
            showMessage('Nejprve vyberte balíček kartiček k procvičování.');
        }
    });
    aboutBtn.addEventListener('click', () => showSection(aboutSection));
    
    // Tlačítka pro studijní relaci
    if (endSessionBtn) {
        endSessionBtn.addEventListener('click', () => {
            showSection(homeSection);
        });
    }
    
    if (restartSessionBtn) {
        restartSessionBtn.addEventListener('click', () => {
            currentCardIndex = 0;
            isCardFlipped = false;
            startStudySession();
        });
    }
    
    loadDeckBtn.addEventListener('click', async () => {
        if (isLoading) return;
        
        try {
            isLoading = true;
            loadDeckBtn.disabled = true;
            loadDeckBtn.textContent = 'Načítám...';
            
            // Zobrazit načítání
            noDecksMessage.textContent = 'Načítání balíčku...';
            noDecksMessage.classList.remove('hidden');
            decksContainer.innerHTML = '';
            
            // Zavolat API pro načtení výchozího balíčku
            const response = await fetch('/api/load-default-deck');
            const result = await response.json();
            
            if (response.ok) {
                showMessage('Balíček byl úspěšně načten!', 'success');
                
                // Pokud API vrátilo varování, zobrazit ho
                if (result.warning) {
                    console.warn(result.warning);
                    showMessage(result.warning, 'warning');
                }
                
                // Po úspěšném načtení aktualizovat seznam balíčků
                loadDecks();
            } else {
                showMessage(`Chyba: ${result.error || 'Neznámá chyba'}`, 'error');
                noDecksMessage.textContent = `Chyba při načítání balíčku: ${result.error || 'Neznámá chyba'}`;
                
                // Jako záložní řešení se pokusíme načíst existující balíčky
                loadDecks();
            }
        } catch (error) {
            console.error('Chyba při načítání balíčku:', error);
            showMessage('Došlo k chybě při komunikaci se serverem. Používám offline režim.', 'error');
            
            // Použijeme offline fallback data
            useOfflineFallback();
        } finally {
            isLoading = false;
            loadDeckBtn.disabled = false;
            loadDeckBtn.textContent = 'Načíst kartičky';
        }
    });

    // Přidat nové tlačítko pro načtení textových kartiček, pokud takové existuje v HTML
    const loadTextDeckBtn = document.getElementById('loadTextDeckBtn');
    if (loadTextDeckBtn) {
        loadTextDeckBtn.addEventListener('click', async () => {
            if (isLoading) return;
            
            try {
                isLoading = true;
                loadTextDeckBtn.disabled = true;
                loadTextDeckBtn.textContent = 'Načítám...';
                
                // Zobrazit načítání
                noDecksMessage.textContent = 'Načítání textových kartiček...';
                noDecksMessage.classList.remove('hidden');
                decksContainer.innerHTML = '';
                
                // Zavolat API pro načtení textových kartiček
                const response = await fetch('/api/load-text-decks');
                const result = await response.json();
                
                if (response.ok) {
                    showMessage(`Úspěšně načteno ${result.decks.length} balíčků z textových souborů`, 'success');
                    
                    // Po úspěšném načtení aktualizovat seznam balíčků
                    loadDecks();
                } else {
                    showMessage(`Chyba: ${result.error || 'Neznámá chyba'}`, 'error');
                    noDecksMessage.textContent = `Chyba při načítání textových kartiček: ${result.error || 'Neznámá chyba'}`;
                    
                    // Jako záložní řešení se pokusíme načíst existující balíčky
                    loadDecks();
                }
            } catch (error) {
                console.error('Chyba při načítání textových kartiček:', error);
                showMessage('Došlo k chybě při komunikaci se serverem.', 'error');
                
                // Pokus o načtení existujících balíčků
                loadDecks();
            } finally {
                isLoading = false;
                loadTextDeckBtn.disabled = false;
                loadTextDeckBtn.textContent = 'Načíst z textu';
            }
        });
    }

    // Event listener pro přepínač náhodného pořadí
    if (randomOrderToggle) {
        randomOrderToggle.addEventListener('change', () => {
            saveUserSettings();
            if (currentDeck && currentDeck.cards) {
                // Restartovat studium s novým nastavením
                currentCardIndex = 0;
                isCardFlipped = false;
                startStudySession();
            }
        });
    }

    // Funkce pro zobrazení sekce
    function showSection(section) {
        // Skrýt všechny sekce
        const allSections = [homeSection, studySection, aboutSection];
        allSections.forEach(s => {
            if (s) {
                s.classList.remove('active-section');
                s.classList.add('hidden-section');
            }
        });
        
        // Zobrazit zvolenou sekci
        section.classList.remove('hidden-section');
        section.classList.add('active-section');
        
        // Aktualizovat aktivní tlačítko v menu
        const navButtons = [homeBtn, studyBtn, loadDeckBtn, aboutBtn];
        navButtons.forEach(btn => btn.classList.remove('active'));
        
        if (section === homeSection) {
            homeBtn.classList.add('active');
            loadDecks();
        } else if (section === studySection) {
            studyBtn.classList.add('active');
        } else if (section === aboutSection) {
            aboutBtn.classList.add('active');
        }
    }

    // Funkce pro zobrazení zprávy
    function showMessage(text, type = 'info') {
        // Vytvoříme element pro zprávu
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}-message floating-message`;
        messageElement.textContent = text;
        
        // Přidáme do DOM
        document.body.appendChild(messageElement);
        
        // Po 5 sekundách zprávu odstraníme
        setTimeout(() => {
            messageElement.classList.add('hiding');
            setTimeout(() => {
                if (document.body.contains(messageElement)) {
                    document.body.removeChild(messageElement);
                }
            }, 500);
        }, 5000);
    }

    // Použití offline fallback dat
    function useOfflineFallback() {
        console.log('Používám offline fallback data');
        
        // Nejprve zkusit načíst data z localStorage
        try {
            const storedDecks = localStorage.getItem('fallbackDecks');
            if (storedDecks) {
                const decks = JSON.parse(storedDecks);
                if (decks && decks.length > 0) {
                    renderDecks(decks);
                    noDecksMessage.classList.add('hidden');
                    showMessage('Používám uložená data z předchozí relace', 'warning');
                    return;
                }
            }
        } catch (e) {
            console.error('Chyba při načítání z localStorage:', e);
        }
        
        // Pokud nebylo možné načíst z localStorage, použij vestavěný fallback
        renderDecks([fallbackDeck]);
        noDecksMessage.classList.add('hidden');
        showMessage('Používám offline ukázkový balíček', 'warning');
    }

    // Načtení balíčků s retry logikou
    async function loadDecks(retryCount = 0) {
        try {
            const response = await fetch('/api/decks');
            
            if (!response.ok) {
                throw new Error(`HTTP chyba ${response.status}`);
            }
            
            const decks = await response.json();
            
            if (decks.length === 0) {
                decksContainer.innerHTML = '';
                noDecksMessage.classList.remove('hidden');
                noDecksMessage.textContent = 'Zatím nemáte žádné balíčky. Klikněte na tlačítko "Načíst kartičky" pro načtení balíčku.';
            } else {
                noDecksMessage.classList.add('hidden');
                renderDecks(decks);
                
                // Uložit jako fallback pro případ výpadku spojení
                try {
                    localStorage.setItem('fallbackDecks', JSON.stringify(decks));
                } catch (e) {
                    console.warn('Nepodařilo se uložit fallback data:', e);
                }
            }
        } catch (error) {
            console.error('Error loading decks:', error);
            
            if (retryCount < 2) {
                console.log(`Pokus o opětovné načtení balíčků (${retryCount + 1}/2)...`);
                // Zkusit znovu za chvíli
                setTimeout(() => loadDecks(retryCount + 1), 1000);
            } else {
                noDecksMessage.textContent = 'Nepodařilo se načíst balíčky kartiček. Zkuste obnovit stránku.';
                noDecksMessage.classList.remove('hidden');
                
                // Použít fallback mechanismus
                useOfflineFallback();
            }
        }
    }

    // Vykreslení balíčků
    function renderDecks(decks) {
        decksContainer.innerHTML = '';
        
        decks.forEach(deck => {
            const deckElement = document.createElement('div');
            deckElement.className = 'deck-card';
            
            // Přidání indikátoru zdroje kartiček
            const sourceLabel = deck.source === 'textfile' ? 
                '<span class="source-label">Z textového souboru</span>' : '';
                
            deckElement.innerHTML = `
                <h3>${deck.name}</h3>
                <div class="deck-stats">
                    <p>${deck.cards ? deck.cards.length : 0} kartiček</p>
                    <p>Přidáno: ${formatDate(deck.created)}</p>
                    ${sourceLabel}
                </div>
            `;
            
            deckElement.addEventListener('click', () => {
                currentDeck = deck;
                currentCardIndex = 0;
                isCardFlipped = false;
                startStudySession();
                showSection(studySection);
            });
            
            decksContainer.appendChild(deckElement);
        });
    }

    // Formátování data
    function formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('cs-CZ');
        } catch (e) {
            console.warn('Chyba při formátování data:', e);
            return 'neznámé datum';
        }
    }

    // Funkce pro kartičky
    function startStudySession() {
        if (!currentDeck || !currentDeck.cards || currentDeck.cards.length === 0) {
            showMessage('Tento balíček neobsahuje žádné kartičky', 'error');
            showSection(homeSection);
            return;
        }
        
        // Uložit původní pořadí karet
        originalDeckOrder = [...currentDeck.cards];
        
        // Pokud je zapnuto náhodné pořadí, zamíchat karty
        if (randomOrderToggle && randomOrderToggle.checked) {
            currentDeck.cards = shuffleArray([...originalDeckOrder]);
            showMessage('Kartičky byly náhodně zamíchány', 'info');
        } else {
            // Obnovit původní pořadí
            currentDeck.cards = [...originalDeckOrder];
        }
        
        deckTitle.textContent = currentDeck.name;
        updateProgressBar();
        showCard(currentCardIndex);
    }

    // Funkce pro zamíchání pole (Fisher-Yates shuffle)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function showCard(index) {
        if (!currentDeck || !currentDeck.cards || index >= currentDeck.cards.length) {
            showMessage('Došlo k chybě při zobrazení kartičky', 'error');
            return;
        }
        
        const card = currentDeck.cards[index];
        
        // Zpracování speciálních karet s matematickými výpočty (pro náhodné balíčky)
        if (card.front && card.front.includes('+') && card.back && card.back.includes('vypočítána')) {
            const matches = card.front.match(/Kolik je (\d+) \+ (\d+)/);
            if (matches && matches.length === 3) {
                const num1 = parseInt(matches[1]);
                const num2 = parseInt(matches[2]);
                card.back = `${num1 + num2}`;
            }
        }
        
        // Zajistit, že obsahy kartiček jsou definované
        cardFront.innerHTML = processCardContent(card.front) || 'Prázdná přední strana';
        cardBack.innerHTML = processCardContent(card.back) || 'Prázdná zadní strana';
        
        // Přidat třídu has-image, pokud je v kartičce IMG tag
        const hasImage = (card.front && card.front.includes('<img')) || 
                         (card.back && card.back.includes('<img'));
        
        if (hasImage) {
            flashcard.classList.add('has-image');
        } else {
            flashcard.classList.remove('has-image');
        }
        
        // Nastavit onload handler pro obrázky
        setupImageLoaders();
        
        cardFront.classList.remove('hidden');
        cardBack.classList.add('hidden');
        isCardFlipped = false;
        
        flipBtn.style.display = 'block';
        ratingBtns.classList.add('hidden');
    }

    // Zpracování obsahu kartiček vč. obrázků
    function processCardContent(content) {
        if (!content) return '';
        
        // Pokud obsah už obsahuje HTML tagy, předpokládáme, že je formátovaný
        if (content.includes('<') && content.includes('>')) {
            // Ujistit se, že obrázky mají alt atribut pro přístupnost
            return content.replace(/<img([^>]*)>/g, function(match, attributes) {
                if (!attributes.includes('alt=')) {
                    return `<img${attributes} alt="Obrázek na kartičce">`;
                }
                return match;
            });
        }
        
        // Jednoduchý text - nahradit nové řádky pomocí <br>
        return content.replace(/\n/g, '<br>');
    }

    // Nastavení správného načítání obrázků
    function setupImageLoaders() {
        const images = document.querySelectorAll('.card-side img');
        
        images.forEach(img => {
            // Pokud obrázek není načten, přidat placeholder
            if (!img.complete) {
                const loadingPlaceholder = document.createElement('div');
                loadingPlaceholder.className = 'image-loading';
                img.parentNode.insertBefore(loadingPlaceholder, img.nextSibling);
                
                img.onload = () => {
                    // Po načtení obrázku odstranit placeholder
                    if (loadingPlaceholder.parentNode) {
                        loadingPlaceholder.parentNode.removeChild(loadingPlaceholder);
                    }
                };
                
                img.onerror = () => {
                    // Při chybě načítání nahradit obrázek chybovou zprávou
                    if (loadingPlaceholder.parentNode) {
                        loadingPlaceholder.parentNode.removeChild(loadingPlaceholder);
                    }
                    img.outerHTML = '<div class="image-error">Nepodařilo se načíst obrázek</div>';
                };
            }
        });
    }

    function updateProgressBar() {
        if (!currentDeck || !currentDeck.cards || currentDeck.cards.length === 0) return;
        
        const progress = ((currentCardIndex + 1) / currentDeck.cards.length) * 100;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${currentCardIndex + 1}/${currentDeck.cards.length}`;
    }

    // Funkce pro otáčení kartiček
    function flipCard() {
        console.log('Otáčím kartičku');
        isCardFlipped = !isCardFlipped;
        
        if (isCardFlipped) {
            // Skrýt přední stranu, zobrazit zadní
            console.log('Zobrazuji zadní stranu');
            cardFront.classList.add('hidden');
            cardBack.classList.remove('hidden');
            
            // Skrýt tlačítko otočit, zobrazit tlačítka hodnocení
            flipBtn.style.display = 'none';
            ratingBtns.classList.remove('hidden');
        } else {
            // Zobrazit přední stranu, skrýt zadní
            console.log('Zobrazuji přední stranu');
            cardFront.classList.remove('hidden');
            cardBack.classList.add('hidden');
            
            // Zobrazit tlačítko otočit, skrýt tlačítka hodnocení
            flipBtn.style.display = 'block';
            ratingBtns.classList.add('hidden');
        }
    }

    // Posluchač události pro tlačítko otočit
    flipBtn.addEventListener('click', flipCard);

    // Přidání posluchače událostí pro samotnou kartičku
    if (flashcard) {
        flashcard.addEventListener('click', function(event) {
            // Ignorovat kliknutí na tlačítka nebo jejich potomky
            if (event.target.closest('button') || 
                event.target.closest('#rating-btns')) {
                return;
            }
            
            // Otočit kartičku při kliknutí na ni
            flipCard();
        });
    }

    // Posluchač události pro přední stranu kartičky
    if (cardFront) {
        cardFront.addEventListener('click', function(event) {
            // Zabránit bublání události, aby se neaktivovala dvakrát
            event.stopPropagation();
            
            // Ignorovat kliknutí na tlačítka
            if (event.target.closest('button')) {
                return;
            }
            
            // Otočit kartičku
            flipCard();
        });
    }

    // Posluchač události pro zadní stranu kartičky
    if (cardBack) {
        cardBack.addEventListener('click', function(event) {
            // Zabránit bublání události, aby se neaktivovala dvakrát
            event.stopPropagation();
            
            // Ignorovat kliknutí na tlačítka nebo hodnocení
            if (event.target.closest('button') || 
                event.target.closest('#rating-btns')) {
                return;
            }
            
            // Otočit kartičku zpět
            flipCard();
        });
    }

    // Poslouchat na kliknutí na hodnocení
    document.querySelectorAll('.rating-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // V reálné aplikaci bychom tady ukládali hodnocení
            
            // Přejít na další kartu
            if (currentCardIndex < currentDeck.cards.length - 1) {
                currentCardIndex++;
                showCard(currentCardIndex);
                updateProgressBar();
            } else {
                // Konec balíčku
                showMessage('Gratuluji! Dokončili jste všechny kartičky v tomto balíčku.', 'success');
                showSection(homeSection);
            }
        });
    });

    // Přidat styly pro floating zprávy (pokud ještě nejsou v CSS souboru)
    const addStyles = () => {
        // Kontrola, zda styly už existují
        if (document.querySelector('#floating-message-styles')) return;
        
        const styleElement = document.createElement('style');
        styleElement.id = 'floating-message-styles';
        
        styleElement.textContent = `
            .floating-message {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 5px;
                box-shadow: 0 3px 10px rgba(0,0,0,0.2);
                z-index: 1000;
                max-width: 300px;
                animation: slideIn 0.5s ease;
            }
            
            .floating-message.hiding {
                animation: slideOut 0.5s ease;
            }
            
            .info-message {
                background-color: #3498db;
                color: white;
            }
            
            .success-message {
                background-color: #2ecc71;
                color: white;
            }
            
            .error-message {
                background-color: #e74c3c;
                color: white;
            }
            
            .warning-message {
                background-color: #f39c12;
                color: white;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        
        document.head.appendChild(styleElement);
    };
    
    // Přidat styly
    addStyles();

    // Načíst balíčky při prvním spuštění
    loadDecks();
    
    // Přidání kódu pro lepší diagnostiku komunikace se serverem
    const API_BASE = window.location.hostname === 'localhost' ? `http://localhost:${window.location.port || 3000}` : '';

    /**
     * Vylepšená funkce pro volání API s lepším ošetřením chyb
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Volby pro fetch
     * @returns {Promise} - Výsledek API volání
     */
    async function callApi(endpoint, options = {}) {
        const url = `${API_BASE}/api/${endpoint}`;
        
        try {
            console.log(`Volám API: ${url}`);
            
            // Přidáme timeout pro detekci problémů s připojením
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 sekund timeout
            
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                console.error(`API chyba (${response.status}):`, await response.text());
                
                // Kontrola běžných stavových kódů
                if (response.status === 404) {
                    throw new Error('Požadovaný zdroj nebyl nalezen');
                } else if (response.status === 500) {
                    throw new Error('Interní chyba serveru');
                } else {
                    throw new Error(`HTTP chyba ${response.status}`);
                }
            }
            
            // Pokusíme se zpracovat odpověď jako JSON
            try {
                return await response.json();
            } catch (jsonError) {
                console.warn('Odpověď není platný JSON:', jsonError);
                return null;
            }
        } catch (error) {
            // Detek
        }
    }

    // Obsluha klávesových zkratek
    document.addEventListener('keydown', (event) => {
        // Pouze pokud jsme v sekci studia
        if (!studySection.classList.contains('active-section')) return;
        
        if (event.code === 'Space' || event.code === 'Enter') {
            // Mezerník nebo Enter pro otočení karty
            event.preventDefault();
            flipCard();
        } else if (event.code === 'ArrowRight' || event.code === 'KeyN') {
            // Šipka doprava nebo N pro další kartu (pouze když je karta otočená)
            if (isCardFlipped && currentCardIndex < currentDeck.cards.length - 1) {
                event.preventDefault();
                currentCardIndex++;
                showCard(currentCardIndex);
                updateProgressBar();
            }
        } else if (event.code === 'ArrowLeft' || event.code === 'KeyP') {
            // Šipka doleva nebo P pro předchozí kartu
            if (currentCardIndex > 0) {
                event.preventDefault();
                currentCardIndex--;
                showCard(currentCardIndex);
                updateProgressBar();
                isCardFlipped = false;
            }
        } else if (event.code === 'Digit1' && isCardFlipped) {
            // 1 pro hodnocení "Znovu"
            document.querySelector('.rating-btn[data-rating="1"]')?.click();
        } else if (event.code === 'Digit2' && isCardFlipped) {
            // 2 pro hodnocení "Těžké"
            document.querySelector('.rating-btn[data-rating="3"]')?.click();
        } else if (event.code === 'Digit3' && isCardFlipped) {
            // 3 pro hodnocení "Dobré"
            document.querySelector('.rating-btn[data-rating="4"]')?.click();
        } else if (event.code === 'Digit4' && isCardFlipped) {
            // 4 pro hodnocení "Snadné"
            document.querySelector('.rating-btn[data-rating="5"]')?.click();
        } else if (event.code === 'KeyR') {
            // R pro přepnutí náhodného pořadí
            if (randomOrderToggle) {
                randomOrderToggle.checked = !randomOrderToggle.checked;
                randomOrderToggle.dispatchEvent(new Event('change'));
            }
        }
    });
});
