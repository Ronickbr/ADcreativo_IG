/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
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
  Building,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type AdStyle = 'realistic' | 'infographic' | 'handlettering' | 'doodle' | 'blueprint' | 'knolling' | 'exploded' | 'anatomy' | 'grunge' | 'cyberpunk' | 'minimalist' | 'vintage' | 'popart' | 'nature' | 'luxury';
type AdFormat = 'post' | 'banner' | 'stories';

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

const STYLES = [
  { id: 'realistic', name: 'Realista', icon: Camera, desc: 'Composição fotográfica profissional' },
  { id: 'infographic', name: 'Infográfico', icon: Layout, desc: 'Ilustrado com dados e setas' },
  { id: 'handlettering', name: 'Hand-Lettering', icon: TypeIcon, desc: 'Tipografia artística manual' },
  { id: 'doodle', name: 'Doodle / Sketch', icon: PenTool, desc: 'Estilo desenho à mão e rascunho' },
  { id: 'blueprint', name: 'Blueprint', icon: FileText, desc: 'Projeto técnico em fundo azul' },
  { id: 'knolling', name: 'Knolling', icon: Layout, desc: 'Organização simétrica de peças' },
  { id: 'exploded', name: 'Exploded View', icon: Sparkles, desc: 'Vista explodida das partes' },
  { id: 'anatomy', name: 'Anatomy', icon: MousePointer2, desc: 'Anatomia detalhada do produto' },
  { id: 'grunge', name: 'Grunge / Colagem', icon: Palette, desc: 'Estilo Mixed Media urbano' },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: Zap, desc: 'Neon, futurista e vibrante' },
  { id: 'minimalist', name: 'Minimalista', icon: Square, desc: 'Limpo, sombras suaves e foco' },
  { id: 'vintage', name: 'Vintage', icon: History, desc: 'Retrô, granulado e nostálgico' },
  { id: 'popart', name: 'Pop Art', icon: Palette, desc: 'Cores vibrantes e estilo HQ' },
  { id: 'nature', name: 'Natureza', icon: Leaf, desc: 'Orgânico, plantas e luz natural' },
  { id: 'luxury', name: 'Luxo', icon: Crown, desc: 'Premium, elegante e sofisticado' },
];

const FORMATS = [
  { id: 'post', name: 'Post Instagram', ratio: '1:1', desc: '1080 x 1080 px' },
  { id: 'stories', name: 'Stories / Reels', ratio: '9:16', desc: '1080 x 1920 px' },
  { id: 'banner', name: 'Banner Web', ratio: '16:9', desc: '1200 x 675 px' },
] as const;

export default function App() {
  const [activeFormat, setActiveFormat] = useState<AdFormat>('post');
  const [bgImage, setBgImage] = useState<ImageState>({ file: null, preview: null, base64: null });
  const [prodImage, setProdImage] = useState<ImageState>({ file: null, preview: null, base64: null });
  const [logoImage, setLogoImage] = useState<ImageState>({ file: null, preview: null, base64: null });
  const [productName, setProductName] = useState('');
  const [techData, setTechData] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<AdStyle>('realistic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [result, setResult] = useState<AdResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [showSettings, setShowSettings] = useState(false);
  const [openRouterKey, setOpenRouterKey] = useState(() => localStorage.getItem('openRouterKey') || '');
  const [useOpenRouter, setUseOpenRouter] = useState(() => localStorage.getItem('useOpenRouter') === 'true');

  const bgInputRef = useRef<HTMLInputElement>(null);
  const prodInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'bg' | 'prod' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 4MB for better reliability)
    if (file.size > 4 * 1024 * 1024) {
      setError('A imagem é muito grande. Por favor, use arquivos menores que 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      const preview = reader.result as string;
      const state = { file, preview, base64 };
      if (type === 'bg') setBgImage(state);
      else if (type === 'prod') setProdImage(state);
      else setLogoImage(state);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = (type: 'bg' | 'prod' | 'logo') => {
    if (type === 'bg') setBgImage({ file: null, preview: null, base64: null });
    else if (type === 'prod') setProdImage({ file: null, preview: null, base64: null });
    else setLogoImage({ file: null, preview: null, base64: null });
  };

  const handleSaveSettings = () => {
    localStorage.setItem('openRouterKey', openRouterKey);
    localStorage.setItem('useOpenRouter', String(useOpenRouter));
    setShowSettings(false);
  };

  const generateWithOpenRouter = async (prompt: string, images: { mimeType: string, data: string }[]) => {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "AdCreative AI",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemini-3-flash-preview", 
        "messages": [
          {
            "role": "user",
            "content": [
              { "type": "text", "text": prompt },
              ...images.map(img => ({
                "type": "image_url",
                "image_url": {
                  "url": `data:${img.mimeType};base64,${img.data}`
                }
              }))
            ]
          }
        ],
        "response_format": { "type": "json_object" }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Erro na API do OpenRouter");
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  };

  const handleGenerate = async () => {
    if (!prodImage.base64 || !productName) {
      setError('Por favor, envie a imagem do produto e informe o nome.');
      return;
    }

    setIsGenerating(true);
    setGenerationStep(bgImage.base64 ? 'Analisando imagens...' : 'Gerando cenário ideal...');
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const stylePrompt = {
        realistic: "Realista, composição de estúdio fotográfico",
        infographic: "Infográfico ilustrado, com ícones, setas e elementos gráficos informativos",
        handlettering: "Hand-lettering digital, tipografia artística feita à mão, estilo caligráfico moderno",
        doodle: "Doodle art, estilo sketch/rascunho, desenhos divertidos ao redor do produto",
        blueprint: "Blueprint técnico, desenho de engenharia em fundo azul ciano com linhas brancas e medidas",
        knolling: "Estilo Knolling, organização simétrica e ortogonal de componentes do produto em uma superfície plana",
        exploded: "Vista explodida (Exploded View), mostrando as partes internas e componentes do produto flutuando em ordem de montagem",
        anatomy: "Anatomia do produto, com rótulos detalhados apontando para partes específicas e explicando funções",
        grunge: "Estilo Grunge e Colagem (Mixed Media), texturas urbanas, recortes de jornal, elementos sobrepostos e visual artístico rebelde",
        cyberpunk: "Estilo Cyberpunk, luzes neon (azul, rosa, roxo), ambiente futurista noturno, alta tecnologia e visual vibrante",
        minimalist: "Estilo Minimalista, fundo limpo com cores pastéis ou neutras, sombras suaves, foco total no produto e muito espaço negativo",
        vintage: "Estilo Vintage/Retrô, estética dos anos 70/80, cores levemente desbotadas, textura de filme granulado e visual nostálgico",
        popart: "Estilo Pop Art, cores vibrantes e contrastantes, estilo história em quadrinhos, pontos Ben-Day e visual gráfico ousado",
        nature: "Estilo Natureza/Orgânico, muitos elementos naturais como plantas, luz solar filtrada, texturas de madeira ou pedra",
        luxury: "Estilo Luxo/Premium, detalhes em ouro ou prata, tecidos nobres como veludo ou seda, iluminação dramática e elegante"
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
      copyParts.push({ inlineData: { mimeType: prodImage.file!.type, data: prodImage.base64 } });
      imagesForOpenRouter.push({ mimeType: prodImage.file!.type, data: prodImage.base64 });
      
      if (logoImage.base64) {
        copyParts.push({ inlineData: { mimeType: logoImage.file!.type, data: logoImage.base64 } });
        imagesForOpenRouter.push({ mimeType: logoImage.file!.type, data: logoImage.base64 });
      }
      
      const promptText = `
        Você é um Especialista em Social Media Ads. Analise a imagem do PRODUTO acima.
        ${bgImage.base64 ? 'Considere também a imagem de BACKGROUND fornecida como cenário base.' : 'NÃO foi fornecida uma imagem de fundo. Você deve descrever um cenário ideal que combine perfeitamente com o produto e o estilo escolhido.'}
        ${logoImage.base64 ? 'Foi fornecida uma imagem de LOGO da empresa. Ela deve ser incorporada discretamente na arte final.' : ''}
        
        NOME DO PRODUTO: ${productName}
        DADOS TÉCNICOS: ${techData || 'Não fornecidos'}
        ESTILO VISUAL DESEJADO: ${stylePrompt}
        FORMATO: ${formatDetails.name} (${formatDetails.desc})
        
        OBJETIVO:
        Criar a estratégia de copy e visual para um ${formatDetails.name} no estilo ${selectedStyle}.
        
        DIRETRIZES:
        - Headline impactante condizente com o estilo ${selectedStyle} e o formato ${activeFormat}.
        - Transforme dados técnicos em benefícios.
        ${activeFormat === 'post' ? '- Crie uma legenda com hashtags.' : '- NÃO é necessário legenda nem hashtags para banners.'}
        - Descreva exatamente como o produto deve ser integrado ao cenário usando o estilo ${selectedStyle}.
        ${activeFormat === 'banner' ? '- Para banners, os benefícios (destaques) DEVEM ser incorporados visualmente na própria imagem.' : ''}
        
        Responda estritamente em JSON:
        {
          "headline": "Título",
          "benefits": ["b1", "b2", "b3"],
          "cta": "CTA",
          "caption": "${activeFormat === 'post' ? 'Legenda' : ''}",
          "hashtags": [${activeFormat === 'post' ? '"#tag1", "#tag2"' : ''}],
          "visualDescription": "Instruções detalhadas de composição visual para o estilo ${selectedStyle} no formato ${activeFormat}. Se não houver fundo, descreva o cenário a ser gerado.",
          "backgroundKeywords": "3 a 5 palavras-chave em inglês para buscar um cenário real no Unsplash (ex: luxury office, modern kitchen, tropical beach)"
        }
      `;

      let adData;
      if (useOpenRouter && openRouterKey) {
        const openRouterResponse = await generateWithOpenRouter(promptText, imagesForOpenRouter);
        adData = JSON.parse(openRouterResponse);
      } else {
        const copyResponse = await ai.models.generateContent({
          model: "gemini-3.1-pro-preview",
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
      }

      // 2. Fetch Real Background if needed
      let finalBgBase64 = bgImage.base64;
      let finalBgMime = bgImage.file?.type || 'image/jpeg';

      if (!finalBgBase64 && adData.backgroundKeywords) {
        setGenerationStep('Buscando cenário real no Unsplash...');
        try {
          const keywords = encodeURIComponent(adData.backgroundKeywords);
          const [width, height] = formatDetails.ratio.split(':').map(Number);
          const w = width > height ? 1200 : 1080;
          const h = Math.round(w * (height / width));
          
          // Using a reliable public image service that doesn't require API keys for simple keyword search
          const unsplashUrl = `https://loremflickr.com/${w}/${h}/${keywords}`;
          const imgRes = await fetch(unsplashUrl);
          const blob = await imgRes.blob();
          
          const reader = new FileReader();
          finalBgBase64 = await new Promise((resolve) => {
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(blob);
          });
          finalBgMime = blob.type;
        } catch (err) {
          console.warn('Failed to fetch Unsplash image, falling back to AI generation:', err);
        }
      }

      // 3. Generate the Final Composition
      setGenerationStep('Compondo arte visual com textos...');
      
      const imageParts: any[] = [];
      if (finalBgBase64) {
        imageParts.push({ inlineData: { mimeType: finalBgMime, data: finalBgBase64 } });
      }
      imageParts.push({ inlineData: { mimeType: prodImage.file!.type, data: prodImage.base64 } });
      
      if (logoImage.base64) {
        imageParts.push({ inlineData: { mimeType: logoImage.file!.type, data: logoImage.base64 } });
      }
      
      const visualPrompt = `Professional ${formatDetails.name} advertisement in ${stylePrompt} style. 
        Aspect ratio is ${formatDetails.ratio}.
        
        COMPOSITION:
        ${finalBgBase64 ? 'Integrate the product from the second image into the background of the first image.' : 'Create a professional background for the product based on the visual strategy.'}
        ${logoImage.base64 ? 'Place the company logo (from the third image) in a professional position, usually a corner.' : ''}
        Visual Strategy: ${adData.visualDescription}.
        
        TEXT RENDERING (CRITICAL):
        You MUST render the following text elements directly on the image with professional typography:
        1. HEADLINE: "${adData.headline}" - Large, impactful, positioned at the top or center-top.
        2. BENEFITS: ${adData.benefits.map(b => `• ${b}`).join(' ')} - Smaller text, positioned clearly.
        3. CTA BUTTON: A professional button with the text "${adData.cta}" at the bottom.
        
        STYLE DETAILS:
        ${selectedStyle === 'infographic' ? 'Add illustrated arrows and tech labels.' : ''}
        ${selectedStyle === 'handlettering' ? 'Use artistic hand-drawn typography for the text.' : ''}
        ${selectedStyle === 'doodle' ? 'Add creative hand-drawn doodles and sketches around the product.' : ''}
        ${selectedStyle === 'blueprint' ? 'Transform the image into a technical blueprint with cyan background and white schematic lines.' : ''}
        ${selectedStyle === 'knolling' ? 'Arrange product parts in a neat, symmetrical grid on a clean surface.' : ''}
        ${selectedStyle === 'exploded' ? 'Show the product disassembled with parts floating in space.' : ''}
        ${selectedStyle === 'anatomy' ? 'Add anatomical callouts and labels explaining the internal components.' : ''}
        ${selectedStyle === 'grunge' ? 'Apply mixed media collage textures, paper tears, and urban grunge filters.' : ''}
        ${selectedStyle === 'cyberpunk' ? 'Add neon lights, futuristic UI elements, and high-tech atmosphere.' : ''}
        ${selectedStyle === 'minimalist' ? 'Keep it extremely clean, soft shadows, and elegant negative space.' : ''}
        ${selectedStyle === 'vintage' ? 'Apply retro film grain, warm nostalgic colors, and vintage textures.' : ''}
        ${selectedStyle === 'popart' ? 'Use bold halftone patterns, comic book speech bubbles, and high contrast colors.' : ''}
        ${selectedStyle === 'nature' ? 'Surround with organic elements like leaves, water, or natural sunlight.' : ''}
        ${selectedStyle === 'luxury' ? 'Add premium textures like marble, gold, or velvet with high-end lighting.' : ''}
        
        Maintain high resolution, premium e-commerce aesthetic. Ensure all text is perfectly legible and well-integrated into the design.`;

      const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [...imageParts, { text: visualPrompt }] },
        config: {
          imageConfig: {
            aspectRatio: formatDetails.ratio as any,
          },
        },
      });

      let imageUrl = '';
      for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (!imageUrl) {
        throw new Error('Não foi possível gerar a imagem final. Tente novamente.');
      }

      setResult({ ...adData, imageUrl });
    } catch (err: any) {
      console.error('Generation Error:', err);
      
      const errorMessage = err.message || '';
      if (errorMessage.includes('429') || JSON.stringify(err).includes('RESOURCE_EXHAUSTED')) {
        setError('Limite de uso atingido. Aguarde um minuto e tente novamente.');
      } else if (errorMessage.includes('imageConfig.aspectRatio')) {
        setError('O formato selecionado não é suportado pelo modelo atual. Tente o formato Post.');
      } else {
        setError(`Erro: ${errorMessage || 'Falha na geração do criativo. Tente usar imagens menores ou outro estilo.'}`);
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

                  {useOpenRouter && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-1">OpenRouter API Key</label>
                      <input
                        type="password"
                        placeholder="sk-or-v1-..."
                        className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all"
                        value={openRouterKey}
                        onChange={(e) => setOpenRouterKey(e.target.value)}
                      />
                      <p className="text-[10px] text-black/40 leading-relaxed">
                        Ao ativar, o modelo <strong>Gemini 2.0 Flash</strong> via OpenRouter será usado para a estratégia de copy.
                      </p>
                    </div>
                  )}
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

            <div className="space-y-6 bg-white p-8 rounded-3xl shadow-sm border border-black/5">
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
                        "p-3 rounded-xl border text-left transition-all group",
                        selectedStyle === style.id 
                          ? "border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-md" 
                          : "border-black/5 bg-[#F9F9F9] hover:border-black/20"
                      )}
                    >
                      <style.icon size={16} className={cn("mb-1.5", selectedStyle === style.id ? "text-white" : "text-black/40")} />
                      <p className="text-[10px] font-bold leading-tight">{style.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Uploaders */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40 flex items-center gap-2">
                    <ImageIcon size={14} /> Background (Opcional)
                  </label>
                  <div 
                    onClick={() => bgInputRef.current?.click()}
                    className={cn(
                      "aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group",
                      bgImage.preview ? "border-transparent" : "border-black/10 hover:border-[#5A5A40]/40 hover:bg-[#F9F9F9]"
                    )}
                  >
                    {bgImage.preview ? (
                      <>
                        <img src={bgImage.preview} className="w-full h-full object-cover" alt="BG Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Upload className="text-white" size={24} />
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); clearImage('bg'); }}
                          className="absolute top-2 right-2 p-1 bg-white/90 rounded-full shadow-sm hover:bg-white"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <Upload className="mx-auto text-black/20 mb-2" size={24} />
                        <p className="text-[10px] font-bold text-black/40 uppercase">Cenário Real</p>
                        <p className="text-[8px] text-black/30 mt-1">Vazio = Busca Unsplash</p>
                      </div>
                    )}
                    <input type="file" ref={bgInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'bg')} />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40 flex items-center gap-2">
                    <Camera size={14} /> Produto
                  </label>
                  <div 
                    onClick={() => prodInputRef.current?.click()}
                    className={cn(
                      "aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group",
                      prodImage.preview ? "border-transparent" : "border-black/10 hover:border-[#5A5A40]/40 hover:bg-[#F9F9F9]"
                    )}
                  >
                    {prodImage.preview ? (
                      <>
                        <img src={prodImage.preview} className="w-full h-full object-cover" alt="Prod Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Upload className="text-white" size={24} />
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); clearImage('prod'); }}
                          className="absolute top-2 right-2 p-1 bg-white/90 rounded-full shadow-sm hover:bg-white"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <Upload className="mx-auto text-black/20 mb-2" size={24} />
                        <p className="text-[10px] font-bold text-black/40 uppercase">Equipamento</p>
                      </div>
                    )}
                    <input type="file" ref={prodInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'prod')} />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40 flex items-center gap-2">
                    <Building size={14} /> Logo Empresa (Opcional)
                  </label>
                  <div 
                    onClick={() => logoInputRef.current?.click()}
                    className={cn(
                      "aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group",
                      logoImage.preview ? "border-transparent" : "border-black/10 hover:border-[#5A5A40]/40 hover:bg-[#F9F9F9]"
                    )}
                  >
                    {logoImage.preview ? (
                      <>
                        <img src={logoImage.preview} className="w-full h-full object-cover" alt="Logo Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Upload className="text-white" size={24} />
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); clearImage('logo'); }}
                          className="absolute top-2 right-2 p-1 bg-white/90 rounded-full shadow-sm hover:bg-white"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <Upload className="mx-auto text-black/20 mb-2" size={24} />
                        <p className="text-[10px] font-bold text-black/40 uppercase">Sua Logo</p>
                      </div>
                    )}
                    <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-black/40 flex items-center gap-2">
                  <TypeIcon size={14} /> Nome do Produto
                </label>
                <input
                  type="text"
                  placeholder="Ex: Furadeira de Impacto Profissional"
                  className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-black/40 flex items-center gap-2">
                  <FileText size={14} /> Dados Técnicos
                </label>
                <textarea
                  placeholder="Ex: Motor brushless, 2500 RPM..."
                  className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all min-h-[80px] resize-none"
                  value={techData}
                  onChange={(e) => setTechData(e.target.value)}
                />
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
                  activeFormat === 'post' ? "aspect-square" : "aspect-video"
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
                    activeFormat === 'post' ? "aspect-square" : "aspect-video"
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
                      <button className="p-2 hover:bg-black/5 rounded-lg transition-colors text-black/60">
                        <Download size={20} />
                      </button>
                      <button className="p-2 hover:bg-black/5 rounded-lg transition-colors text-black/60">
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
                    <h3 className="text-xs font-bold uppercase tracking-widest text-black/40">Destaques</h3>
                    <ul className="space-y-2">
                      {result.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-black/70">
                          <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {activeFormat === 'post' && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-black/40">Legenda e Hashtags</h3>
                      <div className="bg-[#F9F9F9] p-4 rounded-xl text-sm text-black/80 whitespace-pre-wrap italic">
                        {result.caption}
                        <div className="mt-4 flex flex-wrap gap-2">
                          {result.hashtags.map((tag, i) => (
                            <span key={i} className="text-[#5A5A40] font-bold">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
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
