document.addEventListener('DOMContentLoaded', function() {
    // Navigační tlačítka
    const homeBtn = document.getElementById('homeBtn');
    const studyBtn = document.getElementById('studyBtn');
    const loadDeckBtn = document.getElementById('loadDeckBtn');
    const loadTextDeckBtn = document.getElementById('loadTextDeckBtn');
    const aboutBtn = document.getElementById('aboutBtn');

    // Sekce
    const homeSection = document.getElementById('home-section');
    const studySection = document.getElementById('study-section');
    const aboutSection = document.getElementById('about-section');
    const loadTextSection = document.getElementById('load-text-section');

    // Navigace
    function showSection(section) {
        // Skrýt všechny sekce
        [homeSection, studySection, aboutSection, loadTextSection].forEach(s => {
            s.classList.add('hidden-section');
            s.classList.remove('active-section');
        });
        
        // Zobrazit vybranou sekci
        section.classList.remove('hidden-section');
        section.classList.add('active-section');
        
        // Aktualizovat aktivní tlačítko
        [homeBtn, studyBtn, loadDeckBtn, loadTextDeckBtn, aboutBtn].forEach(btn => {
            btn.classList.remove('active');
        });
    }

    // Event listenery pro navigační tlačítka
    homeBtn.addEventListener('click', () => {
        showSection(homeSection);
        homeBtn.classList.add('active');
        loadDecks();
    });
    
    studyBtn.addEventListener('click', () => {
        showSection(studySection);
        studyBtn.classList.add('active');
    });
    
    loadDeckBtn.addEventListener('click', () => {
        // Zde bude implementována funkcionalita pro načtení balíčku
        showSection(homeSection);
        loadDeckBtn.classList.add('active');
    });
    
    loadTextDeckBtn.addEventListener('click', () => {
        // Zobrazit sekci pro načítání textových kartiček
        showSection(loadTextSection);
        loadTextDeckBtn.classList.add('active');
        // Zkontrolovat dostupné textové balíčky
        checkTextDecks();
    });
    
    aboutBtn.addEventListener('click', () => {
        showSection(aboutSection);
        aboutBtn.classList.add('active');
    });

    // Načtení balíčků při startu aplikace
    loadDecks();

    // Funkce pro načtení balíčků ze serveru
    function loadDecks() {
        const decksContainer = document.getElementById('decks-container');
        const noDecks = document.getElementById('no-decks');
        
        // Zobrazit zprávu o načítání
        decksContainer.innerHTML = '<div class="loading-indicator"><div class="spinner"></div><p>Načítám balíčky...</p></div>';
        noDecks.style.display = 'none';
        
        // Přidat timeout pro detekci problémů s připojením
        const timeout = setTimeout(() => {
            console.warn('Požadavek na balíčky trvá nezvykle dlouho...');
        }, 5000); // 5 sekund

        fetch('/api/decks')
            .then(response => {
                clearTimeout(timeout);
                if (!response.ok) {
                    throw new Error(`HTTP chyba ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.length === 0) {
                    decksContainer.innerHTML = '';
                    noDecks.style.display = 'block';
                    return;
                }
                
                noDecks.style.display = 'none';
                displayDecks(data, decksContainer);
            })
            .catch(error => {
                clearTimeout(timeout);
                console.error('Chyba při načítání balíčků:', error);
                
                // Zkusit načíst lokálně uložené balíčky
                const cachedDecks = localStorage.getItem('cachedDecks');
                if (cachedDecks) {
                    try {
                        const decks = JSON.parse(cachedDecks);
                        console.log('Používám lokálně uloženou kopii balíčků');
                        displayDecks(decks, decksContainer);
                        
                        // Zobrazit varování o použití cache
                        const warningElement = document.createElement('div');
                        warningElement.className = 'warning-message';
                        warningElement.innerHTML = 
                            '<p>⚠️ Používáme lokálně uložené balíčky, protože se nepodařilo připojit k serveru.</p>' +
                            '<button id="retryBtn" class="primary-btn">Zkusit znovu</button>';
                        decksContainer.insertAdjacentElement('beforebegin', warningElement);
                        
                        document.getElementById('retryBtn').addEventListener('click', () => {
                            warningElement.remove();
                            loadDecks();
                        });
                        
                        return;
                    } catch (e) {
                        console.error('Chyba při načítání lokálních balíčků:', e);
                    }
                }
                
                // Pokud nemáme ani lokální data, zobrazit detailní chybovou zprávu
                decksContainer.innerHTML = '';
                noDecks.style.display = 'block';
                
                // Přidat detailnější chybovou zprávu
                let errorMessage = 'Nepodařilo se načíst balíčky. ';
                
                // Diagnostické informace
                if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
                    errorMessage += 'Pravděpodobně není spuštěn server nebo je nedostupný. ';
                    errorMessage += '<ol>' +
                        '<li>Zkontrolujte, zda je server spuštěn (npm start)</li>' +
                        '<li>Ujistěte se, že používáte správnou URL adresu</li>' +
                        '<li>Zkuste restartovat server</li>' +
                        '</ol>';
                } else if (error.message.includes('HTTP chyba')) {
                    errorMessage += `Server vrátil chybu: ${error.message}. `;
                    errorMessage += 'Zkontrolujte logy serveru pro více informací.';
                } else {
                    errorMessage += `Důvod: ${error.message}`;
                }
                
                errorMessage += '<div class="actions-container">' +
                    '<button id="retryLoadBtn" class="primary-btn">Zkusit znovu</button>' +
                    '</div>';
                
                noDecks.innerHTML = `<p class="error-message">${errorMessage}</p>`;
                
                // Přidat funkčnost tlačítku "Zkusit znovu"
                document.getElementById('retryLoadBtn')?.addEventListener('click', () => {
                    loadDecks();
                });
            });
    }

    // Zobrazení balíčků
    function displayDecks(decks, container) {
        container.innerHTML = '';
        
        decks.forEach(deck => {
            const deckCard = document.createElement('div');
            deckCard.className = 'deck-card';
            deckCard.setAttribute('data-id', deck.id);
            
            const title = document.createElement('h3');
            title.textContent = deck.name;
            
            const stats = document.createElement('div');
            stats.className = 'deck-stats';
            stats.textContent = `${deck.cards.length} kartiček`;
            
            deckCard.appendChild(title);
            deckCard.appendChild(stats);
            
            deckCard.addEventListener('click', () => {
                startStudySession(deck.id);
            });
            
            container.appendChild(deckCard);
        });
    }

    // Začátek studia
    function startStudySession(deckId) {
        console.log(`Načítám balíček s ID: ${deckId} pro studium`);
        
        // Přidat indikátor načítání
        const studySection = document.getElementById('study-section');
        if (!studySection) {
            console.error('Sekce pro studium nebyla nalezena!');
            return;
        }
        
        studySection.innerHTML = '<div class="loading-indicator"><div class="spinner"></div><p>Načítám balíček...</p></div>';
        
        // Zobrazit sekci studia již během načítání
        showSection(studySection);
        studyBtn.classList.add('active');
        
        fetch(`/api/decks/${deckId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP chyba ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(deck => {
                console.log(`Balíček načten: ${deck.name}, kartiček: ${deck.cards ? deck.cards.length : 0}`);
                
                if (!deck.cards || deck.cards.length === 0) {
                    console.error('Balíček neobsahuje žádné kartičky', deck);
                    alert('Balíček neobsahuje žádné kartičky. Vracím se na domovskou stránku.');
                    showSection(homeSection);
                    homeBtn.classList.add('active');
                    return;
                }
                
                // Vytvořit strukturu pro studium přímo (bez načítání šablony)
                createStudyInterface(studySection, deck);
                
                // Načíst preferenci náhodného pořadí z localStorage
                const randomPreference = localStorage.getItem('randomOrderPreference') === 'true';
                
                // Nastavit název balíčku
                const deckTitle = document.getElementById('deck-title');
                if (deckTitle) {
                    deckTitle.textContent = deck.name;
                }
                
                // Příprava kartiček - použít uloženou preferenci
                setupStudySession(deck.cards, randomPreference);
            })
            .catch(error => {
                console.error('Chyba při načítání balíčku:', error);
                
                studySection.innerHTML = `
                    <div class="error-message">
                        <p>Nepodařilo se načíst balíček. ${error.message}</p>
                        <div class="actions-container">
                            <button onclick="window.location.reload()" class="primary-btn">Zkusit znovu</button>
                            <button id="goHomeBtn" class="secondary-btn">Zpět na úvod</button>
                        </div>
                    </div>
                `;
                
                document.getElementById('goHomeBtn')?.addEventListener('click', () => {
                    showSection(homeSection);
                    homeBtn.classList.add('active');
                });
            });
    }

    // Funkce pro vytvoření rozhraní pro studium
    function createStudyInterface(container, deck) {
        // Zjistit preferenci náhodného pořadí z localStorage
        const isRandomOrder = localStorage.getItem('randomOrderPreference') === 'true';
        
        container.innerHTML = `
            <div class="deck-info">
                <h2 id="deck-title">${deck.name}</h2>
                <div class="progress-container">
                    <div id="progress-bar" class="progress-bar"></div>
                </div>
                <span id="progress-text">0/${deck.cards.length}</span>
                <div class="settings-container">
                    <label class="toggle-switch">
                        <input type="checkbox" id="randomOrderToggle" ${isRandomOrder ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                        <span class="toggle-label">Náhodné pořadí</span>
                    </label>
                </div>
            </div>

            <div class="flashcard-container">
                <div id="flashcard" class="flashcard" tabindex="0" aria-label="Klikněte nebo stiskněte Enter pro otočení kartičky">
                    <div id="card-front" class="card-side card-front"></div>
                    <div id="card-back" class="card-side card-back hidden"></div>
                </div>
            </div>

            <div class="controls">
                <button id="flipBtn" class="control-btn">Otočit</button>
                <div class="rating-btns hidden" id="rating-btns">
                    <button data-rating="1" class="rating-btn">Znovu</button>
                    <button data-rating="3" class="rating-btn">Těžké</button>
                    <button data-rating="4" class="rating-btn">Dobré</button>
                    <button data-rating="5" class="rating-btn">Snadné</button>
                </div>
            </div>

            <div class="study-actions">
                <button id="endSessionBtn" class="secondary-btn">Ukončit studium</button>
                <button id="restartSessionBtn" class="secondary-btn">Začít znovu</button>
            </div>
        `;
    }

// Globální proměnné pro sledování event listenerů
let activeStudySession = null;
let cardEventListeners = {};

// Nastavení studia
function setupStudySession(cards, randomOrder) {
    try {
        // Vyčistit předchozí studijní relaci, pokud existuje
        if (activeStudySession) {
            cleanupActiveSession();
        }

        console.log(`Inicializuji studijní relaci, náhodné pořadí: ${randomOrder}`);
        
        if (!cards || !Array.isArray(cards) || cards.length === 0) {
            console.error('Neplatné kartičky předané do setupStudySession:', cards);
            alert('Chyba: Balíček neobsahuje žádné platné kartičky.');
            return;
        }
        
        // Vytvořit nový objekt pro studijní relaci
        activeStudySession = {
            originalCards: [...cards],
            currentCards: [],
            currentIndex: 0,
            isRandomOrder: randomOrder
        };
        
        // Nastavit pořadí karet podle preference
        if (randomOrder) {
            activeStudySession.currentCards = shuffleArray([...cards]);
            console.log('Kartičky byly zamíchány do náhodného pořadí');
        } else {
            activeStudySession.currentCards = [...cards];
            console.log('Kartičky jsou v původním pořadí');
        }
        
        // Reference na prvky UI
        const elements = {
            cardFront: document.getElementById('card-front'),
            cardBack: document.getElementById('card-back'),
            flashcard: document.getElementById('flashcard'),
            flipBtn: document.getElementById('flipBtn'),
            progressBar: document.getElementById('progress-bar'),
            progressText: document.getElementById('progress-text'),
            ratingBtns: document.getElementById('rating-btns'),
            randomOrderToggle: document.getElementById('randomOrderToggle'),
            endSessionBtn: document.getElementById('endSessionBtn'),
            restartSessionBtn: document.getElementById('restartSessionBtn')
        };
        
        // Kontrola, zda byly všechny potřebné elementy nalezeny
        for (const [key, element] of Object.entries(elements)) {
            if (!element) {
                throw new Error(`Element ${key} nebyl nalezen`);
            }
        }
        
        // Uložit elementy do aktivní relace
        activeStudySession.elements = elements;
        
        // Inicializace UI
        updateProgress(0, activeStudySession.currentCards.length);
        showCard(activeStudySession.currentCards[0]);
        
        // Resetovat tlačítka hodnocení
        elements.ratingBtns.classList.add('hidden');
        
        // Synchronizovat stav přepínače s aktivní relací
        elements.randomOrderToggle.checked = randomOrder;
        
        // Uložit preferenci do localStorage
        localStorage.setItem('randomOrderPreference', randomOrder);
        
        // Registrovat a sledovat event listenery
        cardEventListeners = {};
        
        // Event listener pro přepínač náhodného pořadí
        addEventListenerWithTracking(elements.randomOrderToggle, 'change', () => {
            // Uložit novou preferenci
            const newPreference = elements.randomOrderToggle.checked;
            localStorage.setItem('randomOrderPreference', newPreference);
            
            console.log(`Změna náhodného pořadí: ${newPreference}`);
            
            // Restartovat studium s novým nastavením
            setupStudySession(activeStudySession.originalCards, newPreference);
        }, 'randomToggle');
        
        // Event listener pro otočení karty - tlačítko
        addEventListenerWithTracking(elements.flipBtn, 'click', flipCard, 'flipButton');
        
        // Event listener pro otočení karty - kliknutí na kartu
        addEventListenerWithTracking(elements.flashcard, 'click', flipCard, 'flashcardClick');
        
        // Event listener pro klávesnici (Enter pro otočení karty)
        addEventListenerWithTracking(elements.flashcard, 'keydown', (e) => {
            if (e.key === 'Enter') {
                flipCard();
            }
        }, 'flashcardKeydown');
        
        // Nouzový event listener pro celou stránku (při zaseknutí)
        addEventListenerWithTracking(document, 'keydown', (e) => {
            if (e.key === ' ' || e.key === 'f') { // Mezerník nebo klávesa 'f'
                console.log('Nouzové otočení karty klávesou');
                flipCard();
            }
        }, 'documentKeydown');
        
        // Event listener pro ukončení studia
        addEventListenerWithTracking(elements.endSessionBtn, 'click', () => {
            showSection(homeSection);
            homeBtn.classList.add('active');
            cleanupActiveSession();
        }, 'endSession');
        
        // Event listener pro restart studia
        addEventListenerWithTracking(elements.restartSessionBtn, 'click', () => {
            setupStudySession(activeStudySession.originalCards, elements.randomOrderToggle.checked);
        }, 'restartSession');
        
        // Přidání event listenerů pro tlačítka hodnocení
        const ratingButtons = document.querySelectorAll('.rating-btn');
        ratingButtons.forEach((button, index) => {
            addEventListenerWithTracking(button, 'click', () => {
                const rating = parseInt(button.getAttribute('data-rating'));
                moveToNextCard(rating);
            }, `ratingButton${index}`);
        });
        
        console.log('Studijní relace byla úspěšně inicializována');
        
    } catch (error) {
        console.error('Chyba při nastavování studia:', error);
        alert('Nastala chyba při přípravě studia: ' + error.message);
        cleanupActiveSession();
    }
}

// Pomocná funkce pro přidání a sledování event listeneru
function addEventListenerWithTracking(element, eventType, handler, handlerName) {
    if (!element) {
        console.warn(`Nelze přidat listener ${handlerName} - element neexistuje`);
        return;
    }
    
    const key = `${element.id || 'anonymous'}-${eventType}-${handlerName}`;
    
    // Odstranit existující event listener, pokud již existuje
    if (cardEventListeners[key]) {
        element.removeEventListener(eventType, cardEventListeners[key]);
        console.log(`Odstraněn existující event listener: ${key}`);
    }
    
    // Obalení handleru pro lepší diagnostiku
    const trackedHandler = (e) => {
        console.log(`Event listener volán: ${key}`);
        handler(e);
    };
    
    // Přidání nového event listeneru
    element.addEventListener(eventType, trackedHandler);
    cardEventListeners[key] = trackedHandler;
    console.log(`Přidán nový event listener: ${key}`);
}

// Funkce pro vyčištění aktivní relace
function cleanupActiveSession() {
    console.log('Čištění aktivní studijní relace');
    
    // Odstranit všechny registrované event listenery
    for (const [key, handler] of Object.entries(cardEventListeners)) {
        const [elementId, eventType] = key.split('-');
        const element = elementId === 'document' ? document : document.getElementById(elementId);
        
        if (element && handler) {
            element.removeEventListener(eventType, handler);
            console.log(`Odstraněn event listener: ${key}`);
        }
    }
    
    // Vyčistit objekt s listenery
    cardEventListeners = {};
    activeStudySession = null;
}

// Funkce pro otočení karty
function flipCard() {
    if (!activeStudySession) return;
    
    const { elements } = activeStudySession;
    
    if (elements.cardFront.classList.contains('hidden')) {
        // Otočit zpět na přední stranu
        elements.cardFront.classList.remove('hidden');
        elements.cardBack.classList.add('hidden');
        elements.ratingBtns.classList.add('hidden');
        elements.flipBtn.textContent = 'Otočit';
    } else {
        // Otočit na zadní stranu
        elements.cardFront.classList.add('hidden');
        elements.cardBack.classList.remove('hidden');
        elements.ratingBtns.classList.remove('hidden');
        elements.flipBtn.textContent = 'Zpět';
    }
}

// Funkce pro přechod na další kartu
function moveToNextCard(rating) {
    if (!activeStudySession) return;
    
    const { elements, currentCards } = activeStudySession;
    
    // Přejít na další kartu
    activeStudySession.currentIndex++;
    
    // Kontrola, zda jsme na konci balíčku
    if (activeStudySession.currentIndex >= currentCards.length) {
        // Konec studia
        alert('Gratuluji! Dokončili jste studium tohoto balíčku.');
        showSection(homeSection);
        homeBtn.classList.add('active');
        cleanupActiveSession();
        return;
    }
    
    // Aktualizovat progress
    updateProgress(activeStudySession.currentIndex, currentCards.length);
    
    // Zobrazit další kartu
    showCard(currentCards[activeStudySession.currentIndex]);
    
    // Resetovat na přední stranu
    elements.cardFront.classList.remove('hidden');
    elements.cardBack.classList.add('hidden');
    elements.ratingBtns.classList.add('hidden');
    elements.flipBtn.textContent = 'Otočit';
}

    // Zobrazení karty
    function showCard(card) {
        if (!card) return;
        
        const cardFront = document.getElementById('card-front');
        const cardBack = document.getElementById('card-back');
        
        // Nastavit obsah karty
        cardFront.innerHTML = card.front;
        cardBack.innerHTML = card.back;
        
        // Kontrola, zda karta obsahuje obrázky
        const hasImage = cardFront.querySelector('img') || cardBack.querySelector('img');
        const flashcard = document.getElementById('flashcard');
        
        if (hasImage) {
            flashcard.classList.add('has-image');
        } else {
            flashcard.classList.remove('has-image');
        }
    }

    // Aktualizace progress baru
    function updateProgress(current, total) {
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        
        const percentage = (current / total) * 100;
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = `${current}/${total}`;
    }

    // Pomocná funkce pro míchání pole
    function shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    // Funkce pro kontrolu dostupných textových balíčků
    function checkTextDecks() {
        const textDecksContainer = document.getElementById('text-decks-container');
        const noTextDecks = document.getElementById('no-text-decks');
        const textLoading = document.getElementById('text-loading');
        
        // Zobrazit načítání
        textDecksContainer.innerHTML = '';
        noTextDecks.style.display = 'none';
        textLoading.classList.remove('hidden');
        
        // Kontrola Vercel prostředí
        const isVercel = window.location.hostname.includes('vercel.app');
        
        // Timeout pro dlouhé požadavky
        const timeout = setTimeout(() => {
            console.warn('Požadavek na textové balíčky trvá nezvykle dlouho...');
        }, 5000);
        
        // Vercel prostředí - přímé načtení statických balíčků
        if (isVercel) {
            console.log('Detekováno Vercel.app prostředí, přímé načtení balíčků');
            clearTimeout(timeout);
            textLoading.classList.add('hidden');
            autoLoadTextDecks();
            return;
        }

        // Načíst textové balíčky ze serveru
        fetch('/api/text-decks')
            .then(response => {
                clearTimeout(timeout);
                if (!response.ok) {
                    throw new Error(`HTTP chyba ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                textLoading.classList.add('hidden');
                        
                if (!data || data.length === 0) {
                    noTextDecks.style.display = 'block';
                    // Automaticky spustíme načítání textových balíčků ze složky
                    autoLoadTextDecks();
                    return;
                }
                
                // Uložit data do mezipaměti
                try {
                    localStorage.setItem('cachedTextDecks', JSON.stringify(data));
                } catch (e) {
                    console.warn('Nelze uložit textové balíčky do mezipaměti:', e);
                }
                
                displayDecks(data, textDecksContainer);
            })
            .catch(error => {
                // ...existing error handling code...
            });
    }

    // Funkce pro automatické načtení textových balíčků
    function autoLoadTextDecks() {
        const textLoading = document.getElementById('text-loading');
        textLoading.classList.remove('hidden');
        
        const isVercel = window.location.hostname.includes('vercel.app');
        console.log(isVercel ? 'Načítání probíhá na Vercel.app' : 'Načítání probíhá lokálně');
        
        fetch('/api/load-text-decks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                vercel: isVercel
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP chyba ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            textLoading.classList.add('hidden');
            
            if (data.success) {
                // Čekáme chvíli, aby bylo jasné, že se něco stalo
                setTimeout(() => {
                    let message = `Úspěšně načteno ${data.decksCount} textových balíčků`;
                    
                    // Přidat informaci o prostředí pro lepší diagnostiku
                    if (data.isServerless) {
                        message += ` (v serverless prostředí ${data.environment || 'Vercel'})`;
                    }
                    
                    // Zobrazit toast místo alertu na Vercelu
                    if (isVercel) {
                        showToast(message, 'success');
                    } else {
                        alert(message);
                    }
                    
                    // Redirect na hlavní stránku s balíčky pro Vercel
                    if (isVercel) {
                        showSection(homeSection);
                        homeBtn.classList.add('active');
                        loadDecks();
                    } else {
                        checkTextDecks(); // Znovu načíst a zobrazit balíčky pro lokální prostředí
                    }
                }, 500);
            } else {
                let errorMsg = 'Nepodařilo se načíst textové balíčky: ' + (data.error || 'Neznámá chyba');
                if (data.isServerless) {
                    errorMsg += ' (v serverless prostředí)';
                }
                
                if (isVercel) {
                    showToast(errorMsg, 'error');
                } else {
                    alert(errorMsg);
                }
            }
        })
        .catch(error => {
            console.error('Chyba při načítání textových balíčků:', error);
            textLoading.classList.add('hidden');
            
            let errorMessage = 'Nepodařilo se načíst textové balíčky. ';
            
            if (window.location.hostname.includes('vercel.app')) {
                errorMessage += 'Aplikace běží na Vercel.app, zkuste obnovit stránku.';
                showToast(errorMessage, 'error');
                
                // Přejít na hlavní stránku ve Vercel prostředí
                showSection(homeSection);
                homeBtn.classList.add('active');
            } else {
                errorMessage += 'Zkontrolujte, zda je server spuštěn a dostupný.';
                alert(errorMessage);
            }
        });
    }

    // Pomocná funkce pro zobrazení toast zprávy (pro Vercel prostředí)
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}-toast`;
        toast.innerHTML = message;
        
        document.body.appendChild(toast);
        
        // Zobrazení toastu
        setTimeout(() => {
            toast.classList.add('show-toast');
        }, 100);
        
        // Automatické skrytí toastu po 5 sekundách
        setTimeout(() => {
            toast.classList.remove('show-toast');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 500);
        }, 5000);
    }

    // Přidání funkcionality pro automatické načtení textových kartiček
    const autoLoadTextBtn = document.getElementById('autoLoadTextBtn');
    if (autoLoadTextBtn) {
        autoLoadTextBtn.addEventListener('click', autoLoadTextDecks);
    }

    // Odstranění nepotřebných UI prvků
    function removeUnwantedElements() {
        // Odstraní zbytečný text "Studovat Resetovat Smazat" pokud se objeví na stránce
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.TEXT_NODE && 
                            node.textContent.includes('Studovat Resetovat Smazat')) {
                            node.textContent = node.textContent.replace('Studovat Resetovat Smazat', '');
                        }
                        
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const textNodes = [...node.childNodes].filter(n => 
                                n.nodeType === Node.TEXT_NODE && 
                                n.textContent.includes('Studovat Resetovat Smazat'));
                            
                            textNodes.forEach(textNode => {
                                textNode.textContent = textNode.textContent.replace('Studovat Resetovat Smazat', '');
                            });
                        }
                    });
                }
            });
        });
        
        // Sledovat změny v celém dokumentu
        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });
    }

    // Spustit odstranění nežádoucích prvků
    removeUnwantedElements();
});
