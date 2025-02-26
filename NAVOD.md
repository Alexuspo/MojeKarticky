# Návod k opravě a spuštění aplikace "Moje Kartičky"

Pokud máte problémy s aplikací Moje Kartičky, následujte tento návod krok za krokem pro opravu a spuštění aplikace.

## Krok 1: Nastavení aplikace

Nejprve spusťte příkaz pro nastavení aplikace, který zajistí vytvoření všech potřebných souborů a složek:

```
npm run setup
```

Tento příkaz:
1. Vytvoří složku `public/Karticky` (pokud ještě neexistuje)
2. Vytvoří textový soubor s kartičkami ve formátu Anki export
3. Zkontroluje existenci všech potřebných souborů

## Krok 2: Spuštění aplikace

Po úspěšném nastavení můžete spustit aplikaci:

```
npm start
```

Aplikace by měla běžet na adrese: [http://localhost:3000](http://localhost:3000)

## Krok 3: Použití aplikace

1. Otevřete webový prohlížeč a přejděte na [http://localhost:3000](http://localhost:3000)
2. Klikněte na tlačítko "Načíst z textu" v navigačním menu
3. Měl by se zobrazit balíček "Literatura-Test-karticky"
4. Kliknutím na balíček zahájíte studium
5. Klikněte na tlačítko "Otočit" pro zobrazení odpovědi na kartičku
6. Po zobrazení odpovědi ohodnoťte svou znalost pomocí tlačítek

## Řešení problémů

### Aplikace se nespouští vůbec

- Zkontrolujte, zda máte nainstalovaný Node.js (minimálně verze 14)
- Zkontrolujte, zda jste nainstalovali všechny závislosti příkazem `npm install`
- Zkontrolujte, zda v konzoli při spuštění nejsou chybové hlášky

### Nejsou viditelné žádné balíčky kartiček

- Klikněte na tlačítko "Načíst z textu" v navigačním menu
- Pokud to nepomůže, zkuste spustit `npm run check` pro kontrolu souborů

### Otáčení kartiček nefunguje

- Otevřete konzoli prohlížeče (F12) a podívejte se, zda nejsou chybové hlášky
- Zkuste obnovit stránku (F5) a zkuste to znovu

### Chybová hláška "Cannot find module './text-parser'"

Ujistěte se, že máte soubor `text-parser.js` ve složce s projektem. Pokud ne, spusťte:
```
npm run setup
```

## Kontakt pro podporu

Pokud budete mít další problémy, kontaktujte podporu pomocí nového GitHub issue.
