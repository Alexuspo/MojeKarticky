# Složka pro obrázky

Do této složky umístěte obrázky, které chcete používat ve svých kartičkách.

## Jak přidat obrázky do kartiček

### Ve formátu textového souboru

V textovém souboru s kartičkami můžete použít HTML značku pro vložení obrázku:

```
#separator:tab
#html:true
#notetype column:1
#deck column:2
#tags column:5
Literatura - Test kartičky.	Literatura - Test kartičky.	Otázka s obrázkem <img src="nazev_obrazku.jpg" alt="Popis obrázku">	Odpověď	
```

Důležité je nastavit `#html:true` v hlavičce souboru, aby byly HTML značky interpretovány správně.

### Podporované formáty obrázků

- JPG/JPEG
- PNG
- GIF
- SVG
- WebP

## Omezení velikosti

Pro lepší výkon doporučujeme používat obrázky s rozumnou velikostí (ideálně do 500 KB).
