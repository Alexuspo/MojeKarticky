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

// Spustit inicializační funkce
document.addEventListener('DOMContentLoaded', function() {
    checkStylesheets();
    cleanupLocalStorage();
    initDefaultSettings();
    checkServerConnection();
});
