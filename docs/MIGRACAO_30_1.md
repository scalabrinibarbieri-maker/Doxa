# Migração 30.1

O HTML público tem 47.198 bytes, com 18 scripts clássicos e 21 folhas de estilo separados. Os scripts mantêm seus IDs e a execução síncrona original. Dez atribuições CORPORA são executadas imediatamente antes da IIFE original; dependem somente do objeto global já inicializado. As demais declarações de bancos são carregadas antes do código que as utiliza, sem mudar seus nomes globais.

Os 16 bancos são extraídos como intervalos UTF-8 exatos do HTML importado: Strong PT, Hiperliteral, Almeida, WLC, TR, OSHB e dez versões PT. Não são publicados. O plano `reader-data.tsv` registra offsets, tamanhos e SHA-256. O HTML original também é validado antes da extração. Gênesis e Êxodo continuam nos mesmos arquivos privados e caminhos relativos, sob demanda.

A migração escreve em uma pasta temporária, verifica cada banco, sincroniza as gravações e ativa somente o conjunto completo. Repetir a abertura com a mesma identidade não extrai novamente. Um conjunto incompleto é reconstruído. A origem e o endereço permanecem `https://appassets.androidplatform.net/assets/index.html`; a atualização não limpa localStorage, IndexedDB nem notas. Mantém package e chave pública de teste. Não confundir isso com transferência de dados entre a antiga V29 e o Doxa Teste.

Se a extração falhar, é possível abrir a V29 preservada. O original continua ocupando espaço: os bancos separados exigem aproximadamente 78 MB adicionais. Não há remoção do original nesta etapa.

A ordem das rotas específicas antes da rota geral segue o [WebViewAssetLoader.Builder](https://developer.android.com/reference/androidx/webkit/WebViewAssetLoader.Builder#addPathHandler(java.lang.String,androidx.webkit.WebViewAssetLoader.PathHandler)). Os bancos ainda são carregados antecipadamente: a mudança prepara a manutenção incremental, sem prometer redução imediata da memória ou tempo de abertura.

## Verificações

- `bash tools/check.sh`: importador, exportação nativa, migração sintética, sintaxe e referências públicas.
- `python3 tools/check-reader.py /caminho/index.html`: comparação byte a byte dos 18 scripts remanescentes, 21 estilos e hashes dos 16 bancos; sintaxe dos bancos privados.
- `tools/MigrationCheck.java` aceita o HTML original: extração real, repetição, reconstrução de banco truncado e recusa de fonte corrompida preservando o original.
- `tools/split-reader.py /caminho/index.html` reproduz os arquivos públicos exclusivamente a partir da V29 identificada no manifesto. Não executar depois de editar os módulos sem revisar o diff: o gerador restaura o código original.

Compilação, lint e assinatura são executados no GitHub Actions. Não foi feito teste desta atualização em Android/emulador neste ambiente.

## Validar no telefone

Instalar por cima do Doxa Teste. Conferir posição, notas e grifos existentes. Abrir Almeida, WLC/TR, Hiperliteral e modo paralelo. Conferir HUD ao mudar capítulo; interlinear de Gênesis e Êxodo, inclusive remapeamento em 7–8 e 21–22; toque de palavra para Raio-X. Fechar e reabrir em modo avião. Verificar estudo previamente baixado e exportação/importação de backup. O teste da V29 anterior não substitui esta rodada.
