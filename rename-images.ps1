# PowerShell skript pro automatické přejmenování obrázků abstraktního umění

# Definice cest
$imagesDir = Join-Path $PSScriptRoot "public\images"
$kartickyDir = Join-Path $PSScriptRoot "public\Karticky"
$simpleDeckPath = Join-Path $kartickyDir "jednoduche-abstraktni-umeni.txt"

# Kontrola existence složky s obrázky
if (-not (Test-Path $imagesDir)) {
    Write-Host "Vytvářím složku pro obrázky: $imagesDir"
    New-Item -ItemType Directory -Path $imagesDir -Force | Out-Null
}

# Definice mapování mezi typem umění a jednoduchým názvem
$artMapping = @{
    "kandinsky" = @("Wassily_Kandinsky", "kandinsky", "Kandinsky", "circles", "Color_Study", "concentr")
    "malevich" = @("Malevich", "Malevič", "black square", "čtverec", "supreme")
    "mondrian" = @("Mondrian", "composition", "kompozice", "neoplastic", "stijl")
    "kupka" = @("Kupka", "amorfa", "fuga", "dvoubarevn")
    "delaunay" = @("Delaunay", "simultaneous", "rhythm", "orfismus", "orfism")
    "picabia" = @("Picabia", "hera", "dance", "Girl")
    "ciurlionis" = @("Ciurlionis", "Čiurlionis", "sonata", "sparks")
    "sykora" = @("Sykora", "Sýkora", "linie")
    "boudnik" = @("Boudnik", "Boudník", "babylon", "activni")
    "vyletal" = @("Vyletal", "Vyleťal", "kompozice", "intelligence")
    "janouskova" = @("Janouskova", "Janouškov", "kabát", "figura")
}

# Funkce pro určení typu umění podle názvu souboru
function Get-ArtType($fileName) {
    foreach ($art in $artMapping.Keys) {
        foreach ($keyword in $artMapping[$art]) {
            if ($fileName -match $keyword) {
                return $art
            }
        }
    }
    return $null  # Pokud nenajdeme shodu
}

# Spočítat počítadlo pro každý typ umění (pro případ více souborů stejného typu)
$artCounts = @{}
foreach ($key in $artMapping.Keys) {
    $artCounts[$key] = 0
}

# Získat všechny obrazové soubory
$imageFiles = Get-ChildItem -Path $imagesDir -File | Where-Object {
    $_.Extension -match "\.(jpg|jpeg|png|gif|webp|bmp)$"
}

Write-Host "Nalezeno $($imageFiles.Count) obrazových souborů"

# Seznam úspěšně přejmenovaných souborů
$renamedFiles = @{}

# Přejmenovat každý soubor
foreach ($file in $imageFiles) {
    $artType = Get-ArtType -fileName $file.Name
    
    if ($artType) {
        $artCounts[$artType]++
        $count = $artCounts[$artType]
        
        # Vytvořit nový název (s číslem, pokud je více souborů stejného typu)
        $newName = if ($count -eq 1) {
            "$artType.jpg"
        } else {
            "${artType}_$count.jpg"
        }
        
        $newPath = Join-Path $imagesDir $newName
        
        # Přejmenovat soubor (pokud se liší od nového názvu)
        if ($file.Name -ne $newName) {
            try {
                # Pokud cílový soubor již existuje, přidat unikátní číslo
                if (Test-Path $newPath) {
                    $timestamp = Get-Date -Format "yyyyMMddHHmmss"
                    $newName = "${artType}_$timestamp.jpg"
                    $newPath = Join-Path $imagesDir $newName
                }
                
                Copy-Item -Path $file.FullName -Destination $newPath -Force
                $renamedFiles[$file.Name] = $newName
                Write-Host "Přejmenováno: $($file.Name) -> $newName" -ForegroundColor Green
            }
            catch {
                Write-Host "Chyba při přejmenování $($file.Name): $_" -ForegroundColor Red
            }
        }
        else {
            Write-Host "Soubor $($file.Name) již má správný název" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "Nenalezen typ umění pro $($file.Name), ponechávám původní název" -ForegroundColor Yellow
    }
}

# Vytvořit nový soubor s kartičkami s jednoduchými názvy
$simpleContent = @"
#separator:tab
#html:true
#name:Abstraktní umění - obrazová galerie

<img alt="Barevná studie" src="images/kandinsky.jpg" style="max-height: 300px;">	Vasilij Kandinskij - Soustředné Kruhy (1913). Jeden z nejznámějších obrazů tohoto průkopníka abstraktního umění.
<img alt="Černý čtverec" src="images/malevich.jpg" style="max-height: 300px;">	Kazimir Malevič - Černý čtverec na bílém pozadí (1915). Ikona suprematismu a klíčové dílo abstraktního umění 20. století.
<img alt="Kompozice" src="images/mondrian.jpg" style="max-height: 300px;">	Piet Mondrian - Kompozice v červené, žluté, modré a černé. Typické dílo neoplasticismu používající pouze základní barvy a pravoúhlé tvary.
<img alt="Amorfa" src="images/kupka.jpg" style="max-height: 300px;">	František Kupka - Amorfa: Dvoubarevná fuga (1912). Jedno z prvních plně abstraktních děl v historii malířství.
<img alt="Rytmus" src="images/delaunay.jpg" style="max-height: 300px;">	Robert Delaunay - Endless Rhythm (Nekonečný rytmus), 1934. Dílo zobrazující kruhové tvary připomínající hudební rytmus a pohyb.
<img alt="Linie" src="images/sykora.jpg" style="max-height: 300px;">	Zdeněk Sýkora - Linie č. 100. Průkopník využití počítačů v umění, tvořil struktury a linie generované algoritmicky.
"@

# Zapsat nový soubor
$simpleContent | Out-File -FilePath $simpleDeckPath -Encoding utf8
Write-Host "Vytvořen nový soubor s kartičkami: $simpleDeckPath" -ForegroundColor Green

# Aktualizovat vercel-server.js
$vercelServerPath = Join-Path $PSScriptRoot "vercel-server.js"
if (Test-Path $vercelServerPath) {
    $content = Get-Content -Path $vercelServerPath -Raw
    
    # Pokud existuje funkce createAbstractArtImagesDeck, aktualizovat ji
    if ($content -match "function createAbstractArtImagesDeck\(\)") {
        Write-Host "Nalezena funkce createAbstractArtImagesDeck v vercel-server.js" -ForegroundColor Green
        Write-Host "Pro úplnou opravou doporučujeme zkontrolovat a případně upravit odkazy na obrázky ve funkci"
    }
}

Write-Host "`n=== SHRNUTÍ ===" -ForegroundColor Cyan
Write-Host "Celkem přejmenováno $($renamedFiles.Count) souborů" -ForegroundColor Cyan
Write-Host "Vytvořen soubor s kartičkami: $simpleDeckPath" -ForegroundColor Cyan
Write-Host "`n=== DALŠÍ KROKY ===" -ForegroundColor Cyan
Write-Host "1. Spusťte aplikaci: npm start" -ForegroundColor White
Write-Host "2. Klikněte na 'Načíst z textu'" -ForegroundColor White
Write-Host "3. Klikněte na 'Načíst kartičky ze složky'" -ForegroundColor White
Write-Host "4. Vyberte balíček 'Abstraktní umění - obrazová galerie'" -ForegroundColor White

# Zobrazit mapování souborů pro informaci
Write-Host "`n=== MAPOVÁNÍ NÁZVŮ SOUBORŮ ===" -ForegroundColor Cyan
foreach ($oldName in $renamedFiles.Keys) {
    Write-Host "$oldName -> $($renamedFiles[$oldName])" -ForegroundColor DarkGray
}
