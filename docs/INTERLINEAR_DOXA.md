# Interlinear Doxa (v2)

Ferramenta **Interlinear** em Ferramentas › Explorar o texto. Ao tocar, abre o capítulo em que o leitor está,
rolando até o versículo que estava no topo da tela. Nesta etapa **Gênesis 1–11** têm banco; nos demais capítulos
a tela avisa e oferece atalho para os capítulos prontos. O interlinear antigo do menu do versículo não foi alterado.

## Arquivos

- `app/src/main/assets/reader/js/49.js`: cartão em Ferramentas, tela do capítulo, camadas e painel da palavra (`window.DoxaInterlinear2`).
- `app/src/main/assets/reader/css/49.css`: visual, usando as cores do tema ativo (`--d30-*`).
- `app/src/main/assets/reader/js/49d.js` (Gênesis 1) e `js/49-gen-NN.js` (demais capítulos): bancos de glosas e transliteração, carregados só ao abrir a ferramenta.
- `app/src/main/assets/reader/js/00.js`: carrega `css/49.css` e `js/49.js`.
- `app/src/main/java/com/doxa/android/MainActivity.java`: o botão Voltar do Android chama `window.doxaHandleBack()` antes das outras telas.
- `tools/interlinear_translit.py` (transliteração), `tools/interlinear_export.py` (gera o banco) e `tools/interlinear-gen-NN-glosas.txt` (glosas por capítulo).

O texto hebraico, a morfologia e o léxico vêm do OSHB do pacote `core-texts`. O banco só guarda o que é do Doxa.
Se o hebraico instalado não bater palavra por palavra com o banco, a tela mostra o aviso em vez de glosas desalinhadas.

## Critérios das glosas

- Literal, palavra por palavra, na ordem do hebraico.
- Gênero e número seguem o hebraico: “o luz” (אוֹר), “o treva” (חֹשֶׁךְ), “os águas” (מַיִם), “a gado” (בְּהֵמָה).
- Adjetivos e “todo/toda” concordam com a palavra hebraica.
- Possessivos mostram o dono, como o sufixo: “espécie dele/dela/deles”, “imagem de nós”.
- Estado construto leva “de”; wayyiqtol vira “E + passado”; o tronco verbal muda a glosa (Nifal de קוה = “ajuntem-se”).
- אֵת aparece como a marca **obj.**
- אֱלֹהִים fica “Deus” (verbo no singular); יְהוָה fica “YHWH” (glosa e transliteração).
- אָדָם = “homem”; אִישׁ = “varão”, para manter a distinção do hebraico.
- Adam (nome próprio) só quando o OSHB marca Np; nos demais casos, “homem”.
- Nomes próprios na forma transliterada do Doxa: Pishon, Guihon, Hiddeqel, Perat, Cush, Havilá, Ashur, Éden,
  Havá, Qayin, Hevel, Shet, Noah, Shem, Ham, Yafet, Kenaan, Mitsrayim, Bavel, Shinar, Ever, Peleg, Terah, Avram, Sarai.
- Gentílicos levam o artigo do hebraico (“o Yevusi”); he direcional e he paragógico aparecem como parte própria
  (“para Guerar” = Guerar + (direção); הָבָה = dá + (ênfase)).
- Números seguem o hebraico: “três anos e quatro centenas ano”, “e cem de ano”; duais viram “dois anos”, “duzentos”.
- Quando a etiqueta do OSHB contraria o contexto, a correção vai em `MORPH_FIX` (`tools/interlinear_export.py`)
  e o painel mostra a etiqueta original (ex.: Gn 2:17 מִמֶּנּוּ = “dele”, o OSHB marca 1cp; Gn 7:14 לְמִינָהּ = 3fs).
- Quando o léxico do pacote traz o sentido de um homógrafo errado, o sentido certo vai em `SENSES`
  (ex.: H6327 פּוּץ = “espalhar-se”, H2490c no Hifil = “começar”).

## Transliteração (leitor brasileiro)

Pronúncia do hebraico falado hoje, sem dobrar consoantes. ב b/v, כ k/rr, פ p/f, ח rr, ו v/u/o, ה h aspirado,
ש sh, שׂ/ס s (ss entre vogais), צ ts, י y, ג g (gu antes de e/i), א/ע sem som (apóstrofo separa sílabas),
shevá móvel = e. A sílaba tônica sempre leva acento agudo; formas pausais e he direcional átono seguem o texto
(kálarr, Guerára, ártsa).
Gerada por `tools/interlinear_translit.py`; cada capítulo novo é conferido forma por forma e as exceções vão para as tabelas do fim do arquivo.

## Novo capítulo

1. Escrever `tools/interlinear-<livro>-<cap>-glosas.txt`.
2. Rodar `tools/interlinear_export.py <oshb_strong.js> <glosas> app/src/main/assets/reader/js/49-<livro>-<cap>.js <Livro> <cap>` e registrar o arquivo em `FILES` no `js/49.js`.
3. Conferir as formas transliteradas e acrescentar exceções em `tools/interlinear_translit.py` quando necessário.
