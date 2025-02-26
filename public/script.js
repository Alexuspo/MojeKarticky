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
        if (studySection) {{
            studySection.innerHTML = '<div class="loading-indicator"><div class="spinner"></div><p>Načítám balíček...</p></div>';
        }   return;
        }
        // Zobrazit sekci studia již během načítání
        showSection(studySection);<div class="loading-indicator"><div class="spinner"></div><p>Načítám balíček...</p></div>';
        studyBtn.classList.add('active');
        // Zobrazit sekci studia již během načítání
        fetch(`/api/decks/${deckId}`)
            .then(response => {'active');
                if (!response.ok) {
                    throw new Error(`HTTP chyba ${response.status}: ${response.statusText}`);
                }pi/decks/${deckId}`)
                return response.json();
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
                
                // Nastavit název balíčku
                const deckTitle = document.getElementById('deck-title');
                if (deckTitle) {
                    deckTitle.textContent = deck.name;
                }
                
                // Příprava kartiček
                const randomOrderToggle = document.getElementById('randomOrderToggle');
                setupStudySession(deck.cards, randomOrderToggle ? randomOrderToggle.checked : false);
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
        container.innerHTML = `
            <div class="deck-info">
                <h2 id="deck-title">${deck.name}</h2>
                <div class="progress-container">
                    <div id="progress-bar" class="progress-bar"></div>
                </div>
                <span id="progress-text">0/${deck.cards.length}</span>
                <div class="settings-container">
                    <label class="toggle-switch">
                        <input type="checkbox" id="randomOrderToggle">
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
        const flipBtn = document.getElementById('flipBtn');!Array.isArray(cards) || cards.length === 0) {
        const progressBar = document.getElementById('progress-bar');platné kartičky předané do setupStudySession:', cards);
        const progressText = document.getElementById('progress-text'); platné kartičky.');
        const ratingBtns = document.getElementById('rating-btns');       return;
        const randomOrderToggle = document.getElementById('randomOrderToggle');    }
        
        // Nastavení počátečního stavu
        updateProgress(0, totalCards);    if (randomOrder) {
        showCard(currentCards[0]);kartiček
        
        // Resetovat tlačítka hodnocení
        ratingBtns.classList.add('hidden');
        
        // Event listener pro přepínač náhodného pořadí
        randomOrderToggle.addEventListener('change', () => {
            setupStudySession(cards, randomOrderToggle.checked);
        });
            const cardBack = document.getElementById('card-back');
        // Event listener pro otočení karty.getElementById('flashcard');
        flashcard.addEventListener('click', flipCard);etElementById('flipBtn');
        flipBtn.addEventListener('click', flipCard);cument.getElementById('progress-bar');
            const progressText = document.getElementById('progress-text');
        // Event listener pro klávesnici (Enter pro otočení karty).getElementById('rating-btns');
        flashcard.addEventListener('keydown', (e) => {ent.getElementById('randomOrderToggle');
            if (e.key === 'Enter') {    
                flipCard();enty nalezeny
            }ipBtn || !progressBar || 
        });
             console.error('Chybí některé potřebné elementy pro studium');
        // Funkce pro otočení karty        alert('Chyba: Nepodařilo se inicializovat rozhraní pro studium.');
        function flipCard() {
            if (cardFront.classList.contains('hidden')) {
                // Otočit zpět na přední stranu
                cardFront.classList.remove('hidden');    // Nastavení počátečního stavu
                cardBack.classList.add('hidden');
                ratingBtns.classList.add('hidden');
                flipBtn.textContent = 'Otočit';
            } else {ačítka hodnocení
                // Otočit na zadní stranuatingBtns.classList.add('hidden');
                cardFront.classList.add('hidden'); 
                cardBack.classList.remove('hidden');    // Event listener pro přepínač náhodného pořadí
                ratingBtns.classList.remove('hidden');{
                flipBtn.textContent = 'Zpět';ggle.checked = randomOrder;
            }e', () => {
        }ndomOrderToggle.checked);
        
        // Event listenery pro tlačítka hodnocení
        const ratingButtons = document.querySelectorAll('.rating-btn');
        ratingButtons.forEach(button => {
            button.addEventListener('click', () => {d.addEventListener('click', flipCard);
                const rating = parseInt(button.getAttribute('data-rating'));ck', flipCard);
                
                // Přejít na další kartupro otočení karty)
                currentIndex++;=> {
                if (currentIndex >= totalCards) {
                    // Konec studia       flipCard();
                    alert('Gratuluji! Dokončili jste studium tohoto balíčku.');       }
                    showSection(homeSection);    });
                    homeBtn.classList.add('active');
                    return;
                }
                dden')) {
                // Aktualizovat progress
                updateProgress(currentIndex, totalCards);    cardFront.classList.remove('hidden');
                dd('hidden');
                // Zobrazit další kartuclassList.add('hidden');
                showCard(currentCards[currentIndex]);';
                
                // Resetovat na přední stranu
                cardFront.classList.remove('hidden');hidden');
                cardBack.classList.add('hidden');n');
                ratingBtns.classList.add('hidden');tns.classList.remove('hidden');
                flipBtn.textContent = 'Otočit';   flipBtn.textContent = 'Zpět';
            });}
        });
        
        // Tlačítka pro ukončení a restart studiavent listenery pro tlačítka hodnocení
        document.getElementById('endSessionBtn').addEventListener('click', () => {ent.querySelectorAll('.rating-btn');
            showSection(homeSection);
            homeBtn.classList.add('active');button.addEventListener('click', () => {
        });utton.getAttribute('data-rating'));
        
        document.getElementById('restartSessionBtn').addEventListener('click', () => {
            setupStudySession(cards, randomOrderToggle.checked);
        });rds) {
    }         // Konec studia
             alert('Gratuluji! Dokončili jste studium tohoto balíčku.');
    // Zobrazení karty                showSection(homeSection);
    function showCard(card) {tive');
        if (!card) return;
        
        const cardFront = document.getElementById('card-front');
        const cardBack = document.getElementById('card-back');         // Aktualizovat progress
                    updateProgress(currentIndex, totalCards);
        // Nastavit obsah karty
        cardFront.innerHTML = card.front;
        cardBack.innerHTML = card.back;         showCard(currentCards[currentIndex]);
                       
        // Kontrola, zda karta obsahuje obrázky                    // Resetovat na přední stranu
        const hasImage = cardFront.querySelector('img') || cardBack.querySelector('img');rdFront.classList.remove('hidden');
        const flashcard = document.getElementById('flashcard');classList.add('hidden');
        Btns.classList.add('hidden');
        if (hasImage) {            flipBtn.textContent = 'Otočit';
            flashcard.classList.add('has-image');
        } else {
            flashcard.classList.remove('has-image');    
        }nčení a restart studia
    }essionBtn').addEventListener('click', () => {
);
    // Aktualizace progress baru        homeBtn.classList.add('active');
    function updateProgress(current, total) {
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');ntListener('click', () => {
                setupStudySession(cards, randomOrderToggle.checked);
        const percentage = (current / total) * 100;
        progressBar.style.width = `${percentage}%`;
        progressText.textContent = `${current}/${total}`;ole.error('Chyba při nastavování studia:', error);
    }: ' + error.message);

    // Pomocná funkce pro míchání pole
    function shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }const cardFront = document.getElementById('card-front');
        return newArray;ard-back');
    }

    // Funkce pro kontrolu dostupných textových balíčků   cardFront.innerHTML = card.front;
    function checkTextDecks() {        cardBack.innerHTML = card.back;
        const textDecksContainer = document.getElementById('text-decks-container');
        const noTextDecks = document.getElementById('no-text-decks');ahuje obrázky
        const textLoading = document.getElementById('text-loading');uerySelector('img') || cardBack.querySelector('img');
        hcard');
        // Zobrazit načítání
        textDecksContainer.innerHTML = '';
        noTextDecks.style.display = 'none';   flashcard.classList.add('has-image');
        textLoading.classList.remove('hidden');
               flashcard.classList.remove('has-image');
        // Kontrola Vercel prostředí        }
        const isVercel = window.location.hostname.includes('vercel.app');
        
        // Timeout pro dlouhé požadavky
        const timeout = setTimeout(() => {
            console.warn('Požadavek na textové balíčky trvá nezvykle dlouho...');
        }, 5000);const progressText = document.getElementById('progress-text');
        
        // Vercel prostředí - přímé načtení statických balíčkůl) * 100;
        if (isVercel) {tage}%`;
            console.log('Detekováno Vercel.app prostředí, přímé načtení balíčků');${total}`;
            clearTimeout(timeout);
            textLoading.classList.add('hidden');
            autoLoadTextDecks();
            return;tion shuffleArray(array) {
        }
i > 0; i--) {
        // Načíst textové balíčky ze serveru
        fetch('/api/text-decks')rray[i], newArray[j]] = [newArray[j], newArray[i]];
            .then(response => {}
                clearTimeout(timeout);
                if (!response.ok) {
                    throw new Error(`HTTP chyba ${response.status}: ${response.statusText}`);
                }ých textových balíčků
                return response.json();
            }) = document.getElementById('text-decks-container');
            .then(data => {tDecks = document.getElementById('no-text-decks');
                textLoading.classList.add('hidden');onst textLoading = document.getElementById('text-loading');
                        
                if (!data || data.length === 0) {
                    noTextDecks.style.display = 'block';HTML = '';
                    // Automaticky spustíme načítání textových balíčků ze složkyay = 'none';
                    autoLoadTextDecks();hidden');
                    return;
                }
                ercel = window.location.hostname.includes('vercel.app');
                // Uložit data do mezipaměti
                try {eout pro dlouhé požadavky
                    localStorage.setItem('cachedTextDecks', JSON.stringify(data));Timeout(() => {
                } catch (e) {ky trvá nezvykle dlouho...');
                    console.warn('Nelze uložit textové balíčky do mezipaměti:', e);;
                }
                alíčků
                displayDecks(data, textDecksContainer);
            })el.app prostředí, přímé načtení balíčků');
            .catch(error => {meout);
                // ...existing error handling code...oading.classList.add('hidden');
            });LoadTextDecks();
    }

    // Funkce pro automatické načtení textových balíčků
    function autoLoadTextDecks() {íčky ze serveru
        const textLoading = document.getElementById('text-loading');
        textLoading.classList.remove('hidden');(response => {
        clearTimeout(timeout);
        const isVercel = window.location.hostname.includes('vercel.app');
        console.log(isVercel ? 'Načítání probíhá na Vercel.app' : 'Načítání probíhá lokálně');      throw new Error(`HTTP chyba ${response.status}: ${response.statusText}`);
        
        fetch('/api/load-text-decks', {
            method: 'POST',
            headers: {       .then(data => {
                'Content-Type': 'application/json'                textLoading.classList.add('hidden');
            },
            body: JSON.stringify({length === 0) {
                vercel: isVercel
            })ítání textových balíčků ze složky
        })            autoLoadTextDecks();
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP chyba ${response.status}: ${response.statusText}`);        
            }aměti
            return response.json();
        })calStorage.setItem('cachedTextDecks', JSON.stringify(data));
        .then(data => {
            textLoading.classList.add('hidden');      console.warn('Nelze uložit textové balíčky do mezipaměti:', e);
            
            if (data.success) {
                // Čekáme chvíli, aby bylo jasné, že se něco stalo  displayDecks(data, textDecksContainer);
                setTimeout(() => {  })
                    let message = `Úspěšně načteno ${data.decksCount} textových balíčků`; {
                    error handling code...
                    // Přidat informaci o prostředí pro lepší diagnostiku
                    if (data.isServerless) {
                        message += ` (v serverless prostředí ${data.environment || 'Vercel'})`;
                    }kce pro automatické načtení textových balíčků
                    xtDecks() {
                    // Zobrazit toast místo alertu na VerceluyId('text-loading');
                    if (isVercel) {Loading.classList.remove('hidden');
                        showToast(message, 'success');
                    } else {.app');
                        alert(message);čítání probíhá na Vercel.app' : 'Načítání probíhá lokálně');
                    }
                    load-text-decks', {
                    // Redirect na hlavní stránku s balíčky pro Vercel
                    if (isVercel) {
                        showSection(homeSection);
                        homeBtn.classList.add('active');
                        loadDecks();ON.stringify({
                    } else {
                        checkTextDecks(); // Znovu načíst a zobrazit balíčky pro lokální prostředí
                    }
                }, 500);
            } else {
                let errorMsg = 'Nepodařilo se načíst textové balíčky: ' + (data.error || 'Neznámá chyba'); new Error(`HTTP chyba ${response.status}: ${response.statusText}`);
                if (data.isServerless) {
                    errorMsg += ' (v serverless prostředí)';
                }
                
                if (isVercel) {
                    showToast(errorMsg, 'error');
                } else {) {
                    alert(errorMsg);
                }meout(() => {
            }message = `Úspěšně načteno ${data.decksCount} textových balíčků`;
        })
        .catch(error => {
            console.error('Chyba při načítání textových balíčků:', error);s) {
            textLoading.classList.add('hidden'); ${data.environment || 'Vercel'})`;
               }
            let errorMessage = 'Nepodařilo se načíst textové balíčky. ';    
             toast místo alertu na Vercelu
            if (window.location.hostname.includes('vercel.app')) {
                errorMessage += 'Aplikace běží na Vercel.app, zkuste obnovit stránku.';showToast(message, 'success');
                showToast(errorMessage, 'error');
                       alert(message);
                // Přejít na hlavní stránku ve Vercel prostředí       }
                showSection(homeSection);          
                homeBtn.classList.add('active');direct na hlavní stránku s balíčky pro Vercel
            } else {
                errorMessage += 'Zkontrolujte, zda je server spuštěn a dostupný.';;
                alert(errorMessage);            homeBtn.classList.add('active');
            }
        });        } else {
    }it balíčky pro lokální prostředí
    
    // Pomocná funkce pro zobrazení toast zprávy (pro Vercel prostředí)
    function showToast(message, type = 'info') {se {
        const toast = document.createElement('div');líčky: ' + (data.error || 'Neznámá chyba');
        toast.className = `toast ${type}-toast`;
        toast.innerHTML = message;prostředí)';
        
        document.body.appendChild(toast);
        
        // Zobrazení toastu       showToast(errorMsg, 'error');
        setTimeout(() => {     } else {
            toast.classList.add('show-toast');               alert(errorMsg);
        }, 100);            }
        
        // Automatické skrytí toastu po 5 sekundách
        setTimeout(() => {
            toast.classList.remove('show-toast');xtových balíčků:', error);
            setTimeout(() => {add('hidden');
                document.body.removeChild(toast);    
            }, 500);o se načíst textové balíčky. ';
        }, 5000);    
    }tion.hostname.includes('vercel.app')) {
ge += 'Aplikace běží na Vercel.app, zkuste obnovit stránku.';
    // Přidání funkcionality pro automatické načtení textových kartiček');
    const autoLoadTextBtn = document.getElementById('autoLoadTextBtn');
    if (autoLoadTextBtn) {        // Přejít na hlavní stránku ve Vercel prostředí
        autoLoadTextBtn.addEventListener('click', autoLoadTextDecks);
    }assList.add('active');

    // Odstranění nepotřebných UI prvků= 'Zkontrolujte, zda je server spuštěn a dostupný.';
    function removeUnwantedElements() {
        // Odstraní zbytečný text "Studovat Resetovat Smazat" pokud se objeví na stránce
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length) {    
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.TEXT_NODE && 
                            node.textContent.includes('Studovat Resetovat Smazat')) {ment.createElement('div');
                            node.textContent = node.textContent.replace('Studovat Resetovat Smazat', '');
                        }   toast.innerHTML = message;
                                
                        if (node.nodeType === Node.ELEMENT_NODE) {);
                            const textNodes = [...node.childNodes].filter(n => 
                                n.nodeType === Node.TEXT_NODE && 
                                n.textContent.includes('Studovat Resetovat Smazat'));
                            ;
                            textNodes.forEach(textNode => {
                                textNode.textContent = textNode.textContent.replace('Studovat Resetovat Smazat', '');
                            });
                        }
                    });
                } => {
            });.body.removeChild(toast);
        });
        
        // Sledovat změny v celém dokumentu
        observer.observe(document.body, { 
            childList: true,  pro automatické načtení textových kartiček
            subtree: true adTextBtn');
        });
    }tListener('click', autoLoadTextDecks);

    // Spustit odstranění nežádoucích prvků
    removeUnwantedElements(); nepotřebných UI prvků
});moveUnwantedElements() {
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
