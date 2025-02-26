/**
 * Diagnostický nástroj pro kontrolu serveru
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

// Barvy pro konzoli
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

console.log(`${colors.cyan}======= DIAGNOSTIKA SERVERU =======`);

// Kontrola zda server běží
function checkServerRunning(port = 3000) {
  console.log(`\n${colors.cyan}[1/5] Kontroluji, zda server běží na portu ${port}...${colors.reset}`);
  
  return new Promise((resolve) => {
    const req = http.request({
      method: 'GET',
      hostname: 'localhost',
      port: port,
      path: '/',
      timeout: 3000
    }, (res) => {
      console.log(`${colors.green}✓ Server běží! Stavový kód: ${res.statusCode}${colors.reset}`);
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log(`${colors.red}✗ Server neběží nebo není dostupný: ${err.message}${colors.reset}`);
      console.log(`${colors.yellow}  Tip: Zkuste spustit server příkazem "npm start" v novém terminálu${colors.reset}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.log(`${colors.red}✗ Časový limit vypršel při pokusu o připojení k serveru${colors.reset}`);
      req.abort();
      resolve(false);
    });
    
    req.end();
  });
}

// Kontrola zda je port používán jiným procesem
async function checkPortInUse(port = 3000) {
  console.log(`\n${colors.cyan}[2/5] Kontroluji, zda není port ${port} používán jiným procesem...${colors.reset}`);
  
  try {
    const server = http.createServer();
    
    return new Promise((resolve) => {
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`${colors.red}✗ Port ${port} je používán jiným procesem${colors.reset}`);
          console.log(`${colors.yellow}  Tip: Ukončete aplikace, které mohou používat tento port, nebo změňte port v server.js${colors.reset}`);
          resolve(true);
        } else {
          console.log(`${colors.yellow}! Jiná chyba při kontrole portu: ${err.message}${colors.reset}`);
          resolve(false);
        }
      });
      
      server.listen(port, () => {
        server.close();
        console.log(`${colors.green}✓ Port ${port} je volný${colors.reset}`);
        resolve(false);
      });
    });
  } catch (err) {
    console.log(`${colors.red}✗ Chyba při kontrole portu: ${err.message}${colors.reset}`);
    return false;
  }
}

// Kontrola souborového systému
function checkFileSystem() {
  console.log(`\n${colors.cyan}[3/5] Kontroluji potřebné soubory a složky...${colors.reset}`);
  
  const requiredFiles = [
    { path: 'server.js', name: 'Hlavní soubor serveru' },
    { path: 'text-parser.js', name: 'Parser pro textové soubory' },
    { path: 'anki-parser.js', name: 'Parser pro Anki soubory' },
    { path: 'public', name: 'Složka s veřejnými soubory', isDir: true },
    { path: 'public/Karticky', name: 'Složka s textovými kartičkami', isDir: true },
    { path: 'public/index.html', name: 'Hlavní HTML soubor' },
    { path: 'public/script.js', name: 'Hlavní JavaScript soubor' },
    { path: 'public/styles.css', name: 'CSS styly' }
  ];
  
  let allExist = true;
  
  for (const file of requiredFiles) {
    const fullPath = path.join(__dirname, file.path);
    
    try {
      const stats = fs.statSync(fullPath);
      
      if (file.isDir && !stats.isDirectory()) {
        console.log(`${colors.red}✗ ${file.name} (${file.path}) existuje, ale není složka!${colors.reset}`);
        allExist = false;
      } else if (!file.isDir && !stats.isFile()) {
        console.log(`${colors.red}✗ ${file.name} (${file.path}) existuje, ale není soubor!${colors.reset}`);
        allExist = false;
      } else {
        console.log(`${colors.green}✓ ${file.name} (${file.path}) existuje${colors.reset}`);
      }
    } catch (err) {
      console.log(`${colors.red}✗ ${file.name} (${file.path}) neexistuje nebo není přístupný${colors.reset}`);
      allExist = false;
    }
  }
  
  if (!allExist) {
    console.log(`${colors.yellow}  Tip: Spusťte "npm run setup" pro vytvoření chybějících souborů a složek${colors.reset}`);
  }
  
  return allExist;
}

// Kontrola zda existuje soubor s kartičkami
function checkForCardFiles() {
  console.log(`\n${colors.cyan}[4/5] Hledám soubory s kartičkami...${colors.reset}`);
  
  const kartickyDir = path.join(__dirname, 'public', 'Karticky');
  
  try {
    if (!fs.existsSync(kartickyDir)) {
      console.log(`${colors.red}✗ Složka Karticky neexistuje${colors.reset}`);
      return false;
    }
    
    const files = fs.readdirSync(kartickyDir);
    const textFiles = files.filter(f => f.endsWith('.txt'));
    
    if (textFiles.length === 0) {
      console.log(`${colors.red}✗ Ve složce Karticky nejsou žádné textové soubory${colors.reset}`);
      console.log(`${colors.yellow}  Tip: Spusťte "npm run setup" pro vytvoření ukázkového souboru s kartičkami${colors.reset}`);
      return false;
    }
    
    console.log(`${colors.green}✓ Nalezeno ${textFiles.length} textových souborů s kartičkami:${colors.reset}`);
    textFiles.forEach(file => {
      console.log(`${colors.green}  - ${file}${colors.reset}`);
    });
    
    return true;
  } catch (err) {
    console.log(`${colors.red}✗ Chyba při čtení složky Karticky: ${err.message}${colors.reset}`);
    return false;
  }
}

// Kontrola Node.js a npm
function checkNodeAndNpm() {
  console.log(`\n${colors.cyan}[5/5] Kontroluji verzi Node.js a npm...${colors.reset}`);
  
  let nodeVersion;
  let npmVersion;
  
  try {
    const { execSync } = require('child_process');
    nodeVersion = execSync('node --version').toString().trim();
    console.log(`${colors.green}✓ Node.js verze: ${nodeVersion}${colors.reset}`);
  } catch (err) {
    console.log(`${colors.red}✗ Nepodařilo se zjistit verzi Node.js${colors.reset}`);
  }
  
  try {
    const { execSync } = require('child_process');
    npmVersion = execSync('npm --version').toString().trim();
    console.log(`${colors.green}✓ npm verze: ${npmVersion}${colors.reset}`);
  } catch (err) {
    console.log(`${colors.red}✗ Nepodařilo se zjistit verzi npm${colors.reset}`);
  }
  
  return { nodeVersion, npmVersion };
}

// Funkce pro uložení logu z kontroly
function saveCheckLog(results) {
  const logContent = `
======= LOG KONTROLY SERVERU =======
Datum kontroly: ${new Date().toLocaleString()}
Node.js verze: ${results.nodeVersion || 'Neznámá'}
npm verze: ${results.npmVersion || 'Neznámá'}
Server běží: ${results.serverRunning ? 'Ano' : 'Ne'}
Port v použití: ${results.portInUse ? 'Ano' : 'Ne'}
Souborový systém v pořádku: ${results.filesOk ? 'Ano' : 'Ne'}
Soubory s kartičkami nalezeny: ${results.cardsFound ? 'Ano' : 'Ne'}
`.trim();

  const logPath = path.join(__dirname, 'server-check.log');
  
  try {
    fs.writeFileSync(logPath, logContent);
    console.log(`\n${colors.green}Log kontroly uložen do souboru: server-check.log${colors.reset}`);
  } catch (err) {
    console.log(`\n${colors.red}Nepodařilo se uložit log kontroly: ${err.message}${colors.reset}`);
  }
}

// Hlavní funkce
async function main() {
  const results = {
    serverRunning: false,
    portInUse: false,
    filesOk: false,
    cardsFound: false,
    nodeVersion: null,
    npmVersion: null
  };
  
  results.serverRunning = await checkServerRunning();
  
  if (!results.serverRunning) {
    results.portInUse = await checkPortInUse();
  }
  
  results.filesOk = checkFileSystem();
  results.cardsFound = checkForCardFiles();
  
  const nodeNpmInfo = checkNodeAndNpm();
  results.nodeVersion = nodeNpmInfo.nodeVersion;
  results.npmVersion = nodeNpmInfo.npmVersion;
  
  // Shrnutí výsledků
  console.log(`\n${colors.magenta}======= SHRNUTÍ DIAGNOSTIKY =======`);
  
  if (results.serverRunning) {
    console.log(`${colors.green}✓ Server běží správně${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ Server neběží${colors.reset}`);
  }
  
  if (results.portInUse) {
    console.log(`${colors.red}✗ Port 3000 je již používán${colors.reset}`);
  }
  
  if (results.filesOk) {
    console.log(`${colors.green}✓ Všechny potřebné soubory existují${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ Některé potřebné soubory chybí${colors.reset}`);
  }
  
  if (results.cardsFound) {
    console.log(`${colors.green}✓ Soubory s kartičkami nalezeny${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ Soubory s kartičkami nenalezeny${colors.reset}`);
  }
  
  // Uložit log
  saveCheckLog(results);
  
  // Vypsat doporučení pro řešení
  console.log(`\n${colors.magenta}======= DOPORUČENÍ =======`);
  
  if (!results.serverRunning) {
    console.log(`${colors.yellow}1. Spusťte server příkazem "npm start"${colors.reset}`);
    
    if (results.portInUse) {
      console.log(`${colors.yellow}2. Pokud je port 3000 obsazen, upravte PORT v server.js nebo ukončete aplikaci, která port používá${colors.reset}`);
    }
  }
  
  if (!results.filesOk || !results.cardsFound) {
    console.log(`${colors.yellow}3. Spusťte "npm run setup" pro opravu souborového systému a vytvoření ukázkových kartiček${colors.reset}`);
  }
  
  console.log(`\n${colors.cyan}Pro další pomoc spusťte aplikaci v jiném terminálu a sledujte chybové výpisy.${colors.reset}`);
  console.log(`${colors.cyan}======= KONEC DIAGNOSTIKY =======\n${colors.reset}`);
}

// Spustit hlavní funkci
main();
