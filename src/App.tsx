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
  MousePointer2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type AdStyle = 'realistic' | 'infographic' | 'handlettering' | 'doodle' | 'blueprint' | 'knolling' | 'exploded' | 'anatomy' | 'grunge';
type AdFormat = 'post' | 'banner';

interface AdResult {
  headline: string;
  benefits: string[];
  cta: string;
  caption: string;
  hashtags: string[];
  visualDescription: string;
  imageUrl?: string;
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
] as const;

const FORMATS = [
  { id: 'post', name: 'Post Instagram', ratio: '1:1', desc: '1080 x 1080 px' },
  { id: 'banner', name: 'Banner Web', ratio: '4:1', desc: '1200 x 400 px' },
] as const;

export default function App() {
  const [activeFormat, setActiveFormat] = useState<AdFormat>('post');
  const [bgImage, setBgImage] = useState<ImageState>({ file: null, preview: null, base64: null });
  const [prodImage, setProdImage] = useState<ImageState>({ file: null, preview: null, base64: null });
  const [productName, setProductName] = useState('');
  const [techData, setTechData] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<AdStyle>('realistic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<AdResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bgInputRef = useRef<HTMLInputElement>(null);
  const prodInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'bg' | 'prod') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      const preview = reader.result as string;
      const state = { file, preview, base64 };
      if (type === 'bg') setBgImage(state);
      else setProdImage(state);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = (type: 'bg' | 'prod') => {
    if (type === 'bg') setBgImage({ file: null, preview: null, base64: null });
    else setProdImage({ file: null, preview: null, base64: null });
  };

  const handleGenerate = async () => {
    if (!bgImage.base64 || !prodImage.base64 || !productName) {
      setError('Por favor, envie as imagens e informe o nome do produto.');
      return;
    }

    setIsGenerating(true);
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
        grunge: "Estilo Grunge e Colagem (Mixed Media), texturas urbanas, recortes de jornal, elementos sobrepostos e visual artístico rebelde"
      }[selectedStyle];

      const formatDetails = FORMATS.find(f => f.id === activeFormat)!;

      // 1. Generate Copy and Visual Strategy
      const copyResponse = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType: bgImage.file!.type, data: bgImage.base64 } },
              { inlineData: { mimeType: prodImage.file!.type, data: prodImage.base64 } },
              { text: `
                Você é um Especialista em Social Media Ads. Analise as duas imagens acima:
                1. BACKGROUND (cenário).
                2. PRODUTO real.
                
                NOME DO PRODUTO: ${productName}
                DADOS TÉCNICOS: ${techData || 'Não fornecidos'}
                ESTILO VISUAL DESEJADO: ${stylePrompt}
                FORMATO: ${formatDetails.name} (${formatDetails.desc})
                
                OBJETIVO:
                Criar a estratégia de copy e visual para um ${formatDetails.name} no estilo ${selectedStyle}.
                
                DIRETRIZES:
                - Headline impactante condizente com o estilo ${selectedStyle} e o formato ${activeFormat}.
                - Transforme dados técnicos em benefícios.
                - Crie uma legenda com hashtags.
                - Descreva exatamente como o produto deve ser integrado ao fundo usando o estilo ${selectedStyle}.
                
                Responda estritamente em JSON:
                {
                  "headline": "Título",
                  "benefits": ["b1", "b2", "b3"],
                  "cta": "CTA",
                  "caption": "Legenda",
                  "hashtags": ["#tag1", "#tag2"],
                  "visualDescription": "Instruções detalhadas de composição visual para o estilo ${selectedStyle} no formato ${activeFormat}"
                }
              `}
            ]
          }
        ],
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
            },
            required: ["headline", "benefits", "cta", "caption", "hashtags", "visualDescription"]
          }
        }
      });

      const adData = JSON.parse(copyResponse.text);

      // 2. Generate the Final Composition
      const imageResponse = await ai.models.generateContent({
        model: activeFormat === 'banner' ? 'gemini-3.1-flash-image-preview' : 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { mimeType: bgImage.file!.type, data: bgImage.base64 } },
            { inlineData: { mimeType: prodImage.file!.type, data: prodImage.base64 } },
            {
              text: `Professional ${formatDetails.name} advertisement in ${stylePrompt} style. 
              Aspect ratio is ${formatDetails.ratio}.
              Integrate the product from the second image into the background of the first image.
              Visual Strategy: ${adData.visualDescription}.
              Style-specific details:
              ${selectedStyle === 'infographic' ? 'Add illustrated arrows and tech labels.' : ''}
              ${selectedStyle === 'handlettering' ? 'Use artistic hand-drawn typography for the text.' : ''}
              ${selectedStyle === 'doodle' ? 'Add creative hand-drawn doodles and sketches around the product.' : ''}
              ${selectedStyle === 'blueprint' ? 'Transform the image into a technical blueprint with cyan background and white schematic lines.' : ''}
              ${selectedStyle === 'knolling' ? 'Arrange product parts in a neat, symmetrical grid on a clean surface.' : ''}
              ${selectedStyle === 'exploded' ? 'Show the product disassembled with parts floating in space.' : ''}
              ${selectedStyle === 'anatomy' ? 'Add anatomical callouts and labels explaining the internal components.' : ''}
              ${selectedStyle === 'grunge' ? 'Apply mixed media collage textures, paper tears, and urban grunge filters.' : ''}
              Overlay the text: "${adData.headline}" and "${adData.cta}".
              Maintain high resolution, premium e-commerce aesthetic.`,
            },
          ],
        },
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

      setResult({ ...adData, imageUrl });
    } catch (err: any) {
      console.error(err);
      
      if (err.message?.includes('429') || err.status === 429 || JSON.stringify(err).includes('RESOURCE_EXHAUSTED')) {
        setError('Limite de uso atingido (Quota Exceeded). Por favor, aguarde um minuto antes de tentar novamente.');
      } else {
        setError('Erro ao processar criativo. Tente novamente ou use imagens menores.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] font-sans selection:bg-[#5A5A40] selection:text-white pb-20">
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

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-black/60">
            <a href="#" className="hover:text-black transition-colors">Galeria</a>
            <a href="#" className="hover:text-black transition-colors">Suporte</a>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Inputs Section */}
          <section className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-serif font-medium tracking-tight">
                Criador de {activeFormat === 'post' ? 'Posts' : 'Banners'}
              </h2>
              <p className="text-black/60">
                {activeFormat === 'post' 
                  ? 'Formato quadrado ideal para Instagram e redes sociais.' 
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/40 flex items-center gap-2">
                    <ImageIcon size={14} /> Background
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
                        <p className="text-[10px] font-bold text-black/40 uppercase">Cenário</p>
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
                    Criando {activeFormat === 'post' ? 'Post' : 'Banner'}...
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
                  activeFormat === 'post' ? "aspect-square" : "aspect-[4/1]"
                )} />
                <div className="h-4 w-3/4 bg-black/5 rounded-full" />
                <div className="h-4 w-1/2 bg-black/5 rounded-full" />
              </div>
            )}

            {result && !isGenerating && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-white p-4 rounded-[2rem] shadow-xl border border-black/5">
                  <div className={cn(
                    "relative rounded-2xl overflow-hidden bg-black/5 group",
                    activeFormat === 'post' ? "aspect-square" : "aspect-[4/1]"
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
