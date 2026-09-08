<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🚀 AdCreative AI

**AdCreative AI** é um motor de inteligência de vendas e direção de arte que transforma inputs técnicos e links de produtos em campanhas de marketing de alta conversão. Utilizando o poder do **Google Gemini**, o sistema gera não apenas o copy persuasivo, mas também a arte visual completa e otimizada para diferentes formatos.

## ✨ Funcionalidades Principais

- 🎨 **Direção de Arte Multimodal**: Gere artes para Post (1:1), Stories (9:16), Banner Web e Banner Mobile.
- ⚡ **Scraping Inteligente**: Cole o link do seu produto e o sistema extrai automaticamente nome, descrição e imagens.
- 🎭 **Estilos Visuais Exclusivos**:
  - **Gastronomia Premium**: Sofisticação, tons escuros e detalhes em ouro.
  - **Experiência VIP**: Impacto dramático, contrastes altos e atmosfera cinematográfica.
  - **Vanguarda Tech**: Minimalismo futurista, tons de gelo e acentos em azul elétrico.
- 🏷️ **Badges de Conversão**: Adicione selos de "12x Sem Juros", "Promoção" ou "À Vista" com um clique.
- 🤖 **IA Flexível**: Suporte nativo ao Google Gemini com fallback automático para OpenRouter.

## 🚀 Começo Rápido

### Pré-requisitos
- Node.js (v18+)
- Uma chave de API do [Google AI Studio](https://aistudio.google.com/) ou [OpenRouter](https://openrouter.ai/).

### Instalação

1.  **Clone o repositório**:
    ```bash
    git clone https://github.com/Ronickbr/ADcreativo_IG.git
    cd ADcreativo_IG
    ```

2.  **Instale as dependências**:
    ```bash
    npm install
    ```

3.  **Configure o ambiente**:
    Crie um arquivo `.env` (ou edite o `.env.local`) e adicione suas chaves:
    ```env
    GEMINI_API_KEY=sua_chave_aqui
    # ou
    OPENROUTER_API_KEY=sua_chave_aqui
    ```

4.  **Inicie o servidor de desenvolvimento**:
    ```bash
    npm run dev
    ```

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19, Vite, Tailwind CSS 4.
- **Animações**: Framer Motion (Motion).
- **Backend**: Express, Better-SQLite3 (cache/settings).
- **IA**: Google GenAI SDK, OpenRouter API.
- **Utilidades**: Lucide React (ícones), Cheerio (scraping).

## 🔐 Segurança e configuração

A opção recomendada é manter as chaves no `.env` do servidor. Também é possível informá-las pela interface; nesse caso elas permanecem apenas em `sessionStorage` durante a aba atual e são enviadas somente ao backend para a chamada solicitada.

- Nunca coloque chaves reais no `.env.example` ou em arquivos versionados.
- O proxy e o importador aceitam somente URLs públicas HTTP/HTTPS e aplicam timeout e limites de tamanho.
- O servidor inclui rate limit básico, headers de segurança e respostas de erro normalizadas.
- O endpoint `GET /api/health` pode ser usado por plataformas de deploy.

## ✅ Qualidade

```bash
npm run check
```

Esse comando executa a verificação do TypeScript, os testes automatizados e o build de produção.

## 🧱 Arquitetura

- `server.ts`: API Express, integrações de IA, scraping e proxy seguro.
- `src/App.tsx`: fluxo de criação e interface responsiva.
- `src/lib/api.ts`: cliente de API e normalização das respostas da IA.
- `src/lib/urlSafety.ts`: validação de URLs e bloqueio de redes privadas.
- `tests/`: testes unitários de segurança e parsing.

## 📄 Licença

Este projeto está sob a licença [Apache-2.0](LICENSE).

---
<div align="center">
Desenvolvido com ❤️ por Antigravity
</div>
