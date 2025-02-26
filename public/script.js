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
