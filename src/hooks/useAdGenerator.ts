import { useState } from 'react';
import { AdFormat, AdResult, AdStyle, FORMATS, ImageState, STYLES } from '../types';

interface UseAdGeneratorProps {
    openRouterKey: string;
    productName: string;
    techData: string;
    selectedStyle: AdStyle;
    activeFormat: AdFormat;
    bgImage: ImageState;
    prodImage: ImageState;
    logoImage: ImageState;
    onError: (error: string) => void;
}

interface UseAdGeneratorReturn {
    isGenerating: boolean;
    generationStep: string;
    result: AdResult | null;
    setResult: (result: AdResult | null) => void;
    generateAd: () => Promise<void>;
}

const TIMEOUT_MS = 120_000; // 2 minutos

const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs = TIMEOUT_MS): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
};

const generateTextWithOpenRouter = async (
    prompt: string,
    images: { mimeType: string; data: string }[],
    openRouterKey: string
) => {
    const response = await fetchWithTimeout(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openRouterKey.trim()}`,
                "HTTP-Referer": window.location.origin,
                "X-Title": "ADCreativo IG",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            ...images.map(img => ({
                                type: "image_url",
                                image_url: {
                                    url: `data:${img.mimeType};base64,${img.data}`
                                }
                            }))
                        ]
                    }
                ],
                response_format: { type: "json_object" }
            })
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Erro na API do OpenRouter (${response.status})`);
    }

    const data = await response.json();
    const textContent = data.choices?.[0]?.message?.content;
    if (!textContent) throw new Error("Resposta de texto vazia da API.");

    // O content pode ser string JSON ou já um objeto
    if (typeof textContent === 'string') {
        return JSON.parse(textContent);
    }
    return textContent;
};

/**
 * Extrai a URL/data-URL da imagem da resposta do OpenRouter.
 * Suporta múltiplos formatos de resposta: inline_data, image_url, parts array, markdown, etc.
 */
const extractImageFromResponse = (data: any): string | null => {
    const message = data.choices?.[0]?.message;
    if (!message) return null;

    // 1. Campo 'images' direto (formato OpenRouter para modelos de imagem)
    if (message.images && Array.isArray(message.images) && message.images.length > 0) {
        const firstImage = message.images.find((img: any) => img.type === 'image_url' || img.image_url);
        if (firstImage?.image_url?.url) return firstImage.image_url.url;
    }

    let content = message.content;

    // 2. Content é um array de parts (multipart response)
    if (Array.isArray(content)) {
        for (const part of content) {
            // image_url part
            if (part.type === 'image_url' && part.image_url?.url) {
                return part.image_url.url;
            }
            // inline_data part (formato Gemini nativo via OpenRouter)
            if (part.type === 'inline_data' && part.inline_data) {
                return `data:${part.inline_data.mime_type || 'image/png'};base64,${part.inline_data.data}`;
            }
            // image part com data direto
            if (part.type === 'image' && part.data) {
                return `data:${part.mime_type || 'image/png'};base64,${part.data}`;
            }
        }
        // Fallback: procurar texto com URL nos parts de texto
        const textPart = content.find((p: any) => p.type === 'text');
        content = textPart ? textPart.text : null;
    }

    if (!content || typeof content !== 'string') return null;

    // 3. Se já é um data-URL ou URL HTTP direta
    if (content.trim().startsWith('data:image/')) return content.trim();
    if (content.trim().startsWith('http')) return content.trim();

    // 4. Extrair de markdown ou texto
    const urlMatch = content.match(/!\[.*?\]\((.*?)\)/) || content.match(/(https?:\/\/[^\s"]+)/);
    if (urlMatch?.[1]) return urlMatch[1];

    // 5. Tentar extrair base64 bruto (sem prefixo data:)
    const base64Match = content.match(/([A-Za-z0-9+/]{100,}={0,2})/);
    if (base64Match?.[1]) return `data:image/png;base64,${base64Match[1]}`;

    return null;
};

const generateImageWithOpenRouter = async (
    visualPrompt: string,
    productImgBase64: string | null,
    openRouterKey: string
) => {
    const userContent = productImgBase64
        ? [
            {
                type: "text",
                text: `${visualPrompt}. CRITICAL: Use the attached image as the SOLE reference for the product. KEEP THE PRODUCT IDENTICAL (shape, logo, controls). Change only the background, lighting and environment to match the requested style.`
            },
            {
                type: "image_url",
                image_url: { url: `data:image/png;base64,${productImgBase64}` }
            }
        ]
        : visualPrompt;

    const response = await fetchWithTimeout(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openRouterKey.trim()}`,
                "HTTP-Referer": window.location.origin,
                "X-Title": "ADCreativo IG",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "google/gemini-2.5-flash-image",
                messages: [{ role: "user", content: userContent }],
                modalities: ["image", "text"]
            })
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Erro na geração de imagem (${response.status})`);
    }

    const data = await response.json();
    const imageUrl = extractImageFromResponse(data);

    if (!imageUrl) {
        console.error("OpenRouter Response sem imagem:", JSON.stringify(data, null, 2));
        throw new Error("A API não retornou uma imagem. Verifique se o modelo suporta geração de imagem e tente novamente.");
    }

    return imageUrl;
};

export function useAdGenerator({
    openRouterKey,
    productName,
    techData,
    selectedStyle,
    activeFormat,
    bgImage,
    prodImage,
    logoImage,
    onError
}: UseAdGeneratorProps): UseAdGeneratorReturn {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStep, setGenerationStep] = useState<string>('');
    const [result, setResult] = useState<AdResult | null>(null);

    const generateAd = async () => {
        if (!prodImage.base64 || !productName) {
            onError('Por favor, envie a imagem do produto e informe o nome.');
            return;
        }

        if (!openRouterKey.trim()) {
            onError('A Chave da API do OpenRouter é obrigatória. Configure-a clicando no ícone de Configurações no topo da página.');
            return;
        }

        setIsGenerating(true);
        setGenerationStep(bgImage.base64 ? 'Analisando imagens...' : 'Preparando geração...');

        try {
            const stylePrompt = STYLES.find(s => s.id === selectedStyle)?.desc || "Realistic, professional studio photography";
            const formatDetails = FORMATS.find(f => f.id === activeFormat)!;

            // 1. Gerar Copy e Estratégia Visual
            setGenerationStep('Criando copy estratégica via IA...');

            const imagesForAnalysis: { mimeType: string; data: string }[] = [];
            if (bgImage.base64) imagesForAnalysis.push({ mimeType: bgImage.file?.type || 'image/png', data: bgImage.base64 });
            if (prodImage.base64) imagesForAnalysis.push({ mimeType: prodImage.file?.type || 'image/png', data: prodImage.base64 });
            if (logoImage.base64) imagesForAnalysis.push({ mimeType: logoImage.file?.type || 'image/png', data: logoImage.base64 });

            const promptText = `
ROLE: Você é um Diretor de Arte e Copywriter Senior especialista em E-commerce e Performance. Sua missão é criar uma campanha visualmente impecável e persuasiva para o produto descrito abaixo.

INPUTS:
- PRODUTO: ${productName}
- DESCRIÇÃO/DADOS TÉCNICOS: ${techData || 'Não fornecidos'}
- ESTILO VISUAL: ${selectedStyle} (${stylePrompt})
- FORMATO DO ANÚNCIO: ${formatDetails.name} (${formatDetails.desc})

INSTRUÇÕES DE ANÁLISE (Multimodal):
1. ANALISE O FORMATO FÍSICO: Identifique se o produto é de PISO (alto, grande, industrial), BANCADA (pequeno, compacto, para mesas) ou PORTÁTIL.
2. FOCO EM SILHUETA: Descreva a proporção básica (ex: "tall vertical floor Fryer" ou "compact cube countertop fryer"). NUNCA mude o formato original detectado.
3. DETALHES TÉCNICOS: Identifique material (aço inox, plástico, etc), cor, acabamento e botões/detalhes visíveis.
4. Determine o público-alvo e use frameworks PAS, AIDA ou BAB.

DIRETRIZES DE CRIATIVO VISUAL (visualDescription):
- Sua missão agora é incluir a Headline e os Benefícios como elementos flutuantes ou sobrepostos (gráficos) na imagem.
- O prompt para geração de imagem DEVE SER EM INGLÊS e descrever a composição publicitária completa.
- TEXTO: Inclua instruções como "Text overlay of the headline '[HEADLINE]' in large premium bold fonts" e "Minimalist icons or bullet points for [BENEFITS] in a clean layout".
- COMPOSIÇÃO: Posicione o texto no terço superior ou lateral, garantindo que NÃO cubra o produto.
- FIDELIDADE: Comece com "A [FLOOR-STANDING/TABLETOP] product..." mantendo o formato original detectado.
- ILUMINAÇÃO: Use termos como "cinematic lighting", "rim light", "product focus" e o estilo ${selectedStyle}.

SAÍDA ESPERADA (JSON):
{
  "headline": "Slogan magnético | Nome do Produto",
  "benefits": ["Destaque 1", "Destaque 2", "Destaque 3"],
  "cta": "Chamada para ação",
  "caption": "Legenda persuasiva para redes sociais",
  "hashtags": ["#ecommerce", "#style"],
  "visualDescription": "FULL AD COMPOSITION IN ENGLISH: INCLUDES PRODUCT FIDELITY, SCENE DETAILS, AND GRAPHIC TEXT OVERLAYS (HEADLINE & BENEFITS)",
  "backgroundKeywords": "moodboard keywords"
}`;

            let adData;
            try {
                adData = await generateTextWithOpenRouter(promptText, imagesForAnalysis, openRouterKey);
            } catch (err: any) {
                throw new Error(`Erro ao gerar copy: ${err.message}`);
            }

            // 2. Gerar imagem final
            setGenerationStep('Gerando a arte visual final (pode levar até 1 min)...');

            let imageUrl = '';
            try {
                const visualPrompt = `${adData.visualDescription}. Format: ${formatDetails.name}, Aspect ratio ${formatDetails.ratio}. High-end commercial production.`;
                imageUrl = await generateImageWithOpenRouter(visualPrompt, prodImage.base64, openRouterKey);
            } catch (err: any) {
                throw new Error(`Erro ao gerar imagem: ${err.message}`);
            }

            if (!imageUrl || (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:'))) {
                throw new Error('A API não retornou uma URL de imagem válida.');
            }

            setResult({ ...adData, imageUrl });
        } catch (err: any) {
            console.error('Generation Error:', err);
            const errorMessage = err.message || '';

            if (err.name === 'AbortError') {
                onError('A requisição excedeu o tempo limite (2 min). Tente novamente.');
            } else if (errorMessage.includes('429')) {
                onError('Limite de Uso Atingido (Erro 429). Aguarde alguns instantes e tente novamente.');
            } else if (errorMessage.includes('403') || errorMessage.includes('401')) {
                onError('Acesso Negado. Verifique se sua OpenRouter API Key está correta nas Configurações.');
            } else if (errorMessage.includes('402')) {
                onError('Créditos insuficientes na sua conta OpenRouter. Adicione créditos em openrouter.ai.');
            } else {
                onError(`Ops! Algo deu errado: ${errorMessage}`);
            }
        } finally {
            setIsGenerating(false);
            setGenerationStep('');
        }
    };

    return {
        isGenerating,
        generationStep,
        result,
        setResult,
        generateAd
    };
}
