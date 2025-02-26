document.addEventListener('DOMContentLoaded', () => {
    // Elementy UI
    const homeBtn = document.getElementById('homeBtn');
    const studyBtn = document.getElementById('studyBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    
    const homeSection = document.getElementById('home-section');
    const studySection = document.getElementById('study-section');
    const uploadSection = document.getElementById('upload-section');
    
    const decksContainer = document.getElementById('decks-container');
    const noDecksMessage = document.getElementById('no-decks');
    
    const uploadForm = document.getElementById('upload-form');
    const ankiFileInput = document.getElementById('anki-file');
    const selectedFileText = document.getElementById('selected-file');
    const uploadProgress = document.getElementById('upload-progress');
    const uploadResult = document.getElementById('upload-result');
    
    const flashcard = document.getElementById('flashcard');
    const cardFront = document.getElementById('card-front');
    const cardBack = document.getElementById('card-back');
    const flipBtn = document.getElementById('flipBtn');
    const ratingBtns = document.getElementById('rating-btns');
    const deckTitle = document.getElementById('deck-title');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    // Stav aplikace
    let currentDeck = null;
    let currentCardIndex = 0;
    let isCardFlipped = false;

    // Navigační akce
    homeBtn.addEventListener('click', () => showSection(homeSection));
    studyBtn.addEventListener('click', () => {
        if (currentDeck) {
            showSection(studySection);
        } else {
            showSection(homeSection);
            alert('Nejprve vyberte balíček kartiček k procvičování.');
        }
    });
    uploadBtn.addEventListener('click', () => showSection(uploadSection));

    // Funkce pro zobrazení sekce
    function showSection(section) {
        homeSection.classList.remove('active-section');
        studySection.classList.remove('active-section');
        uploadSection.classList.remove('active-section');
        
        homeSection.classList.add('hidden-section');
        studySection.classList.add('hidden-section');
        uploadSection.classList.add('hidden-section');
        
        section.classList.remove('hidden-section');
        section.classList.add('active-section');
        
        homeBtn.classList.remove('active');
        studyBtn.classList.remove('active');
        uploadBtn.classList.remove('active');
        
        if (section === homeSection) homeBtn.classList.add('active');
        if (section === studySection) studyBtn.classList.add('active');
        if (section === uploadSection) uploadBtn.classList.add('active');
        
        // Pokud je zobrazen domovský panel, načíst balíčky
        if (section === homeSection) {
            loadDecks();
        }
    }

    // Zpracování nahrávání souborů
    ankiFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            selectedFileText.textContent = e.target.files[0].name;
        } else {
            selectedFileText.textContent = 'Žádný soubor nebyl vybrán';
        }
    });

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const file = ankiFileInput.files[0];
        if (!file) {
            alert('Vyberte soubor k nahrání');
            return;
        }
        
        // Zobrazit loading stav
        uploadForm.classList.add('hidden');
        uploadProgress.classList.remove('hidden');
        uploadResult.classList.add('hidden');
        
        // Vytvořit FormData objekt
        const formData = new FormData();
        formData.append('ankiFile', file);
        
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            uploadForm.classList.remove('hidden');
            uploadProgress.classList.add('hidden');
            uploadResult.classList.remove('hidden');
            
            if (response.ok) {
                uploadResult.textContent = 'Soubor byl úspěšně nahrán a zpracován!';
                uploadResult.classList.add('success-message');
                uploadResult.classList.remove('error-message');
                ankiFileInput.value = '';
                selectedFileText.textContent = 'Žádný soubor nebyl vybrán';
                
                // Po 2 sekundách přejít na domovskou stránku
                setTimeout(() => {
                    showSection(homeSection);
                }, 2000);
            } else {
                uploadResult.textContent = `Chyba: ${result.error}`;
                uploadResult.classList.add('error-message');
                uploadResult.classList.remove('success-message');
            }
        } catch (error) {
            uploadForm.classList.remove('hidden');
            uploadProgress.classList.add('hidden');
            uploadResult.classList.remove('hidden');
            uploadResult.textContent = 'Došlo k chybě při nahrávání souboru';
            uploadResult.classList.add('error-message');
            uploadResult.classList.remove('success-message');
            console.error('Error:', error);
        }
    });

    // Načtení balíčků
    async function loadDecks() {
        try {
            const response = await fetch('/api/decks');
            const decks = await response.json();
            
            if (decks.length === 0) {
                decksContainer.innerHTML = '';
                noDecksMessage.classList.remove('hidden');
            } else {
                noDecksMessage.classList.add('hidden');
                renderDecks(decks);
            }
        } catch (error) {
            console.error('Error loading decks:', error);
            noDecksMessage.textContent = 'Nepodařilo se načíst balíčky kartiček.';
            noDecksMessage.classList.remove('hidden');
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
                    <p>${deck.cards.length} kartiček</p>
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
        const date = new Date(dateString);
        return date.toLocaleDateString('cs-CZ');
    }

    // Funkce pro kartičky
    function startStudySession() {
        if (!currentDeck || currentDeck.cards.length === 0) return;
        
        deckTitle.textContent = currentDeck.name;
        updateProgressBar();
        showCard(currentCardIndex);
    }

    function showCard(index) {
        const card = currentDeck.cards[index];
        cardFront.innerHTML = card.front;
        cardBack.innerHTML = card.back;
        
        cardFront.classList.remove('hidden');
        cardBack.classList.add('hidden');
        isCardFlipped = false;
        
        flipBtn.style.display = 'block';
        ratingBtns.classList.add('hidden');
    }

    function updateProgressBar() {
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
                alert('Gratuluji! Dokončili jste všechny kartičky v tomto balíčku.');
                showSection(homeSection);
            }
        });
    });

    // Načíst balíčky při prvním spuštění
    loadDecks();
});
