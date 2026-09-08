# Plano de implementação — AdCreative AI

## Objetivo

Melhorar segurança, confiabilidade, organização do código e experiência de uso sem alterar a proposta central do produto: gerar criativos a partir de fotos, dados e links de produtos.

## Diagnóstico

### Backend

- A configuração do OpenRouter é mantida em memória global e pode ser sobrescrita por qualquer visitante.
- O frontend recebe e armazena chaves de API, e a chave Gemini pode ser injetada no bundle pelo Vite.
- `/api/proxy-image` e `/api/scrape` aceitam URLs arbitrárias, criando risco de SSRF.
- Requisições externas não têm timeout, limite de download nem validação rigorosa de tipo.
- Payloads multimodais não possuem limite explícito e erros internos são expostos ao cliente.
- Não há endpoint de saúde, rate limit básico ou validação consistente das entradas.

### Frontend e UI/UX

- `App.tsx` concentra interface, estado, integração de IA e tratamento de respostas em cerca de 1.300 linhas.
- A navegação de formatos não se adapta bem a telas pequenas e Configurações desaparece no mobile.
- O usuário não vê claramente as etapas do fluxo, os campos obrigatórios nem o estado de prontidão.
- Uploads dependem de áreas pouco explícitas e faltam validações acessíveis e feedback não bloqueante.
- Cores, foco, contraste e textos auxiliares precisam de maior consistência.
- O bundle principal está acima de 650 KB; o SDK Gemini no cliente é um dos principais responsáveis.

## Mudanças propostas

### 1. Backend seguro e previsível

- Centralizar integrações Gemini/OpenRouter no servidor.
- Remover configuração global mutável e impedir que segredos sejam devolvidos ao navegador.
- Usar variáveis de ambiente no servidor, com opção de chave enviada somente por requisição para uso local.
- Criar validação de payload, timeout com `AbortController`, limites de tamanho e respostas padronizadas.
- Bloquear protocolos não HTTP(S), credenciais embutidas, localhost e faixas de IP privadas/reservadas.
- Validar tipo e tamanho de imagens no proxy/scraper.
- Adicionar headers de segurança, rate limit em memória e `/api/health`.

### 2. Arquitetura frontend

- Extrair tipos, constantes, utilitários e cliente da API para módulos próprios.
- Dividir a tela em componentes de cabeçalho, seletor de formato, formulário, cartões de produto, configurações e resultado.
- Remover o SDK Gemini do bundle do navegador.
- Criar estado de configuração e mensagens consistentes sem `alert()`.

### 3. Redesign UI/UX

- Aplicar uma identidade visual premium, sóbria e voltada a performance comercial, sem excesso de roxo.
- Introduzir fluxo em três etapas: produto, direção criativa e resultado.
- Melhorar responsividade, navegação horizontal no mobile e painel de resultado fixo no desktop.
- Tornar campos obrigatórios, estados de foco, botões e mensagens acessíveis.
- Exibir progresso real de geração e checklist de prontidão.
- Melhorar ações de copiar legenda, baixar, compartilhar e regerar.

### 4. Qualidade e entrega

- Adicionar testes unitários para validação de URLs e parsing das respostas de IA.
- Adicionar scripts de teste e checagem completa.
- Atualizar `.env.example`, metadados, README e instruções de segurança.
- Executar lint, testes, build e validação visual em desktop/mobile.
- Entregar em branch dedicada e abrir pull request, sem merge automático.

## Critérios de aceite

- Nenhuma chave configurada no servidor aparece no bundle ou nas respostas da API.
- URLs locais/privadas são recusadas pelo proxy e pelo scraper.
- Requisições externas encerram por timeout e respeitam limites de conteúdo.
- Fluxo completo funciona em 390 px e 1440 px sem overflow indevido.
- Lint, testes e build passam.
- A tela inicial comunica claramente o que falta para gerar o criativo.
- O PR documenta mudanças, riscos, testes e configuração necessária.

## Estratégia de compatibilidade

- Preservar formatos, estilos, campos de produto e suporte a Gemini/OpenRouter.
- Aceitar as variáveis atuais durante a migração, documentando os novos nomes quando necessário.
- Não alterar arquivos `.env` ou `.env.local`.
