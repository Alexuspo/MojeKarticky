const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Kontroluje a instaluje potřebné závislosti pro aplikaci
 */
function installDependencies() {
    console.log('===== Kontrola a instalace závislostí =====');
    
    try {
        // Kontrola, zda je nainstalováno npm
        console.log('Kontroluji instalaci npm...');
        execSync('npm --version', { stdio: 'ignore' });
        
        // Kontrola, zda existuje package.json
        const packageJsonPath = path.join(__dirname, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            console.error('Soubor package.json nebyl nalezen!');
            return false;
        }
        
        // Získat seznam závislostí
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const dependencies = { 
            ...packageJson.dependencies, 
            ...packageJson.devDependencies 
        };
        
        // Zjistit, zda je nainstalován cheerio
        let cheerioInstalled = false;
        try {
            require.resolve('cheerio');
            cheerioInstalled = true;
        } catch (e) {
            console.log('Balíček cheerio není nainstalovaný, budu instalovat...');
        }
        
        if (!cheerioInstalled) {
            console.log('Instaluji cheerio pro zpracování HTML...');
            execSync('npm install cheerio@^1.0.0-rc.12', { stdio: 'inherit' });
            console.log('Cheerio úspěšně nainstalován!');
        } else {
            console.log('Cheerio je již nainstalován.');
        }
        
        console.log('===== Všechny závislosti jsou připraveny =====');
        return true;
    } catch (error) {
        console.error('Chyba při instalaci závislostí:', error.message);
        return false;
    }
}

// Spustit instalaci, pokud je tento soubor spuštěn přímo
if (require.main === module) {
    if (installDependencies()) {
        console.log('Nyní můžete spustit stahování obrázků pomocí příkazu: node image-downloader.js');
    } else {
        console.error('Nepodařilo se správně nainstalovat závislosti!');
    }
}

module.exports = { installDependencies };
