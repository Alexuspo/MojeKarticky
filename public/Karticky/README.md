# Kartičky ve formátu TXT

Do této složky umístěte textové soubory obsahující vaše kartičky.
Textový soubor musí mít strukturu použitou při exportu z Anki, kde sloupce jsou odděleny tabulátorem.

Příklad struktury:
```
#separator:tab
#html:true
#notetype column:1
#deck column:2
#tags column:5
Literatura - Test kartičky. 	Literatura - Test kartičky.	Otázka 1	Odpověď 1	
Literatura - Test kartičky. 	Literatura - Test kartičky.	Otázka 2	Odpověď 2	
...
```

Každý řádek představuje jednu kartičku, kde:
- 3. sloupec obsahuje přední stranu kartičky (otázku)
- 4. sloupec obsahuje zadní stranu kartičky (odpověď)
