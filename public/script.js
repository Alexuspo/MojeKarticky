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

    // Navigace
    function showSection(section) {
        // Skrýt všechny sekce
        [homeSection, studySection, aboutSection].forEach(s => {
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
        // Zde bude implementována funkcionalita pro načtení z textu
        showSection(homeSection);
        loadTextDeckBtn.classList.add('active');
    });
    
    aboutBtn.addEventListener('click', () => {
        showSection(aboutSection);
        aboutBtn.classList.add('active');
    });

    // Načtení balíčků při startu aplikace
    loadDecks();

    // Funkce pro načtení balíčků ze serveru
    function loadDecks() {
        fetch('/api/decks')
            .then(response => response.json())
            .then(data => {
                const decksContainer = document.getElementById('decks-container');
                const noDecks = document.getElementById('no-decks');
                
                if (data.length === 0) {
                    decksContainer.innerHTML = '';
                    noDecks.style.display = 'block';
                    return;
                }
                
                noDecks.style.display = 'none';
                displayDecks(data, decksContainer);
            })
            .catch(error => {
                console.error('Chyba při načítání balíčků:', error);
                alert('Nepodařilo se načíst balíčky. Zkontrolujte připojení k serveru.');
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
        fetch(`/api/decks/${deckId}`)
            .then(response => response.json())
            .then(deck => {
                if (!deck || !deck.cards || deck.cards.length === 0) {
                    alert('Balíček neobsahuje žádné kartičky.');
                    return;
                }
                
                // Nastavení studia
                const deckTitle = document.getElementById('deck-title');
                deckTitle.textContent = deck.name;
                
                // Příprava kartiček
                const randomOrderToggle = document.getElementById('randomOrderToggle');
                setupStudySession(deck.cards, randomOrderToggle.checked);
                
                // Přepnutí na sekci studia
                showSection(studySection);
                studyBtn.classList.add('active');
            })
            .catch(error => {
                console.error('Chyba při načítání balíčku:', error);
                alert('Nepodařilo se načíst balíček. Zkontrolujte připojení k serveru.');
            });
    }

    // Nastavení studia
    function setupStudySession(cards, randomOrder) {
        let currentCards = [...cards];
        if (randomOrder) {
            // Zamíchání kartiček
            currentCards = shuffleArray(currentCards);
        }
        
        let currentIndex = 0;
        const totalCards = currentCards.length;
        
        // Reference na prvky
        const cardFront = document.getElementById('card-front');
        const cardBack = document.getElementById('card-back');
        const flashcard = document.getElementById('flashcard');
        const flipBtn = document.getElementById('flipBtn');
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        const ratingBtns = document.getElementById('rating-btns');
        const randomOrderToggle = document.getElementById('randomOrderToggle');
        
        // Nastavení počátečního stavu
        updateProgress(0, totalCards);
        showCard(currentCards[0]);
        
        // Resetovat tlačítka hodnocení
        ratingBtns.classList.add('hidden');
        
        // Event listener pro přepínač náhodného pořadí
        randomOrderToggle.addEventListener('change', () => {
            setupStudySession(cards, randomOrderToggle.checked);
        });
        
        // Event listener pro otočení karty
        flashcard.addEventListener('click', flipCard);
        flipBtn.addEventListener('click', flipCard);
        
        // Event listener pro klávesnici (Enter pro otočení karty)
        flashcard.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                flipCard();
            }
        });
        
        // Funkce pro otočení karty
        function flipCard() {
            if (cardFront.classList.contains('hidden')) {
                // Otočit zpět na přední stranu
                cardFront.classList.remove('hidden');
                cardBack.classList.add('hidden');
                ratingBtns.classList.add('hidden');
                flipBtn.textContent = 'Otočit';
            } else {
                // Otočit na zadní stranu
                cardFront.classList.add('hidden');
                cardBack.classList.remove('hidden');
                ratingBtns.classList.remove('hidden');
                flipBtn.textContent = 'Zpět';
            }
        }
        
        // Event listenery pro tlačítka hodnocení
        const ratingButtons = document.querySelectorAll('.rating-btn');
        ratingButtons.forEach(button => {
            button.addEventListener('click', () => {
                const rating = parseInt(button.getAttribute('data-rating'));
                
                // Přejít na další kartu
                currentIndex++;
                if (currentIndex >= totalCards) {
                    // Konec studia
                    alert('Gratuluji! Dokončili jste studium tohoto balíčku.');
                    showSection(homeSection);
                    homeBtn.classList.add('active');
                    return;
                }
                
                // Aktualizovat progress
                updateProgress(currentIndex, totalCards);
                
                // Zobrazit další kartu
                showCard(currentCards[currentIndex]);
                
                // Resetovat na přední stranu
                cardFront.classList.remove('hidden');
                cardBack.classList.add('hidden');
                ratingBtns.classList.add('hidden');
                flipBtn.textContent = 'Otočit';
            });
        });
        
        // Tlačítka pro ukončení a restart studia
        document.getElementById('endSessionBtn').addEventListener('click', () => {
            showSection(homeSection);
            homeBtn.classList.add('active');
        });
        
        document.getElementById('restartSessionBtn').addEventListener('click', () => {
            setupStudySession(cards, randomOrderToggle.checked);
        });
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
