const fs = require('fs');
const path = require('path');

/**
 * Vytvoří potřebné složky a soubory pro fungování aplikace
 */
function setup() {
    console.log('===== Nastavení aplikace Moje Kartičky =====');
    
    // 1. Vytvoření složky public/Karticky pokud neexistuje
    const kartickyDir = path.join(__dirname, 'public', 'Karticky');
    if (!fs.existsSync(kartickyDir)) {
        try {
            fs.mkdirSync(kartickyDir, { recursive: true });
            console.log(`✓ Složka ${kartickyDir} byla úspěšně vytvořena`);
        } catch (err) {
            console.error(`✗ Nepodařilo se vytvořit složku ${kartickyDir}:`, err);
        }
    } else {
        console.log(`✓ Složka ${kartickyDir} již existuje`);
    }

    // 2. Vytvoření složky data pokud neexistuje
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        try {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log(`✓ Složka ${dataDir} byla úspěšně vytvořena`);
        } catch (err) {
            console.error(`✗ Nepodařilo se vytvořit složku ${dataDir}:`, err);
        }
    } else {
        console.log(`✓ Složka ${dataDir} již existuje`);
    }

    // 3. Vytvoření složky pro obrázky
    const imagesDir = path.join(__dirname, 'public', 'images');
    if (!fs.existsSync(imagesDir)) {
        try {
            fs.mkdirSync(imagesDir, { recursive: true });
            console.log(`✓ Složka ${imagesDir} byla úspěšně vytvořena`);
        } catch (err) {
            console.error(`✗ Nepodařilo se vytvořit složku ${imagesDir}:`, err);
        }
    } else {
        console.log(`✓ Složka ${imagesDir} již existuje`);
    }
    
    // 4. Vytvoření README.md souboru pro složku s obrázky
    const imagesReadmePath = path.join(imagesDir, 'README.md');
    if (!fs.existsSync(imagesReadmePath)) {
        try {
            const readmeContent = `# Složka pro obrázky

Do této složky umístěte obrázky, které chcete používat ve svých kartičkách.

## Jak přidat obrázky do kartiček

### Ve formátu textového souboru

V textovém souboru s kartičkami můžete použít HTML značku pro vložení obrázku:

\`\`\`
#separator:tab
#html:true
#notetype column:1
#deck column:2
#tags column:5
Literatura - Test kartičky.	Literatura - Test kartičky.	Otázka s obrázkem <img src="nazev_obrazku.jpg" alt="Popis obrázku">	Odpověď	
\`\`\`

Důležité je nastavit \`#html:true\` v hlavičce souboru, aby byly HTML značky interpretovány správně.

### Podporované formáty obrázků

- JPG/JPEG
- PNG
- GIF
- SVG
- WebP

## Omezení velikosti

Pro lepší výkon doporučujeme používat obrázky s rozumnou velikostí (ideálně do 500 KB).`;
            
            fs.writeFileSync(imagesReadmePath, readmeContent, 'utf8');
            console.log(`✓ Soubor ${imagesReadmePath} byl úspěšně vytvořen`);
        } catch (err) {
            console.error(`✗ Nepodařilo se vytvořit soubor ${imagesReadmePath}:`, err);
        }
    } else {
        console.log(`✓ Soubor ${imagesReadmePath} již existuje`);
    }

    // 5. Vytvoření textového souboru s kartičkami
    const textFilePath = path.join(kartickyDir, 'Literatura - Test karticky..txt');
    if (!fs.existsSync(textFilePath)) {
        try {
            const content = `#separator:tab
#html:true
#notetype column:1
#deck column:2
#tags column:5
Literatura - Test kartičky. 	Literatura - Test kartičky.	Májovci tvořili v	v 2 polovině 19.století	
Literatura - Test kartičky. 	Literatura - Test kartičky.	V jejich čele stál	Jan Neruda <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMGYwZjAiPjwvcmVjdD48Y2lyY2xlIGN4PSI1MCIgY3k9IjQwIiByPSIyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiPjwvY2lyY2xlPjxjaXJjbGUgY3g9IjQwIiBjeT0iMzUiIHI9IjMiIGZpbGw9IiM2NjYiPjwvY2lyY2xlPjxjaXJjbGUgY3g9IjYwIiBjeT0iMzUiIHI9IjMiIGZpbGw9IiM2NjYiPjwvY2lyY2xlPjxwYXRoIGQ9Ik0zNSA1MCBRIDUwIDYwIDY1IDUwIiBmaWxsPSJub25lIiBzdHJva2U9IiM2NjYiIHN0cm9rZS13aWR0aD0iMiI+PC9wYXRoPjwvc3ZnPg==">	
Literatura - Test kartičky. 	Literatura - Test kartičky.	Literární skupina se jmenovala podle	Almanachu Máj	
Literatura - Test kartičky. 	Literatura - Test kartičky.	Májovci se svým dílem hlásili k odkazu	K. H. Máchy	
Literatura - Test kartičky. 	Literatura - Test kartičky.	Autorem malostranských povídek je	Jan Neruda	
Literatura - Test kartičky. 	Literatura - Test kartičky.	Fejeton je	Krátký vtipný text a často kritický. (na př v novinách)	
Literatura - Test kartičky. 	Literatura - Test kartičky.	Neruda byl redaktorem	Národních listů	
Literatura - Test kartičky. 	Literatura - Test kartičky.	Jmenujte jednu Nerudovu básnickou sbírku	Písně kosmické	
Literatura - Test kartičky. 	Literatura - Test kartičky.	Autorem poezie večerní písně a Pohádky z naší vesnice je	Vítězslav Hálek	
Literatura - Test kartičky. 	Literatura - Test kartičky.	Autorem romaneta v české literatuře je	Jakub Arbes	
Literatura - Test kartičky. 	Literatura - Test kartičky.	Romaneto je	Krátká mystická novela která se musí odehrává v Praze.	
Literatura - Test kartičky. 	Literatura - Test kartičky.	Jmenujte jedno Arbesovo romaneto	Newtonův mozek	
Literatura - Test kartičky. 	Literatura - Test kartičky.	Karolina světlá ve své tvorbě zobrazovala	Postavy těžce zkoušených žen	
Literatura - Test kartičky. 	Literatura - Test kartičky.	Jmenujte jedno dílo K. světlé	Vesnický román	
Literatura - Test kartičky. 	Literatura - Test kartičky.	Libreto je	předloha k opeře	
Literatura - Test kartičky. 	Literatura - Test kartičky.	Liberta psala	Eliška Krásnohorská	
Literatura - Test kartičky. 	Literatura - Test kartičky.	Libreta vytvořila k opeře	Eliška Krásnohorská	
Literatura - Test kartičky. 	Literatura - Test kartičky.	Povídku muzikanstká Libuška napsala	Vítězslava Hálka	
Literatura - Test kartičky. 	Literatura - Test kartičky.	Karolina světlá se jmenovala vlastním jméne	Johana Mužáková	
Literatura - Test kartičky. 	Literatura - Test kartičky.	Jan Neruda Podepisovl své fejetony	△`;
            
            fs.writeFileSync(textFilePath, content, 'utf8');
            console.log(`✓ Textový soubor ${textFilePath} byl úspěšně vytvořen`);
        } catch (err) {
            console.error(`✗ Nepodařilo se vytvořit textový soubor ${textFilePath}:`, err);
        }
    } else {
        console.log(`✓ Textový soubor ${textFilePath} již existuje`);
    }

    // 6. Kontrola existence text-parser.js
    const textParserPath = path.join(__dirname, 'text-parser.js');
    if (!fs.existsSync(textParserPath)) {
        console.error(`✗ KRITICKÁ CHYBA: Soubor ${textParserPath} neexistuje!`);
        console.log('  Prosím, ujistěte se, že jste vytvořili tento soubor podle instrukcí.');
    } else {
        console.log(`✓ Soubor ${textParserPath} existuje`);
    }

    console.log('\n===== Nastavení dokončeno =====');
    console.log('Nyní můžete spustit aplikaci příkazem: npm start');
}

// Spuštění funkce setup
setup();
