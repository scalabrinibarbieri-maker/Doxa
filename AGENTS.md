# Doxa: regras de manutenção

- Base oficial: Doxa Premium V29. Não voltar a V26–V28.
- Nunca adicionar áudio sem uma nova instrução explícita do usuário.
- Não reescrever o leitor inteiro. Mudanças incrementais e verificáveis.
- Almeida 1819 é padrão; hebraico WLC corrigido do OSHB v2.2; grego local TR Stephanus 1550.
- Gênesis deve permanecer como está até pedido explícito de revisão.
- Preservar morfologia hiperliteral; corrigir escolha lexical contextual somente no escopo solicitado.
- Preservar remapeamento de Êxodo 7–8 e 21–22 e a exceção ao ler WLC.
- Não afirmar alinhamento editorial perfeito da base grega marcada com o TR1550 local.
- Nunca inventar fontes, relações, classificações semânticas ou conclusões doutrinárias.
- Não publicar corpora pessoais, APKs importados nem chaves de produção. A chave pública de debug é exclusivamente de teste.
- Não apagar cache, dados ou instalação anterior para facilitar migração.
- Rodar `bash tools/check.sh`; usar CI para lint/compilação/assinatura.
- Não afirmar testes no Android sem execução em dispositivo/emulador.
- Usuário trabalha pelo celular: entregar fluxos de instalação e importação sem terminal.
