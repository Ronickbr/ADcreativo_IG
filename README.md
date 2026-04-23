# ADCreativo IG — Gerador de Criativos com IA

Aplicativo web que gera criativos publicitários profissionais para Instagram usando inteligência artificial via **OpenRouter API**.

## ✨ Funcionalidades

- **Geração de copy** estratégica com IA (Gemini 2.5 Flash)
- **Geração de imagem** publicitária com IA (Gemini 2.5 Flash Image)
- **Scraper de produtos** — busca automática de nome, descrição e imagem a partir de URL
- **Input manual** — preencha nome, descrição e envie imagem diretamente
- **15 estilos visuais** — Realista, Cyberpunk, Minimalista, Pop Art, Luxo e mais
- **4 formatos** — Post (1:1), Stories (9:16), Banner Web (4:1), Banner Mobile

## 🛠️ Stack Tecnológica

| Tecnologia | Uso |
|------------|-----|
| React 19 | Interface do usuário |
| Vite 6 | Build e dev server |
| TailwindCSS v4 | Estilização |
| Express | Server backend (scraper) |
| OpenRouter API | IA (Gemini 2.5 Flash + Image) |
| Motion | Animações |

## 🚀 Como Rodar

```bash
# Instalar dependências
npm install

# Rodar em modo desenvolvimento
npm run dev
```

O app estará disponível em `http://localhost:3000`.

## ⚙️ Configuração

A chave do **OpenRouter** é configurada diretamente no app:

1. Clique no botão **Configurações** (ícone ⚙️) no canto superior direito
2. Insira sua chave de API do OpenRouter (`sk-or-v1-...`)
3. Clique em **Salvar Configurações**

Obtenha sua chave em [openrouter.ai/keys](https://openrouter.ai/keys).

## 📁 Estrutura do Projeto

```
src/
├── App.tsx              # Componente principal
├── main.tsx             # Entry point
├── index.css            # Estilos globais + Tailwind
├── components/
│   ├── Header.tsx       # Cabeçalho com formatos e configurações
│   ├── ProductInput.tsx # Input de produto (scraper + manual)
│   ├── StyleSelector.tsx # Seletor de estilos visuais
│   ├── SettingsModal.tsx # Modal de configurações
│   └── ResultSection.tsx # Preview do resultado gerado
├── hooks/
│   ├── useAdGenerator.ts   # Hook de geração (copy + imagem via OpenRouter)
│   └── useProductScraper.ts # Hook de scraping de produto
├── types/
│   └── index.ts         # Tipos TypeScript
└── lib/
    └── utils.ts         # Utilitários (cn)
server.ts                # Express server (scraper API)
```

## 📝 Licença

Apache-2.0
