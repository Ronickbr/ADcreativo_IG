import { 
  Camera, 
  Image as ImageIcon, 
  FileText, 
  Sparkles, 
  Layout,
  Type as TypeIcon,
  Palette,
  PenTool,
  MousePointer2,
  Zap,
  Square,
  History,
  Leaf,
  Crown
} from 'lucide-react';

export type AdStyle = 'realistic' | 'infographic' | 'handlettering' | 'doodle' | 'blueprint' | 'knolling' | 'exploded' | 'anatomy' | 'grunge' | 'cyberpunk' | 'minimalist' | 'vintage' | 'popart' | 'nature' | 'luxury';
export type AdFormat = 'post' | 'banner' | 'stories' | 'banner_mobile';

export interface AdResult {
  headline: string;
  benefits: string[];
  cta: string;
  caption: string;
  hashtags: string[];
  visualDescription: string;
  imageUrl?: string;
  backgroundKeywords?: string;
}

export interface ImageState {
  file: File | null;
  preview: string | null;
  base64: string | null;
}

export const STYLES = [
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

export const FORMATS = [
  { id: 'post', name: 'Post Instagram', ratio: '1:1', desc: '1080 x 1080 px' },
  { id: 'stories', name: 'Stories / Reels', ratio: '9:16', desc: '1080 x 1920 px' },
  { id: 'banner', name: 'Banner Web', ratio: '4:1', desc: '1200 x 300 px' },
  { id: 'banner_mobile', name: 'Banner Mobile', ratio: '4:1', desc: '320 x 100 px' },
] as const;
