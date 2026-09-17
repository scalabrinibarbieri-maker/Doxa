# Doxa — Android

Aplicativo de leitura e estudo bíblico. Base de conteúdo oficial: **Doxa Premium V29**, sem áudio.

Este repositório inicia a migração de APKs modificados para um projeto Android compilado a partir do código-fonte. A base contém o aplicativo Android, importação local verificável da V29, integração de arquivos e compilação automática. **Na etapa 30.1, o HTML, 18 scripts e 21 estilos do leitor estão separados no projeto. Os 16 bancos privados são extraídos no aparelho da V29 já importada.**

## Testar somente pelo celular

1. Abra [Actions → APK Android](https://github.com/scalabrinibarbieri-maker/Doxa/actions/workflows/android.yml).
2. Abra uma execução verde e baixe o artefato **Doxa-Teste-N** (é necessário estar conectado ao GitHub).
3. Extraia o ZIP e instale **Doxa-Teste.apk**.
4. Abra **Doxa Teste**, toque em **Selecionar minha V29** e escolha seu arquivo original **Doxa_Premium_V29.apk**.
5. Aguarde a conferência dos 90 arquivos e a organização dos bancos. O leitor abre e os arquivos ficam disponíveis nas próximas aberturas, offline.

**Se o Doxa Teste já está instalado:** instale a atualização por cima, sem desinstalar. Ela reutiliza os arquivos já importados. A organização inicial precisa de aproximadamente 78 MB adicionais livres; mantém a V29 original para recuperação.

A importação lê os assets do APK; não instala nem executa o código Android antigo. Nenhum conteúdo bíblico é enviado ao GitHub. Um APK com arquivos diferentes dos registrados é recusado.

O aplicativo de teste usa `com.doxa.android.dev` e fica ao lado da V29 (`com.orangi.doxa.vx`). **Não desinstale a V29 para testar.** Grifos, notas, posição de leitura e recursos baixados da instalação antiga não são copiados pelo APK. Utilize as exportações/importações existentes quando disponíveis; ainda não há migração completa desses dados.

## O que foi preservado

Os 90 arquivos do leitor são importados byte a byte: `index.html`, Gênesis 2–50 e Êxodo 1–40. Gênesis 1 mantém seus dados e comportamento no script do leitor. Os trechos de código de HUD, seleção, leitura paralela, Strong, menu de estudo e remapeamento de Êxodo são preservados. A ordem de execução permanece síncrona. A validação no telefone deve confirmar o comportamento após a separação.

Preservar os arquivos **não equivale a comprovar todos os comportamentos na nova WebView**. O novo Android usa origem HTTPS local estável e armazenamento próprio. Testes no telefone precisam verificar leitura, downloads remotos, cache, seletor de arquivos e backups. [Roteiro de validação](docs/VALIDACAO.md).

## Compilação

- Java 17, Gradle 8.11.1 e Android Gradle Plugin 8.9.2.
- `compileSdk 35`, `minSdk 23` e `targetSdk 29` nesta etapa para preservar o comportamento anterior.
- AndroidX WebKit 1.12.1, versões fixadas deliberadamente.
- GitHub Actions executa testes do importador e da transferência de backups, lint, compilação e verificação da assinatura.
- APK de teste disponível como artefato por 30 dias. Uma nova execução pode ser iniciada em **Run workflow**.
- Para desenvolvimento com SDK instalado: `gradle -PdoxaLocalTest=true :app:assembleDebug :app:lintDebug` usando Gradle 8.11.1. Ainda não há Gradle Wrapper neste repositório; o CI instala a versão fixada.

Referências de compatibilidade: [AGP 8.9](https://developer.android.com/build/releases/agp-8-9-0-release-notes), [WebKit](https://developer.android.com/jetpack/androidx/releases/webkit), [assets locais](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content).

## Assinatura

`config/debug.keystore` é uma **chave pública de teste**, com senha `android`, exclusivamente para `com.doxa.android.dev`. Ela permite atualizar builds de teste sem mudar a identidade a cada compilação. Qualquer pessoa pode usar essa chave; ela não autentica uma distribuição oficial.

**A assinatura definitiva de produção ainda não está configurada.** O build release fica sem assinatura até uma chave privada ser criada e guardada em local seguro e nos secrets apropriados. Nunca substituir silenciosamente essa chave por uma chave temporária. O package de produção reservado é `com.doxa.android`; instalar a primeira versão com essa identidade exigirá uma migração própria dos dados de teste.

## Conteúdo e licenças

O repositório público não inclui o APK V29 nem os corpora pessoais. O importador preserva sua cópia local; uso pessoal não determina direitos de redistribuição. Licenças dos textos, léxicos, comentários e bases devem ser revisadas antes de qualquer pacote público de conteúdo. [Registro inicial de proveniência](docs/PROVENIENCIA.md).

## Próximas etapas

- Validar esta base no Android do usuário.
- Reduzir gradualmente o carregamento inicial dos bancos: nesta etapa continuam sendo carregados na abertura.
- Criar uma migração completa de grifos, notas, posição e caches.
- Configurar a assinatura privada definitiva e atualizações de produção.
- Revisar targetSdk e requisitos de distribuição antes de publicar em loja.
- Continuar o interlinear a partir da metodologia de Êxodo, quando solicitado.

Não há áudio, placeholders de estudo, revisão geral de Gênesis ou novo conteúdo bíblico nesta etapa.

Detalhes da separação e dos testes: [Migração 30.1](docs/MIGRACAO_30_1.md).
