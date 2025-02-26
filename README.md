# Moje Kartičky - Aplikace pro prohlížení Anki kartiček

Jednoduchá webová aplikace pro studium s Anki kartičkami.

## Funkce

- Načtení Anki balíčků z předem definovaného umístění
- Prohlížení kartiček ve formátu otázka-odpověď
- Hodnocení obtížnosti kartiček
- Offline režim pro případ výpadku serveru

## Jak začít

### Místní vývoj

#### Prerekvizity

- Node.js (verze 12 nebo novější)
- NPM (obvykle se instaluje společně s Node.js)

#### Instalace

1. Naklonujte tento repozitář nebo stáhněte zdrojový kód
2. Otevřete příkazovou řádku v adresáři projektu
3. Spusťte příkaz pro instalaci závislostí:

```bash
npm install
```

4. Umístěte váš Anki soubor (.apkg) do složky `public/anki/` a přejmenujte ho na `default-deck.apkg`

#### Spuštění aplikace

```bash
npm start
```

Aplikace bude dostupná na adrese http://localhost:3000

### Nasazení na Vercel

1. Vytvořte si účet na Vercel a nainstalujte Vercel CLI
2. Přihlaste se do Vercel pomocí příkazu:

```bash
vercel login
```

3. Nasazení aplikace proveďte příkazem:

```bash
vercel
```

4. Po nasazení bude aplikace dostupná na adrese vygenerované Vercel.

## Použití aplikace

1. Otevřete aplikaci ve webovém prohlížeči
2. Klikněte na tlačítko "Načíst kartičky" pro načtení výchozího Anki balíčku
3. Po načtení klikněte na balíček pro zahájení studia
4. Při studiu klikněte na tlačítko "Otočit" pro zobrazení odpovědi
5. Ohodnoťte vaši znalost pomocí tlačítek pod kartou

## Struktura projektu

- `server.js` - Serverová část aplikace (Node.js + Express)
- `anki-parser.js` - Modul pro zpracování Anki souborů
- `public/` - Statické soubory (HTML, CSS, JavaScript)
  - `index.html` - Hlavní HTML stránka
  - `styles.css` - Kaskádové styly
  - `script.js` - Klientská logika
  - `anki/` - Adresář pro Anki soubory
    - `default-deck.apkg` - Výchozí Anki balíček (musí být přidán uživatelem)
- `data/` - Složka pro ukládání dat (automaticky vytvořena)
  - `decks.json` - Zpracované balíčky kartiček

## Licence

Tento projekt je licencován pod MIT licencí.
