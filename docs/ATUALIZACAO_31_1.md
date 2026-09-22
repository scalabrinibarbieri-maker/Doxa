# Atualização 31.1

## Correções

- **Ajuda aparecendo embaixo de cada capítulo.** Na atualização da Home, `js/19.js` (textura de papel) e `css/22.css` (Ferramentas, Leitura paralela e folha de Ajuda) foram sobrescritos pelos arquivos da Home. Sem o CSS, a folha de Ajuda ficava solta no fim da página. Os dois arquivos originais foram restaurados e a Home passou para `js/21.js` e `css/23.css`.
- **Carregamento.** `js/00.js` carrega em ordem: 18 shell → 19 textura → 20 ferramentas → 21 Home → 22 fontes. O `index.html` não carrega mais 18/19 diretamente (evita execução dupla).
- **Preferências de texto voltando ao padrão.** Nada é gravado antes de `load()` terminar (antes, scripts de boot podiam salvar os valores padrão por cima dos salvos). A cópia de segurança agora tem carimbo de tempo e vale a mais recente entre localStorage e IndexedDB.
- **Versículo segurado nos temas claros.** O destaque usa um tom profundo da paleta do tema; o Night permanece idêntico.
- **Home acompanha os temas.** Cada cor da Home virou variável; no Night os valores são os aprovados, nos demais temas são recalculados na paleta.

## Novo

- **Tipografia de leitura** em Ajustes: Serifada, EB Garamond e fonte importada (.ttf/.otf, até 15 MB). A escolha fica em localStorage e o arquivo da fonte no IndexedDB (`doxa-fonts-v1`). Variável CSS própria: `--doxa-font`. O hebraico não é afetado.

Não testado em aparelho neste ambiente; compilação pelo GitHub Actions.
