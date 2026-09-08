# Changelog

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto utiliza [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.0.0] — 2026-09-08

### Adicionado

- Novo fluxo de criação dividido em produto, direção visual e resultado.
- Integrações Gemini e OpenRouter mediadas pelo backend.
- Importação segura de dados de produtos por URL.
- Suporte a posts, Stories, banners web e banners mobile.
- Testes unitários para parsing de IA e bloqueio de redes privadas.
- Endpoint de saúde e detecção de provedores configurados.

### Alterado

- Interface redesenhada para desktop e dispositivos móveis.
- Chaves informadas na interface passam a permanecer apenas na sessão atual.
- Bundle JavaScript reduzido em aproximadamente 47%.

### Segurança

- Proteção contra SSRF e redirecionamentos para redes privadas.
- Limites de payload, imagem e HTML, timeouts e rate limit.
- Remoção de chave Gemini exposta no arquivo de exemplo.
- Remoção de segredos do bundle do navegador.

[1.0.0]: https://github.com/Ronickbr/ADcreativo_IG/releases/tag/v1.0.0
