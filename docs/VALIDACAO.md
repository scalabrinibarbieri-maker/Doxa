# Validação da primeira base Android

## Automatizável

- Importação: preservação de bytes e SHA-256 de todos os 90 assets da V29.
- Recusa de arquivos corrompidos, incompletos, extras, caminhos relativos perigosos e tamanhos inesperados.
- Limpeza da importação parcial após erro.
- Exportação de Blob em blocos com integridade binária, sem colocar o backup inteiro em uma mensagem JavaScript.
- Verificação de que corpora, APKs e chaves privadas de produção não integram a árvore pública.
- CI: compilação Android, lint e verificação criptográfica da assinatura do APK de teste.

O CI não contém o APK V29. O teste completo dos 90 arquivos é realizado localmente contra o anexo do usuário; no GitHub executam-se os casos sintéticos do importador.

## No celular — ainda precisa ser executado

1. Instalar ao lado da V29 e importar o arquivo correto. Reiniciar e abrir em modo avião.
2. Conferir Almeida padrão, outras versões e seletor Livro → Capítulo → Versículo.
3. Ler Gênesis 1, 2 e 50; Êxodo 1 e 40 no interlinear e tocar palavras para abrir Raio-X.
4. Conferir Êxodo 8:1 → WLC 7:26; 8:5 → WLC 8:1; 22:1 → WLC 21:37; 22:2 → WLC 22:1. Em WLC, manter a numeração hebraica.
5. Testar HUD, gestos de capítulo, paralelo sincronizado, grifos e notas, incluindo persistência após fechar.
6. Testar referências cruzadas, comentários, crítica textual e entidades com internet e depois offline.
7. Baixar recursos offline, cancelar, retomar e reabrir o aplicativo.
8. Exportar/importar marcações e backup offline pelo seletor Android; testar também cancelamento.
9. Testar rotação, teclado, botão voltar, pausas e retorno do seletor de arquivos.
10. Instalar um segundo build de teste por cima do primeiro e conferir os dados.

## Limites conhecidos

- Esta etapa muda a base Android, mas ainda não modulariza o leitor legado.
- A importação do APK não transfere o armazenamento privado da instalação antiga.
- Origem local agora é HTTPS. Recursos remotos continuam sujeitos ao CORS e à disponibilidade das fontes.
- Exportação nativa depende de suporte WEB_MESSAGE_LISTENER no Android System WebView; se faltar, atualizar esse componente.
- Limite de exportação de backup: 512 MB por arquivo. A V29 ainda pode consumir muita memória ao montar seu próprio backup antes da transferência.
- O APK de teste usa chave pública de desenvolvimento; assinatura definitiva e distribuição em loja estão pendentes.
- targetSdk 29 é temporário e não representa conformidade com requisitos atuais de publicação em loja.
