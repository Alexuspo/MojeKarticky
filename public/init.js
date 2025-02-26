/**
 * Pomocné funkce pro inicializaci a diagnostiku aplikace
 */

// Diagnostická funkce pro kontrolu připojení k serveru
function checkServerConnection() {
    console.log('Kontroluji připojení k serveru...');
    
    fetch('/api/status')
        .then(response => response.json())
        .then(data => {
            console.log('Server je dostupný:', data);
            const statusInfo = document.createElement('div');
            statusInfo.className = 'status-info';
            statusInfo.innerHTML = `
                <p>✓ Server je dostupný</p>
                <p>Serverový čas: ${new Date(data.serverTime).toLocaleString()}</p>
                <p>Počet balíčků: ${data.decksCount}</p>
            `;
            document.body.appendChild(statusInfo);
            
            setTimeout(() => {
                statusInfo.classList.add('fade-out');
                setTimeout(() => {
                    statusInfo.remove();
                }, 1000);
            }, 4000);
        })
        .catch(error => {
            console.error('Chyba při kontrole serveru:', error);
        });
}

// Kontrola, zda jsou načteny všechny potřebné stylové soubory a případná oprava
function checkStylesheets() {
    const mainStylesheet = document.querySelector('link[href="styles.css"]');
    if (!mainStylesheet) {
        console.warn('Hlavní stylesheet nebyl nalezen, přidávám ho');
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'styles.css';
        document.head.appendChild(link);
    }
}

// Čištění dat v localStorage pokud je verze aplikace nová
function cleanupLocalStorage() {
    const appVersion = '1.1.0'; // Aktuální verze aplikace
    const savedVersion = localStorage.getItem('appVersion');
    
    if (savedVersion !== appVersion) {
        console.log(`Aktualizace z verze ${savedVersion} na ${appVersion}, čistím staré údaje z localStorage`);
        
        // Ponechat jen některé klíče, ostatní vyčistit
        const keysToKeep = ['username', 'theme'];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!keysToKeep.includes(key)) {
                localStorage.removeItem(key);
            }
        }
        
        localStorage.setItem('appVersion', appVersion);
    }
}

// Inicializace výchozích nastavení, pokud neexistují
function initDefaultSettings() {
    // Nastavit výchozí preferenci náhodného pořadí, pokud neexistuje
    if (localStorage.getItem('randomOrderPreference') === null) {
        localStorage.setItem('randomOrderPreference', 'false');
        console.log('Nastavena výchozí preference náhodného pořadí: vypnuto');
    }
}

// Nouzová funkce pro reset zaseknuté karty
function setupEmergencyCardReset() {
    let longPressTimer;
    const LONG_PRESS_DURATION = 1000; // 1 sekunda pro dlouhý stisk

    // Dlouhý stisk - zobrazí nouzové tlačítko pro reset karty
    document.addEventListener('mousedown', (e) => {
        longPressTimer = setTimeout(() => {
            if (document.getElementById('study-section').classList.contains('active-section')) {
                createEmergencyResetButton(e.clientX, e.clientY);
            }
        }, LONG_PRESS_DURATION);
    });

    document.addEventListener('mouseup', () => {
        clearTimeout(longPressTimer);
    });

    // Klávesová zkratka R - reset karty
    document.addEventListener('keydown', (e) => {
        if (e.key === 'r' && e.ctrlKey && document.getElementById('study-section').classList.contains('active-section')) {
            console.log('Nouzový reset karty pomocí Ctrl+R');
            const cardFront = document.getElementById('card-front');
            const cardBack = document.getElementById('card-back');
            const ratingBtns = document.getElementById('rating-btns');
            const flipBtn = document.getElementById('flipBtn');

            // Reset stavu karty
            cardFront.classList.remove('hidden');
            cardBack.classList.add('hidden');
            ratingBtns.classList.add('hidden');
            flipBtn.textContent = 'Otočit';

            // Zobrazení potvrzení uživateli
            showToast('Karta byla resetována', 'info');
            e.preventDefault(); // Zabránit obnovení stránky
        }
    });
}

// Vytvoření nouzového tlačítka pro reset
function createEmergencyResetButton(x, y) {
    // Odstranit existující tlačítko, pokud existuje
    const existingButton = document.getElementById('emergency-reset-button');
    if (existingButton) {
        existingButton.remove();
    }

    // Vytvořit nové tlačítko
    const button = document.createElement('button');
    button.id = 'emergency-reset-button';
    button.innerHTML = '🔄 Reset karty';
    button.style.position = 'absolute';
    button.style.left = `${x}px`;
    button.style.top = `${y}px`;
    button.style.zIndex = '9999';
    button.style.backgroundColor = '#e74c3c';
    button.style.color = 'white';
    button.style.padding = '10px';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';

    // Přidat event listener
    button.addEventListener('click', () => {
        const cardFront = document.getElementById('card-front');
        const cardBack = document.getElementById('card-back');
        const ratingBtns = document.getElementById('rating-btns');
        const flipBtn = document.getElementById('flipBtn');

        // Reset stavu karty
        cardFront.classList.remove('hidden');
        cardBack.classList.add('hidden');
        ratingBtns.classList.add('hidden');
        flipBtn.textContent = 'Otočit';

        // Zobrazení potvrzení
        showToast('Karta byla resetována', 'info');
        
        // Odstranit tlačítko
        button.remove();
    });

    document.body.appendChild(button);

    // Automatické odstranění po 5 sekundách
    setTimeout(() => {
        if (document.body.contains(button)) {
            button.remove();
        }
    }, 5000);
}

// Přidat funkci showToast, pokud neexistuje
function showToast(message, type = 'info') {
    // Kontrola, zda již existuje funkce v globálním scope
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
        return;
    }
    
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

// Spustit inicializační funkce
document.addEventListener('DOMContentLoaded', function() {
    checkStylesheets();
    cleanupLocalStorage();
    initDefaultSettings();
    setupEmergencyCardReset();
    checkServerConnection();
});
