# PowerShell skript pro opravu problémů s obrázky abstraktního umění

# Proměnné pro cesty
$imagesDir = Join-Path $PSScriptRoot "public\images"
$kartickyDir = Join-Path $PSScriptRoot "public\Karticky"
$fixedFilePath = Join-Path $kartickyDir "fix-abstraktni-umeni-obrazky.txt"

# 1. Zkontrolovat a vytvořit složku pro obrázky, pokud neexistuje
if (-not (Test-Path $imagesDir)) {
    Write-Host "Vytvářím složku pro obrázky: $imagesDir"
    New-Item -ItemType Directory -Path $imagesDir -Force | Out-Null
}

# 2. Vytvořit nový jednodušší soubor s kartičkami
$contentWithSimpleImages = @"
#separator:tab
#html:true
#name:Abstraktní umění - obrazová galerie

<img alt="Barevná studie" src="images/kandinsky.jpg" style="max-height: 300px;">	Vasilij Kandinskij - Soustředné Kruhy (1913). Jeden z nejznámějších obrazů tohoto průkopníka abstraktního umění.
<img alt="Černý čtverec" src="images/malevich.jpg" style="max-height: 300px;">	Kazimir Malevič - Černý čtverec na bílém pozadí (1915). Ikona suprematismu a klíčové dílo abstraktního umění 20. století.
<img alt="Kompozice" src="images/mondrian.jpg" style="max-height: 300px;">	Piet Mondrian - Kompozice v červené, žluté, modré a černé. Typické dílo neoplasticismu používající pouze základní barvy a pravoúhlé tvary.
<img alt="Amorfa" src="images/kupka.jpg" style="max-height: 300px;">	František Kupka - Amorfa: Dvoubarevná fuga (1912). Jedno z prvních plně abstraktních děl v historii malířství.
"@

Write-Host "Zapisuji nový soubor s kartičkami: $fixedFilePath"
$contentWithSimpleImages | Out-File -FilePath $fixedFilePath -Encoding utf8

# 3. Aktualizovat vercel-server.js pro hardcoded balíček s obrázky
$vercelServerPath = Join-Path $PSScriptRoot "vercel-server.js"
if (Test-Path $vercelServerPath) {
    $vercelContent = Get-Content -Path $vercelServerPath -Raw
    
    # Hledání funkce createAbstractArtImagesDeck
    if ($vercelContent -match "function createAbstractArtImagesDeck\(\)") {
        Write-Host "Nalezena funkce createAbstractArtImagesDeck v vercel-server.js"
        Write-Host "Pro úplnou opravu prosím zkontrolujte, zda používá jednoduché názvy souborů:"
        Write-Host "- images/kandinsky.jpg"
        Write-Host "- images/malevich.jpg"
        Write-Host "- images/mondrian.jpg"
        Write-Host "- images/kupka.jpg"
    }
}

Write-Host ""
Write-Host "=== INSTRUKCE PRO DALŠÍ KROKY ==="
Write-Host "1. Do složky public/images umístěte soubory (můžete je přejmenovat z existujících):"
Write-Host "   - kandinsky.jpg - Barevná studie s kruhy"
Write-Host "   - malevich.jpg - Černý čtverec"
Write-Host "   - mondrian.jpg - Kompozice s červenou, modrou a žlutou"
Write-Host "   - kupka.jpg - Amorfa: Dvoubarevná fuga"
Write-Host ""
Write-Host "2. Spusťte server pomocí:"
Write-Host "   npm start"
Write-Host ""
Write-Host "3. Klikněte na 'Načíst z textu' a poté na 'Načíst kartičky ze složky'"
Write-Host "   Měl by se objevit balíček 'Abstraktní umění - obrazová galerie'"
Write-Host ""
Write-Host "4. Klikněte na balíček a kartičky by se měly zobrazit správně s obrázky"
