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

# Obrázky pro abstraktní umění

Pro správné zobrazení kartiček abstraktního umění je potřeba do této složky umístit následující soubory s přesně těmito názvy:

1. Wassily_Kandinsky_-_Color_Study_Squares_with_Concentric_Circles_1913_-_(MeisterDrucke-1185849).jpg
2. hera.jpg!Large.jpg
3. 1023px-Francis_Picabia,_1913,_Udnie_(Young_American_Girl,_The_Dance),_oil_on_canvas,_290_x_300_cm,_Musée_National_.jpg
4. album_alb3342850.jpg
5. products-Ciurlionis-Kibirkstys-3.jpg
6. Delaunay_ChampDeMars.jpg
7. Robert_Delaunay_-_Simultaneous_Windows_on_the_City_-_(MeisterDrucke-1416483).jpg
8. T01233_10.jpg
9. 800px-Чёрный_супрематический_квадрат._1915._ГТГ.png
10. Kazimir Malevich -  Mystic Suprematism black cross on red ovaln - (MeisterDrucke-349401).jpg
11. Kazimir_Severinovich_Malevich_-_Suprematist_Composition_White_on_White_1918_-_(MeisterDrucke-635264).jpg
12. Kazimir_Severinovich_Malevich_-_Premonition_compliquee_Torse_dans_une_chemise_jaune_(Complicated_Premonition_Tor_-_.jpg
13. Piet Mondrian - Red Tree  - (MeisterDrucke-32633).jpg
14. Piet Mondrian - The Gray Tree 1911  - (MeisterDrucke-557467).jpg
15. 8136.webp
16. depositphotos_4972604-stock-illustration-abstract-piet-mondrian-style-image.jpg
17. CZE_NG.O_3809.jpeg
18. 201.jpg
19. DioG418X0AE9neG.jpglarge
20. CZE_NG.O_5942.jpeg
21. 18d7e045d5bc3f038fc74d8f3c192485_resize=768,772_.jpg
22. aHR0cHM6Ly9zMy5ldS1jZW50cmFsLTEuYW1hem9uYXdzLmNvbS91cGxvYWRzLm1hbmdvd2ViLm9yZy9hcnRtYXAvcHJvZC91cGxvYWRzLzIwMTkvMDQ.jpg
23. 600.jpg
24. 3-Boudník.strukt.-grafika.jpg
25. 1753-jan-vyletal-geometricka-kompozice-1753-58.jpg
26. 0015019_1600x0_0.jpg
27. EFL2968a7_foto_letna_02.jpg
28. Sykora04-Linie100.jpg
29. 71f6c0543f72dbcb0ba83965fc1dd4f25b2368e24cedf.jpg
30. images.jpg
31. Janoušková-e1567001671746.jpg

Pro správné zobrazení v aplikaci musí být všechny obrázky ve složce `/c:/Zaloha skauti/Skauti/MojeKarticky/public/images/`. V HTML kódu jsou správně referencovány jako `images/název_souboru.jpg`.

## Poznámka o přejmenování

Nechcete-li přejmenovat soubory a chcete použít jejich originální názvy, je potřeba mít je přesně pojmenované podle výše uvedeného seznamu.

## Poznámka o zobrazení

Pro obrázky používáme atribut `style="max-height: 300px;"` pro kontrolu velikosti na kartkách.
