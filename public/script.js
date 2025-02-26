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

    // Stav aplikace
    let currentDeck = null;
    let currentCardIndex = 0;
    let isCardFlipped = false;
    let isLoading = false;
    
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
            deckElement.innerHTML = `
                <h3>${deck.name}</h3>
                <div class="deck-stats">
                    <p>${deck.cards ? deck.cards.length : 0} kartiček</p>
                    <p>Přidáno: ${formatDate(deck.created)}</p>
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
        
        deckTitle.textContent = currentDeck.name;
        updateProgressBar();
        showCard(currentCardIndex);
    }

    function showCard(index) {
        if (!currentDeck || !currentDeck.cards || index >= currentDeck.cards.length) {
            showMessage('Došlo k chybě při zobrazení kartičky', 'error');
            return;
        }
        
        const card = currentDeck.cards[index];
        
        // Zpracování speciálních karet s matematickými výpočty (pro náhodné balíčky)
        if (card.front.includes('+') && card.back.includes('vypočítána')) {
            const matches = card.front.match(/Kolik je (\d+) \+ (\d+)/);
            if (matches && matches.length === 3) {
                const num1 = parseInt(matches[1]);
                const num2 = parseInt(matches[2]);
                card.back = `${num1 + num2}`;
            }
        }
        
        cardFront.innerHTML = card.front;
        cardBack.innerHTML = card.back;
        
        cardFront.classList.remove('hidden');
        cardBack.classList.add('hidden');
        isCardFlipped = false;
        
        flipBtn.style.display = 'block';
        ratingBtns.classList.add('hidden');
    }

    function updateProgressBar() {
        if (!currentDeck || !currentDeck.cards || currentDeck.cards.length === 0) return;
        
        const progress = ((currentCardIndex + 1) / currentDeck.cards.length) * 100;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${currentCardIndex + 1}/${currentDeck.cards.length}`;
    }

    // Ovládání kartiček
    flipBtn.addEventListener('click', () => {
        isCardFlipped = !isCardFlipped;
        
        if (isCardFlipped) {
            cardFront.classList.add('hidden');
            cardBack.classList.remove('hidden');
            flipBtn.style.display = 'none';
            ratingBtns.classList.remove('hidden');
        } else {
            cardFront.classList.remove('hidden');
            cardBack.classList.add('hidden');
            flipBtn.style.display = 'block';
            ratingBtns.classList.add('hidden');
        }
    });

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
});
