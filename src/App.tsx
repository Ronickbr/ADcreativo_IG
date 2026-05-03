/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import {
  Camera,
  Image as ImageIcon,
  FileText,
  Sparkles,
  Download,
  Share2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
  X,
  Type as TypeIcon,
  Palette,
  Layout,
  PenTool,
  MousePointer2,
  Zap,
  Square,
  History,
  Leaf,
  Crown,
  Settings,
  Globe,
  CreditCard,
  Percent,
  Banknote,
  Tag,
  Building,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type AdStyle = 'gastronomia_premium' | 'experiencia_vip';
type AdFormat = 'post' | 'banner' | 'stories' | 'banner_mobile';

interface AdResult {
  headline: string;
  benefits: string[];
  cta: string;
  caption: string;
  hashtags: string[];
  visualDescription: string;
  imageUrl?: string;
  backgroundKeywords?: string;
}

interface ImageState {
  file: File | null;
  preview: string | null;
  base64: string | null;
}

interface ProductData {
  id: string;
  image: ImageState;
  name: string;
  url: string;
  techData: string;
  price: string;
  badge: 'a_vista' | '12x' | 'promo' | 'none';
}

const STYLES = [
  {
    id: 'gastronomia_premium',
    name: 'Gastronomia Premium',
    icon: Crown,
    desc: 'Sofisticação, robustez e autoridade industrial',
    preview: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=200&h=200'
  },
  {
    id: 'experiencia_vip',
    name: 'Experiência VIP',
    icon: Zap,
    desc: 'Impacto sensorial, dramático e exclusivo',
    preview: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=200&h=200'
  },
];

const FORMATS = [
  { id: 'post', name: 'Post Instagram', ratio: '1:1', desc: '1080 x 1080 px' },
  { id: 'stories', name: 'Stories / Reels', ratio: '9:16', desc: '1080 x 1920 px' },
  { id: 'banner', name: 'Banner Web', ratio: '144:41', desc: '1440 x 410 px' },
  { id: 'banner_mobile', name: 'Banner Mobile', ratio: '3.2:1', desc: '320 x 100 px' },
] as const;

const BADGE_OPTIONS = [
  { id: 'none', label: 'X', icon: X, prompt: '' },
  { id: 'a_vista', label: 'À Vista', icon: Banknote, prompt: 'À Vista' },
  { id: '12x', label: '12x Sem Juros', icon: CreditCard, prompt: '12x Sem Juros' },
  { id: 'promo', label: 'Promoção', icon: Percent, prompt: 'Promoção' },
] as const;

const RECOMMENDED_OR_MODELS = [
  { id: 'google/gemini-2.5-flash-image', name: 'Nano Banana (Gemini 2.5 Flash Image)' },
  { id: 'google/gemini-3.1-flash-image-preview', name: 'Nano Banana 2 (Gemini 3.1 Flash Image Preview)' },
  { id: 'google/gemini-3-pro-image-preview', name: 'Nano Banana Pro (Gemini 3 Pro Image Preview)' },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash (General Purpose)' },
];

const deobfuscate = (str: string | null) => {
  if (!str) return '';
  try {
    return atob(str.split('').reverse().join(''));
  } catch {
    return str;
  }
};

const obfuscate = (str: string) => {
  if (!str) return '';
  return btoa(str).split('').reverse().join('');
};

export default function App() {
  const [activeFormat, setActiveFormat] = useState<AdFormat>('post');
  const [bgImage, setBgImage] = useState<ImageState>({ file: null, preview: null, base64: null });
  const [products, setProducts] = useState<ProductData[]>([{
    id: '1',
    image: { file: null, preview: null, base64: null },
    name: '',
    url: '',
    techData: '',
    price: '',
    badge: 'none'
  }]);
  const [logoImage, setLogoImage] = useState<ImageState>({ file: null, preview: null, base64: null });
  const [isFetchingIndex, setIsFetchingIndex] = useState<number | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<AdStyle>('gastronomia_premium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [result, setResult] = useState<AdResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [openRouterKey, setOpenRouterKey] = useState(() => deobfuscate(localStorage.getItem('openRouterKey')));
  const [openRouterModel, setOpenRouterModel] = useState(() => localStorage.getItem('openRouterModel') || 'google/gemini-2.0-flash-001');
  const [useOpenRouter, setUseOpenRouter] = useState(() => localStorage.getItem('useOpenRouter') === 'true');
  const [fallbackToOpenRouter, setFallbackToOpenRouter] = useState(() => localStorage.getItem('fallbackToOpenRouter') === 'true');
  const [geminiApiKey, setGeminiApiKey] = useState(() => deobfuscate(localStorage.getItem('geminiApiKey')));

  useEffect(() => {
    const syncWithServer = async () => {
      try {
        if (openRouterKey && useOpenRouter) {
          await fetch('/api/settings/openrouter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: openRouterKey, model: openRouterModel })
          });
        }
      } catch (e) {
        console.error('Error syncing settings:', e);
      }
    };
    syncWithServer();
  }, []);

  const handleSaveSettings = async () => {
    try {
      await fetch('/api/settings/openrouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: openRouterKey, model: openRouterModel })
      });

      localStorage.setItem('openRouterKey', obfuscate(openRouterKey));
      localStorage.setItem('openRouterModel', openRouterModel);
      localStorage.setItem('useOpenRouter', String(useOpenRouter));
      localStorage.setItem('fallbackToOpenRouter', String(fallbackToOpenRouter));
      localStorage.setItem('geminiApiKey', obfuscate(geminiApiKey));
      setShowSettings(false);
    } catch (err) {
      console.error('Falha ao salvar configurações no servidor:', err);
      // Fallback to local storage only if server fails
      localStorage.setItem('openRouterKey', obfuscate(openRouterKey));
      localStorage.setItem('openRouterModel', openRouterModel);
      localStorage.setItem('useOpenRouter', String(useOpenRouter));
      localStorage.setItem('fallbackToOpenRouter', String(fallbackToOpenRouter));
      localStorage.setItem('geminiApiKey', obfuscate(geminiApiKey));
      setShowSettings(false);
    }
  };

  const handleDownload = () => {
    if (!result?.imageUrl) return;
    const link = document.createElement('a');
    link.href = result.imageUrl;
    link.download = `criativo-${products[0]?.name.toLowerCase().replace(/\s+/g, '-') || 'ads'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!result?.imageUrl) return;
    try {
      if (navigator.share) {
        const response = await fetch(result.imageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'criativo.png', { type: 'image/png' });

        await navigator.share({
          title: result.headline,
          text: result.caption,
          files: [file],
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(result.imageUrl);
        alert('Link da imagem copiado para a área de transferência!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
      // Fallback if sharing files is not supported
      await navigator.clipboard.writeText(result.imageUrl);
      alert('Link da imagem copiado para a área de transferência!');
    }
  };

  const handleFetchProduct = async (index: number) => {
    const product = products[index];
    if (!product.url) return;
    setIsFetchingIndex(index);
    setError(null);
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: product.url }),
      });

      if (!response.ok) {
        throw new Error('Falha ao buscar informações do produto. Verifique o link.');
      }

      const data = await response.json();

      setProducts(prev => prev.map((p, i) => {
        if (i !== index) return p;
        return {
          ...p,
          name: data.title || p.name,
          techData: data.description || p.techData,
          image: data.base64Image ? {
            file: new File([], 'product.png', { type: data.mimeType || 'image/png' }),
            preview: `data:${data.mimeType || 'image/png'};base64,${data.base64Image}`,
            base64: data.base64Image
          } : p.image
        };
      }));
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar informações do produto.');
    } finally {
      setIsFetchingIndex(null);
    }
  };

  const addProduct = () => {
    if (products.length >= 2) return; // Limit to 2 for now as per user images
    setProducts([...products, {
      id: Math.random().toString(36).substr(2, 9),
      image: { file: null, preview: null, base64: null },
      name: '',
      url: '',
      techData: '',
      price: '',
      badge: 'none'
    }]);
  };

  const removeProduct = (index: number) => {
    if (products.length <= 1) return;
    setProducts(products.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, updates: Partial<ProductData>) => {
    setProducts(prev => prev.map((p, i) => i === index ? { ...p, ...updates } : p));
  };

  const generateWithOpenRouter = async (prompt: string, images: { mimeType: string, data: string }[]) => {
    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt,
        images,
        model: openRouterModel
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenRouter Response Error:", errorData);
      throw new Error(errorData.error?.message || errorData.error || `Erro de IA: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Some models return just the JSON string, others might wrap it in markdown
    if (typeof content === 'string' && content.includes('```json')) {
      const match = content.match(/```json\n([\s\S]*?)\n```/);
      if (match) return match[1];
    }

    return content;
  };

  const handleGenerate = async () => {
    const invalidProducts = products.filter(p => !p.image.base64 || !p.name);
    if (invalidProducts.length > 0) {
      setError('Por favor, certifique-se de que todos os produtos tenham imagem e nome informados.');
      return;
    }

    setIsGenerating(true);
    setGenerationStep(bgImage.base64 ? 'Analisando imagens...' : 'Gerando cenário ideal...');
    setError(null);

    try {
      // 1. Determine API Key
      let apiKey = geminiApiKey || process.env.GEMINI_API_KEY || "";

      // Ensure API key is selected for Gemini 3.1 models if in AI Studio
      if (!apiKey && typeof window !== 'undefined' && (window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await (window as any).aistudio.openSelectKey();
        }
        apiKey = await (window as any).aistudio.getSelectedApiKey();
      }

      const effectiveUseOpenRouter = useOpenRouter || (fallbackToOpenRouter && !apiKey && openRouterKey.trim());

      if (!apiKey && !effectiveUseOpenRouter) {
        setError('Configuração Incompleta: Adicione uma chave do Gemini ou habilite o fallback para OpenRouter nas configurações.');
        setIsGenerating(false);
        return;
      }

      if (!apiKey && effectiveUseOpenRouter) {
        // We need a dummy or the SDK will throw before we even decide to use it for images
        // Some proxies or specific setups might work, but standard SDK needs a string.
        // If we only use OpenRouter for copy, we'll hit an error later at image step.
      }

      const ai = apiKey ? new GoogleGenAI({ apiKey: apiKey }) : null;

      const stylePrompt = {
        gastronomia_premium: `Premium Gastronomy Banner. Background matching the product, dark tones, professionally blurred bokeh.
        Colors: Deep black, graphite gray.
        Lighting: Soft highlights, illuminated reflections on the edges, bright front studio light on the stainless steel product.
        Layout: Product positioned center right.
        Elements: Minimalist technical icons in gold. Sophisticated and imposing atmosphere.`,
        experiencia_vip: `VIP Experience and High Impact. Scene in accordance with the cinematic product.
          High dramatic contrast.
          Colors: Typography in pure red and white. Product in silver stainless steel. Icons according to the product type.
          Visuals: Product in the foreground, centered on the right, with studio lighting. Sensory details: subtle smoke/fire/cold frost effects all in accordance with the product.
          Props: Realistic context, all in accordance with the product. Asymmetrical composition.`
      }[selectedStyle];

      const formatDetails = FORMATS.find(f => f.id === activeFormat)!;

      // 1. Generate Copy and Visual Strategy
      setGenerationStep('Criando estratégia de copy...');

      const copyParts: any[] = [];
      const imagesForOpenRouter: { mimeType: string, data: string }[] = [];

      if (bgImage.base64) {
        copyParts.push({ inlineData: { mimeType: bgImage.file!.type, data: bgImage.base64 } });
        imagesForOpenRouter.push({ mimeType: bgImage.file!.type, data: bgImage.base64 });
      }

      products.forEach((product, idx) => {
        if (product.image.base64) {
          const mimeType = product.image.file?.type || 'image/png';
          copyParts.push({ inlineData: { mimeType, data: product.image.base64 } });
          imagesForOpenRouter.push({ mimeType, data: product.image.base64 });
        }
      });

      if (logoImage.base64) {
        copyParts.push({ inlineData: { mimeType: logoImage.file!.type, data: logoImage.base64 } });
        imagesForOpenRouter.push({ mimeType: logoImage.file!.type, data: logoImage.base64 });
      }

      const promptText = `
        ROLE: Você é o motor de inteligência de vendas e direção de arte do AdCreative AI. Sua missão é transformar inputs técnicos e simples em campanhas multimodais de alta conversão.
        
        INPUTS:
        - PRODUTOS:
        ${products.map((p, i) => `
          Produto ${i + 1}:
          - Nome: ${p.name || 'Pendente'}
          - Valor: ${p.price || 'Não informado'}
          - Selo: ${p.badge !== 'none' ? BADGE_OPTIONS.find(b => b.id === p.badge)?.prompt : 'Nenhum'}
          - Dados Técnicos: ${p.techData || 'Não fornecidos'}
        `).join('\n')}
        - ESTILO SELECIONADO: ${selectedStyle} (${stylePrompt})
        - FORMATO: ${formatDetails.name} (${formatDetails.desc})
        
        LÓGICA DE EXECUÇÃO:
        1. FILTRO DE BENEFÍCIOS: Para cada produto, extraia vantagens funcionais e benefícios emocionais.
        2. COMPOSIÇÃO: ${products.length > 1 ? 'Como há mais de um produto, organize-os LADO A LADO simetricamente no banner.' : 'Organize o produto de forma centralizada ou ligeiramente à direita.'}
        3. SELEÇÃO DE FRAMEWORK: Use PAS, AIDA ou BAB conforme a natureza dos produtos.
        
        DIRETRIZES DE OUTPUT:
        - Headline: Gancho magnético que una os produtos ou foque na categoria.
        - Visual Description: Crie um prompt detalhado em INGLÊS para geração de imagem seguindo:
          - Sujeitos: Descrição fotorrealista dos ${products.length} produtos. ${products.length > 1 ? 'Eles devem estar posicionados lado a lado.' : ''}
          - Especificações Técnicas de Design:
            ${selectedStyle === 'gastronomia_premium' ? `
            - Atmosfera: Cozinha industrial luxuosa, tons de preto/grafite.
            - Detalhes: Elementos decorativos em ouro metálico (ornate gold borders).
            ` : `
            - Atmosfera: Evento exclusivo/VIP, bokeh noturno, tons de roxo/azul/dourado.
            - Detalhes: Efeito de fumaça fria/gelo (cold smoke/fog).
            `}
          - Layout: ${products.length > 1 ? 'SPLIT SCREEN ou SIDE-BY-SIDE layout. Cada produto com seu respectivo bloco de preço e título.' : 'Single product layout.'}
          - Elementos de Preço: 
            ${products.map((p, i) => p.price ? `Inclua o valor "${p.price}" próximo ao Produto ${i + 1}. Selo: ${p.badge}.` : '').join('\n')}
        
        Responda estritamente em JSON:
        {
          "headline": "Título magnético",
          "benefits": ["Benefício Emocional 1", "Benefício Emocional 2", "Benefício Emocional 3"],
          "cta": "Chamada clara e urgente",
          "caption": "Legenda persuasiva para redes sociais (se post)",
          "hashtags": ["#tag1", "#tag2"],
          "visualDescription": "PROMPT EM INGLÊS DETALHADO PARA O GERADOR DE IMAGEM",
          "backgroundKeywords": "3 a 5 keywords em inglês para busca de cenário"
        }
      `;

      let adData;
      if (effectiveUseOpenRouter && openRouterKey.trim()) {
        console.log('Using OpenRouter for copy generation...');

        // Use a stable multimodal model for analysis/copy if the selected model is an image generator
        const isImageModel = openRouterModel.includes('banana') || openRouterModel.includes('-image');
        const copyModel = isImageModel ? 'google/gemini-2.0-flash-001' : openRouterModel;

        if (isImageModel) console.log(`Redirecting copy generation to ${copyModel} for better vision analysis...`);

        const response = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: promptText,
            images: imagesForOpenRouter,
            model: copyModel
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Erro no OpenRouter (Copy): ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        let jsonStr = content;
        if (typeof content === 'string' && content.includes('```json')) {
          const match = content.match(/```json\n([\s\S]*?)\n```/);
          if (match) jsonStr = match[1];
        }

        adData = JSON.parse(jsonStr);
      } else if (ai) {
        console.log('Using Gemini directly for copy generation...');
        const copyResponse = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: [{ role: 'user', parts: [...copyParts, { text: promptText }] }],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
                cta: { type: Type.STRING },
                caption: { type: Type.STRING },
                hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                visualDescription: { type: Type.STRING },
                backgroundKeywords: { type: Type.STRING },
              },
              required: ["headline", "benefits", "cta", "caption", "hashtags", "visualDescription", "backgroundKeywords"]
            }
          }
        });
        adData = JSON.parse(copyResponse.text);
      } else {
        throw new Error('Nenhum serviço de IA disponível para geração de copy.');
      }

      // 2. Fetch Real Background if needed
      let finalBgBase64 = bgImage.base64;
      let finalBgMime = bgImage.file?.type || 'image/jpeg';

      if (!finalBgBase64 && adData.backgroundKeywords) {
        setGenerationStep('Buscando cenário real...');
        try {
          const keywords = encodeURIComponent(adData.backgroundKeywords);
          const [width, height] = formatDetails.ratio.split(':').map(Number);
          const w = width > height ? 1200 : 1080;
          const h = Math.round(w * (height / width));

          // Using a more reliable way to fetch images that might have CORS issues
          // We use our local proxy to avoid CORS errors in the browser
          const imageUrl = `/api/proxy-image?url=${encodeURIComponent(`https://loremflickr.com/${w}/${h}/${keywords}`)}`;

          const imgRes = await fetch(imageUrl);
          if (!imgRes.ok) throw new Error('Failed to fetch image');
          const blob = await imgRes.blob();

          const reader = new FileReader();
          finalBgBase64 = await new Promise((resolve, reject) => {
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          finalBgMime = blob.type;
        } catch (err) {
          // Silent fallback to AI generation to avoid cluttering the UI with warnings
          console.log('Background fetch failed, will use AI generation instead.');
        }
      }

      // 3. Generate the Final Composition
      setGenerationStep('Compondo arte visual com textos...');

      const imageParts: any[] = [];
      if (finalBgBase64) {
        imageParts.push({ inlineData: { mimeType: finalBgMime, data: finalBgBase64 } });
      }

      products.forEach(p => {
        if (p.image.base64) {
          imageParts.push({ inlineData: { mimeType: p.image.file?.type || 'image/png', data: p.image.base64 } });
        }
      });

      if (logoImage.base64) {
        imageParts.push({ inlineData: { mimeType: logoImage.file?.type || 'image/png', data: logoImage.base64 } });
      }

      const visualPrompt = `Professional ${formatDetails.name} advertisement. 
        Aspect ratio: ${formatDetails.ratio}.
        Style: ${stylePrompt}.
        
        IMAGE GENERATION PROMPT:
        ${adData.visualDescription}
        
        COMPOSITION & INTEGRATION:
        ${finalBgBase64 ? 'Seamlessly integrate the product from the second image into the background of the first image.' : 'CRITICAL: Create a complete, immersive, and detailed environment as described in the prompt above. DO NOT use a plain white or solid color background. The background must have depth, realistic textures, and environmental details that make the product pop.'}
        ${logoImage.base64 ? 'Discreetly place the company logo (from the third image) in a professional position (corner).' : ''}
        
        TEXT RENDERING (MANDATORY):
        Render these elements with professional typography:
        1. HEADLINE: "${adData.headline}" - Large, impactful, top/center-top.
        2. BENEFITS: ${adData.benefits.map(b => `• ${b}`).join(' ')} - Clear, legible.
        ${products.map((p, i) => p.price ? `- PRICE FOR ${p.name || `PRODUCT ${i + 1}`}: "${p.price}" - Highlighted with premium style. ${p.badge !== 'none' ? `Include badge text for "${BADGE_OPTIONS.find(b => b.id === p.badge)?.prompt}".` : ''}` : '').join('\n')}
        - CTA BUTTON: "${adData.cta}" - Bottom center.
        
        Final image must be high-resolution, premium e-commerce quality, with all text perfectly legible.`;

      const isBanner = activeFormat === 'banner';
      // Use real models instead of placeholders
      const imageModel = isBanner ? 'gemini-2.0-pro' : 'gemini-2.0-flash';

      let imageUrl = '';

      if (!effectiveUseOpenRouter && ai) {
        const imageResponse = await ai.models.generateContent({
          model: imageModel,
          contents: { parts: [...imageParts, { text: visualPrompt }] },
          config: {
            imageConfig: {
              aspectRatio: formatDetails.ratio as any,
              ...(isBanner ? { imageSize: "1K" } : {})
            },
          },
        });

        const candidate = imageResponse.candidates?.[0];

        if (candidate?.content?.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData) {
              imageUrl = `data:image/png;base64,${part.inlineData.data}`;
              break;
            }
          }
        }

        if (!imageUrl) {
          const finishReason = candidate?.finishReason;
          if (finishReason === 'SAFETY') {
            throw new Error('A geração foi bloqueada pelos filtros de segurança. Tente mudar o produto ou o estilo.');
          }
          throw new Error('O modelo não retornou uma imagem. Tente novamente com um estilo diferente ou menos texto.');
        }
      } else if (effectiveUseOpenRouter && openRouterKey.trim()) {
        console.log('Using OpenRouter for image generation...');
        const orImageResponse = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: visualPrompt + "\n\nIMPORTANT: You MUST generate and return the final image based on the prompt above.",
            images: imageParts.map(p => ({ mimeType: p.inlineData.mimeType, data: p.inlineData.data })),
            model: openRouterModel,
            isImage: true,
            aspectRatio: formatDetails.ratio
          })
        });

        if (!orImageResponse.ok) {
          const errorData = await orImageResponse.json();
          throw new Error(`Erro no OpenRouter (Imagem): ${errorData.error || orImageResponse.statusText}`);
        }

        const orData = await orImageResponse.json();
        const message = orData.choices?.[0]?.message;
        const content = message?.content;

        console.log('OpenRouter Response:', JSON.stringify(orData).substring(0, 200));

        // 1. Check for images array (OpenRouter/Gemini specific format)
        if (message?.images && Array.isArray(message.images) && message.images.length > 0) {
          const firstImg = message.images[0];
          if (typeof firstImg === 'string') {
            imageUrl = firstImg.startsWith('data:') ? firstImg : `data:image/png;base64,${firstImg}`;
          } else if (firstImg && typeof firstImg === 'object') {
            const potentialUrl = (firstImg as any).url || (firstImg as any).image_url?.url || (firstImg as any).data;
            if (potentialUrl && typeof potentialUrl === 'string') {
              imageUrl = potentialUrl.startsWith('data:') || potentialUrl.startsWith('http')
                ? potentialUrl
                : `data:image/png;base64,${potentialUrl}`;
            }
          }
        }

        // 2. Try to find image in message.parts (Gemini/OpenRouter specific)
        if (!imageUrl && message?.parts && Array.isArray(message.parts)) {
          for (const part of message.parts) {
            if (part.type === 'image_url' && part.image_url?.url) {
              imageUrl = part.image_url.url;
              break;
            }
            if (part.inline_data?.data) {
              imageUrl = `data:${part.inline_data.mime_type || 'image/png'};base64,${part.inline_data.data}`;
              break;
            }
            if (part.inlineData?.data) {
              imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
              break;
            }
          }
        }

        // 3. Try to find in message.content if it's an array (OpenAI Multimodal style)
        if (!imageUrl && Array.isArray(content)) {
          for (const item of content) {
            if (item.type === 'image_url' && item.image_url?.url) {
              imageUrl = item.image_url.url;
              break;
            }
          }
        }

        // 4. Check for standard OpenAI image response format if nested
        if (!imageUrl && orData.data?.[0]?.url) {
          imageUrl = orData.data[0].url;
        } else if (!imageUrl && orData.data?.[0]?.b64_json) {
          imageUrl = `data:image/png;base64,${orData.data[0].b64_json}`;
        }

        // 5. Try to find base64 in content string
        if (!imageUrl && typeof content === 'string') {
          const base64Match = content.match(/data:image\/[a-zA-Z]*;base64,[^\s"']+/);
          if (base64Match) {
            imageUrl = base64Match[0];
          } else if (content.length > 1000 && /^[A-Za-z0-9+/=]+$/.test(content.trim())) {
            imageUrl = `data:image/png;base64,${content.trim()}`;
          }
        }

        // 6. Check for Bounding Box / Spatial output (Common Gemini failure for image gen)
        if (!imageUrl && typeof content === 'string' && (content.includes('box_2d') || content.includes('["box_2d"]'))) {
          throw new Error(`O modelo "${openRouterModel}" retornou coordenadas de detecção em vez de uma imagem. Esse modelo geralmente não gera imagens via API de chat se o parâmetro 'modalities' não estiver configurado corretamente ou se o modelo não suportar. Tente o modelo "google/gemini-2.5-flash-image".`);
        }

        if (!imageUrl) {
          console.error('Failed to extract image. Full response:', orData);
          throw new Error(`O modelo do OpenRouter não retornou uma imagem. Resposta: ${typeof content === 'string' ? content.substring(0, 100) : 'Formato desconhecido'}. Verifique se você está usando um modelo que suporta geração de imagem (ex: Gemini Nano Banana).`);
        }
      } else {
        throw new Error('Geração de imagem requer uma chave do Gemini (Google AI Studio) ou configuração correta do OpenRouter.');
      }

      setResult({ ...adData, imageUrl });
    } catch (err: any) {
      console.error('Generation Error:', err);

      const errorStr = JSON.stringify(err);
      const errorMessage = err.message || '';

      if (errorMessage.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED') || errorStr.includes('429')) {
        setError('Limite de Uso Atingido (Erro 429): O Google Gemini gratuito tem um limite de requisições por minuto. Ação: Aguarde cerca de 60 segundos e clique em "Gerar Criativo" novamente. Se o erro persistir, considere usar uma chave de API paga.');
      } else if (errorMessage.includes('403') || errorStr.includes('PERMISSION_DENIED')) {
        setError('Acesso Negado (Erro 403): Sua chave de API não tem permissão para este modelo avançado ou o faturamento não está ativo. Ação: Clique no ícone de engrenagem (Configurações) e selecione uma chave de um "Projeto Pago" (Paid Project) no Google Cloud. Certifique-se de que o faturamento está habilitado em console.cloud.google.com.');
        // Prompt user to select key again if permission is denied
        if (typeof window !== 'undefined' && (window as any).aistudio) {
          (window as any).aistudio.openSelectKey();
        }
      } else if (errorMessage.includes('imageConfig.aspectRatio')) {
        setError('Formato não suportado: O tamanho selecionado não é compatível com o modelo de imagem atual. Ação: Tente usar o formato "Post (1:1)" ou mude o estilo visual para algo mais simples.');
      } else if (errorStr.includes('SAFETY') || errorMessage.includes('SAFETY')) {
        setError('Conteúdo Bloqueado por Segurança: Nossos filtros identificaram algo sensível na imagem ou no texto. Ação: Tente usar uma foto diferente do produto, remova termos sensíveis da descrição ou mude o estilo para "Minimalist".');
      } else if (errorMessage.includes('OpenRouter')) {
        setError(`Erro no OpenRouter: ${errorMessage}. Ação: Verifique se sua chave do OpenRouter é válida e se você tem créditos suficientes.`);
      } else {
        setError(`Ops! Algo deu errado: ${errorMessage || 'Falha ao processar as imagens.'} Ação: Verifique sua conexão, se as fotos não são muito pesadas (use arquivos menores que 2MB) ou tente usar um estilo diferente.`);
      }
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] font-sans selection:bg-[#5A5A40] selection:text-white pb-20">
      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black/5 rounded-xl flex items-center justify-center">
                    <Settings size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Configurações</h2>
                    <p className="text-xs text-black/40">Personalize sua experiência</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe size={16} className="text-black/40" />
                      <span className="text-sm font-medium">Usar OpenRouter</span>
                    </div>
                    <button
                      onClick={() => setUseOpenRouter(!useOpenRouter)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        useOpenRouter ? "bg-[#5A5A40]" : "bg-black/10"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        useOpenRouter ? "left-7" : "left-1"
                      )} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-2">
                      <History size={16} className="text-black/40" />
                      <span className="text-sm font-medium">Fallback p/ OpenRouter</span>
                    </div>
                    <button
                      onClick={() => setFallbackToOpenRouter(!fallbackToOpenRouter)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        fallbackToOpenRouter ? "bg-[#5A5A40]" : "bg-black/10"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        fallbackToOpenRouter ? "left-7" : "left-1"
                      )} />
                    </button>
                  </div>

                  {useOpenRouter && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-1">OpenRouter API Key</label>
                        <input
                          type="password"
                          placeholder="sk-or-v1-..."
                          className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all"
                          value={openRouterKey}
                          onChange={(e) => setOpenRouterKey(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-1">Modelo OpenRouter</label>
                        <div className="space-y-2">
                          <select
                            className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all appearance-none"
                            value={RECOMMENDED_OR_MODELS.some(m => m.id === openRouterModel) ? openRouterModel : 'custom'}
                            onChange={(e) => {
                              if (e.target.value !== 'custom') setOpenRouterModel(e.target.value);
                            }}
                          >
                            {RECOMMENDED_OR_MODELS.map(model => (
                              <option key={model.id} value={model.id}>{model.name}</option>
                            ))}
                            <option value="custom">Outro (digitar abaixo)...</option>
                          </select>

                          {(!RECOMMENDED_OR_MODELS.some(m => m.id === openRouterModel)) && (
                            <input
                              type="text"
                              placeholder="ex: google/gemini-2.0-flash-001"
                              className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all animate-in fade-in"
                              value={openRouterModel}
                              onChange={(e) => setOpenRouterModel(e.target.value)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 pt-4 border-t border-black/5">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-black/40" />
                      <span className="text-sm font-medium">Google Gemini</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-1">Gemini API Key</label>
                      <input
                        type="password"
                        placeholder="Insira sua chave do Google AI Studio..."
                        className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all"
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                      />
                      <p className="text-[10px] text-black/40 leading-relaxed">
                        Obtenha sua chave gratuita em <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[#5A5A40] hover:underline">aistudio.google.com</a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                className="w-full bg-[#1A1A1A] text-white py-4 rounded-xl font-semibold hover:bg-black active:scale-[0.98] transition-all"
              >
                Salvar Configurações
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="border-b border-black/10 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1A1A1A] rounded-lg flex items-center justify-center text-white">
              <Sparkles size={18} />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">AdCreative AI</h1>
          </div>

          {/* Format Switcher */}
          <div className="flex bg-[#F5F5F0] p-1 rounded-xl border border-black/5">
            {FORMATS.map((format) => (
              <button
                key={format.id}
                onClick={() => { setActiveFormat(format.id as AdFormat); setResult(null); }}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                  activeFormat === format.id
                    ? "bg-white text-black shadow-sm"
                    : "text-black/40 hover:text-black/60"
                )}
              >
                {format.name}
              </button>
            ))}
          </div>

          <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-black/60">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-black/5 hover:bg-black/5 transition-colors text-black/80"
            >
              <Settings size={16} />
              Configurações
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Inputs Section */}
          <section className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-serif font-medium tracking-tight">
                Criador de {activeFormat === 'post' ? 'Posts' : activeFormat === 'stories' ? 'Stories' : 'Banners'}
              </h2>
              <p className="text-black/60">
                {activeFormat === 'post'
                  ? 'Formato quadrado ideal para Instagram e redes sociais.'
                  : activeFormat === 'stories'
                    ? 'Formato vertical ideal para Stories, Reels e TikTok.'
                    : 'Formato panorâmico ideal para sites, blogs e cabeçalhos.'}
              </p>
            </div>

            <div className="space-y-8 bg-white p-8 rounded-3xl shadow-sm border border-black/5">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-black/40">Produtos</h3>
                  {activeFormat === 'banner' && products.length < 2 && (
                    <button
                      onClick={addProduct}
                      className="text-xs font-bold text-[#5A5A40] hover:underline flex items-center gap-1"
                    >
                      + Adicionar Produto
                    </button>
                  )}
                </div>

                {products.map((product, index) => (
                  <div key={product.id} className="space-y-4 p-4 border border-black/5 rounded-2xl relative bg-[#FBFBFA]">
                    {products.length > 1 && (
                      <button
                        onClick={() => removeProduct(index)}
                        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-black/5 text-black/40 hover:bg-red-50 hover:text-red-500 transition-all z-10"
                      >
                        <X size={14} />
                      </button>
                    )}

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 flex items-center gap-2">
                        <Globe size={12} /> Link do Produto {products.length > 1 ? `#${index + 1}` : ''}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="Cole o link do produto aqui..."
                          className="flex-1 bg-white border border-black/5 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all"
                          value={product.url}
                          onChange={(e) => updateProduct(index, { url: e.target.value })}
                        />
                        <button
                          onClick={() => handleFetchProduct(index)}
                          disabled={isFetchingIndex === index || !product.url}
                          className={cn(
                            "px-4 rounded-xl font-semibold transition-all flex items-center gap-2",
                            isFetchingIndex === index || !product.url
                              ? "bg-black/5 text-black/20 cursor-not-allowed"
                              : "bg-[#5A5A40] text-white hover:bg-[#4A4A30]"
                          )}
                        >
                          {isFetchingIndex === index ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                          <span className="hidden sm:inline">Buscar</span>
                        </button>
                      </div>
                    </div>

                    {product.image.preview && (
                      <div className="p-3 bg-white rounded-xl border border-black/5 flex gap-3 items-center">
                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-black/5 bg-white shrink-0 relative">
                          <img src={product.image.preview} className="w-full h-full object-cover" alt="Product Preview" />
                          {product.badge !== 'none' && (
                            <div className={cn(
                              "absolute top-0 right-0 text-[7px] px-1.5 py-0.5 rounded-bl-lg font-bold shadow-sm animate-in fade-in zoom-in-50 whitespace-nowrap",
                              product.badge === 'promo' ? "bg-red-600 text-white" :
                              product.badge === '12x' ? "bg-emerald-600 text-white" :
                              "bg-black text-white"
                            )}>
                              {BADGE_OPTIONS.find(b => b.id === product.badge)?.label.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <input
                            className="text-sm font-bold truncate w-full bg-transparent focus:outline-none"
                            value={product.name}
                            onChange={(e) => updateProduct(index, { name: e.target.value })}
                            placeholder="Nome do produto"
                          />
                          <p className="text-[10px] text-black/40 line-clamp-1 mt-1">{product.techData || 'Descrição detectada...'}</p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 flex items-center gap-2">
                          <Banknote size={12} /> Valor
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: R$ 4.500,00"
                          className="w-full bg-white border border-black/5 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all"
                          value={product.price}
                          onChange={(e) => updateProduct(index, { price: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 flex items-center gap-2">
                          <Tag size={12} /> Selo
                        </label>
                        <div className="flex gap-1">
                          {BADGE_OPTIONS.map((badge) => (
                            <button
                              key={badge.id}
                              onClick={() => updateProduct(index, { badge: badge.id as any })}
                              className={cn(
                                "flex-1 py-2 px-1 rounded-lg border text-[9px] font-bold flex flex-col items-center gap-0.5 transition-all",
                                product.badge === badge.id
                                  ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
                                  : "border-black/5 bg-white text-black/40 hover:border-black/20"
                              )}
                            >
                              <badge.icon size={12} />
                              {badge.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Style Selector */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-black/40 flex items-center gap-2">
                  <Palette size={14} /> Estilo Visual
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id as AdStyle)}
                      className={cn(
                        "p-2 rounded-xl border text-left transition-all group overflow-hidden",
                        selectedStyle === style.id
                          ? "border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-md"
                          : "border-black/5 bg-[#F9F9F9] hover:border-black/20"
                      )}
                    >
                      <div className="aspect-square w-full rounded-lg overflow-hidden mb-2 relative">
                        <img
                          src={style.preview}
                          alt={style.name}
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className={cn(
                          "absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity",
                          selectedStyle === style.id && "opacity-100 bg-[#5A5A40]/40"
                        )}>
                          <style.icon size={16} className="text-white" />
                        </div>
                      </div>
                      <p className="text-[10px] font-bold leading-tight px-1">{style.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className={cn(
                  "w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all",
                  isGenerating
                    ? "bg-black/10 text-black/40 cursor-not-allowed"
                    : "bg-[#1A1A1A] text-white hover:bg-black active:scale-[0.98] shadow-lg shadow-black/10"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    {generationStep}
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Gerar Criativo {STYLES.find(s => s.id === selectedStyle)?.name}
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Result Section */}
          <section className="relative">
            {!result && !isGenerating && (
              <div className="h-full min-h-[600px] border-2 border-dashed border-black/10 rounded-3xl flex flex-col items-center justify-center text-black/30 p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center">
                  <Layout size={32} />
                </div>
                <div>
                  <p className="font-medium text-black/60">Seu {activeFormat} aparecerá aqui</p>
                  <p className="text-sm">Escolha o estilo e envie as fotos</p>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="h-full min-h-[600px] bg-white rounded-3xl shadow-sm border border-black/5 flex flex-col items-center justify-center p-12 text-center space-y-6 animate-pulse">
                <div className={cn(
                  "w-full bg-black/5 rounded-2xl mb-8",
                  activeFormat === 'post' ? "aspect-square" :
                    activeFormat === 'stories' ? "aspect-[9/16]" :
                      activeFormat === 'banner' ? "aspect-[144/41]" : "aspect-[3.2/1]"
                )} />
                <div className="flex flex-col items-center gap-4 w-full">
                  <div className="h-4 w-3/4 bg-black/5 rounded-full" />
                  <div className="h-4 w-1/2 bg-black/5 rounded-full" />
                  <p className="text-sm font-medium text-black/40 mt-4">{generationStep}</p>
                </div>
              </div>
            )}

            {result && !isGenerating && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-white p-4 rounded-[2rem] shadow-xl border border-black/5">
                  <div className={cn(
                    "relative rounded-2xl overflow-hidden bg-black/5 group",
                    activeFormat === 'post' ? "aspect-square" :
                      activeFormat === 'stories' ? "aspect-[9/16]" :
                        activeFormat === 'banner' ? "aspect-[144/41]" : "aspect-[3.2/1]"
                  )}>
                    {result.imageUrl ? (
                      <img
                        src={result.imageUrl}
                        alt="Ad Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-black/20">
                        Erro ao carregar imagem
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={handleDownload}
                        className="p-2 hover:bg-black/5 rounded-lg transition-colors text-black/60"
                        title="Baixar Imagem"
                      >
                        <Download size={20} />
                      </button>
                      <button
                        onClick={handleShare}
                        className="p-2 hover:bg-black/5 rounded-lg transition-colors text-black/60"
                        title="Compartilhar"
                      >
                        <Share2 size={20} />
                      </button>
                    </div>
                    <button
                      onClick={handleGenerate}
                      className="text-sm font-semibold flex items-center gap-2 text-[#5A5A40] hover:underline"
                    >
                      <RefreshCw size={16} /> Regerar
                    </button>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-black/40">Headline</h3>
                    <p className="text-xl font-serif font-medium">{result.headline}</p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-black/40">Destaques (Benefícios Emocionais)</h3>
                    <ul className="space-y-2">
                      {result.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-black/70">
                          <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-black/40">Copy Estruturada</h3>
                    <div className="bg-[#F9F9F9] p-4 rounded-xl text-sm text-black/80 whitespace-pre-wrap italic">
                      {result.caption}
                      {activeFormat === 'post' && result.hashtags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {result.hashtags.map((tag, i) => (
                            <span key={i} className="text-[#5A5A40] font-bold">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-black/40">Chamada para Ação (CTA)</h3>
                    <div className="bg-[#5A5A40] text-white p-3 rounded-xl text-center font-bold text-sm">
                      {result.cta}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="border-t border-black/5 py-12 mt-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm text-black/40">© 2024 AdCreative AI. Powered by Gemini.</p>
          <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-black/40">
            <a href="#" className="hover:text-black transition-colors">Termos</a>
            <a href="#" className="hover:text-black transition-colors">Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
