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

## ⚙️ Configuração

A aplicação permite configurar a IA diretamente pela interface:
- **Gemini API Key**: Chave principal para geração de alta fidelidade.
- **OpenRouter Fallback**: Use modelos como `Gemini 2.5 Flash Image` ou `Claude` caso a API principal esteja instável.
- **Modo Proxy**: Gerenciamento de imagens e scraping para evitar problemas de CORS.

## 📄 Licença

Este projeto está sob a licença [Apache-2.0](LICENSE).

---
<div align="center">
Desenvolvido com ❤️ por Antigravity
</div>
