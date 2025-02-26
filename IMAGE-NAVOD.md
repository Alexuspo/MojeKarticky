# Návod na připojení obrázků ke kartičkám

Tento návod vám pomůže správně připojit obrázky k vašim kartičkám, například k souboru "Abstraktní umění.txt".

## Postup pro automatické stažení a připojení obrázků

1. **Nainstalujte potřebné závislosti**
   
   Nejprve je potřeba nainstalovat balíček pro zpracování HTML. Spusťte:
   
   ```
   node install-dependencies.js
   ```

2. **Spusťte automatické stahování obrázků**
   
   Pro soubor "Abstraktní umění.txt" spusťte:
   
   ```
   node image-downloader.js "public/Karticky/Abstraktní umění.txt"
   ```
   
   Skript:
   - Najde všechny odkazy na obrázky v souboru
   - Stáhne obrázky do složky `public/images/`
   - Aktualizuje odkazy v souboru tak, aby ukazovaly na lokální kopie

3. **Načtěte textové kartičky v aplikaci**
   
   V aplikaci klikněte na tlačítko "Načíst z textu" - aplikace načte váš soubor s kartičkami včetně obrázků.

## Ruční připojení obrázků

Pokud automatický postup nefunguje, můžete obrázky připojit ručně:

1. Stáhněte obrázky z internetu a uložte je do složky `public/images/`
2. V souboru s kartičkami (např. "Abstraktní umění.txt") upravte cesty k obrázkům:
   ```
   <img src="images/nazev_obrazku.jpg" alt="Popis obrázku">
   ```

## Řešení problémů

- **Obrázky se nezobrazují**
  - Zkontrolujte, zda jsou obrázky skutečně ve složce `public/images/`
  - Ověřte, že cesta v atributu `src` je správná (měla by být `images/nazev_souboru.jpg`)
  - Zkontrolujte v prohlížeči konzoli vývojáře, zda nejsou chyby při načítání

- **Skript selže při stahování**
  - Některé weby blokují automatické stahování - tyto obrázky budete muset stáhnout ručně
  - Zkontrolujte internetové připojení

## Podporované formáty obrázků

Aplikace podporuje následující formáty obrázků:
- JPG/JPEG
- PNG
- GIF
- SVG
- WebP
