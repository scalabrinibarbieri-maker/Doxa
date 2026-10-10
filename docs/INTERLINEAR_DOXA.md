# Interlinear Doxa (v2)

Tela do modo **Interlinear** na tela de estudo, versículo por versículo. Nesta etapa: **Gênesis 1**.
Gênesis 2–50 e Êxodo continuam no interlinear anterior até receberem o banco novo.

## Arquivos

- `app/src/main/assets/reader/js/49.js` — módulo (`window.DoxaInterlinear2`), painel da palavra e camadas.
- `app/src/main/assets/reader/css/49.css` — visual, usando as cores do tema ativo (`--d30-*`).
- `app/src/main/assets/reader/js/49d.js` — banco de Gênesis 1 (glosas + transliteração), carregado só ao abrir o interlinear.
- `js/09.js` — em `renderInterlinear`, Gênesis 1 usa o módulo novo; se o banco falhar, volta ao protótipo antigo.
- `tools/interlinear_translit.py` (transliteração), `tools/interlinear_export.py` (gera o banco) e `tools/interlinear-gen-01-glosas.txt` (glosas).

O texto hebraico, a morfologia e o léxico vêm do OSHB do pacote `core-texts`. O banco só guarda o que é do Doxa.
Se o hebraico instalado não bater palavra por palavra com o banco, a tela antiga é usada.

## Critérios das glosas

- Literal, palavra por palavra, na ordem do hebraico.
- Gênero e número seguem o hebraico: “o luz” (אוֹר), “o treva” (חֹשֶׁךְ), “os águas” (מַיִם), “a gado” (בְּהֵמָה).
- Adjetivos e “todo/toda” concordam com a palavra hebraica.
- Possessivos mostram o dono, como o sufixo: “espécie dele/dela/deles”, “imagem de nós”.
- Estado construto leva “de”; wayyiqtol vira “E + passado”; o tronco verbal muda a glosa (Nifal de קוה = “ajuntem-se”).
- אֵת aparece como a marca **obj.**
- אֱלֹהִים fica “Deus” (verbo no singular).

## Transliteração (leitor brasileiro)

Pronúncia do hebraico falado hoje, sem dobrar consoantes. ב b/v, כ k/rr, פ p/f, ח rr, ו v/u/o, ה h aspirado,
ש sh, שׂ/ס s (ss entre vogais), צ ts, י y, ג g (gu antes de e/i), א/ע sem som (apóstrofo separa sílabas),
shevá móvel = e. A sílaba tônica sempre leva acento agudo.
Gerada por `tools/interlinear_translit.py`; cada capítulo novo é conferido forma por forma e as exceções vão para as tabelas do fim do arquivo.

## Novo capítulo

1. Escrever `tools/interlinear-<livro>-<cap>-glosas.txt`.
2. Rodar `tools/interlinear_export.py` e registrar o arquivo gerado em `FILES` no `js/49.js`.
3. Conferir as formas transliteradas e acrescentar exceções em `tools/interlinear_translit.py` quando necessário.
