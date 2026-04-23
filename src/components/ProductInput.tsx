import { Globe, Zap, Loader2, X, Upload, Package, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageState } from '../types';
import { cn } from '../lib/utils';
import { useRef, useCallback } from 'react';

interface ProductInputProps {
    productUrl: string;
    setProductUrl: (url: string) => void;
    isFetchingProduct: boolean;
    handleFetchProduct: () => void;
    prodImage: ImageState;
    setProdImage: (image: ImageState) => void;
    productName: string;
    setProductName: (name: string) => void;
    techData: string;
    setTechData: (data: string) => void;
    resetProduct: () => void;
}

export function ProductInput({
    productUrl,
    setProductUrl,
    isFetchingProduct,
    handleFetchProduct,
    prodImage,
    setProdImage,
    productName,
    setProductName,
    techData,
    setTechData,
    resetProduct
}: ProductInputProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Separar o prefixo data:... do base64 puro
            const base64 = result.split(',')[1];
            setProdImage({
                file,
                preview: result,
                base64
            });
        };
        reader.readAsDataURL(file);
    }, [setProdImage]);

    return (
        <div className="space-y-5">
            {/* Scraper (opcional) */}
            <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-black/40 flex items-center gap-2">
                    <Globe size={14} /> Buscar por Link (Opcional)
                </label>
                <div className="flex gap-2">
                    <input
                        type="url"
                        placeholder="Cole o link do produto aqui..."
                        className="flex-1 bg-[#F9F9F9] border border-black/5 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all"
                        value={productUrl}
                        onChange={(e) => setProductUrl(e.target.value)}
                    />
                    <button
                        onClick={handleFetchProduct}
                        disabled={isFetchingProduct || !productUrl}
                        className={cn(
                            "px-5 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm",
                            isFetchingProduct || !productUrl
                                ? "bg-black/5 text-black/20 cursor-not-allowed"
                                : "bg-[#5A5A40] text-white hover:bg-[#4A4A30]"
                        )}
                    >
                        {isFetchingProduct ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                        {isFetchingProduct ? 'Buscando' : 'Buscar'}
                    </button>
                </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-black/5" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-black/30">ou preencha manualmente</span>
                <div className="flex-1 h-px bg-black/5" />
            </div>

            {/* Nome do Produto */}
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-black/40 flex items-center gap-2">
                    <Package size={14} /> Nome do Produto *
                </label>
                <input
                    type="text"
                    placeholder="Ex: Fritadeira Elétrica Industrial FT-30"
                    className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                />
            </div>

            {/* Dados Técnicos */}
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-black/40 flex items-center gap-2">
                    <FileText size={14} /> Dados Técnicos / Descrição
                </label>
                <textarea
                    placeholder="Descreva características, materiais, capacidade, diferenciais..."
                    className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all resize-none"
                    rows={3}
                    value={techData}
                    onChange={(e) => setTechData(e.target.value)}
                />
            </div>

            {/* Upload de Imagem */}
            {!prodImage.preview ? (
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-black/40 flex items-center gap-2">
                        <Upload size={14} /> Imagem do Produto *
                    </label>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-black/10 rounded-xl p-8 text-center hover:border-[#5A5A40]/30 hover:bg-[#5A5A40]/5 transition-all group"
                    >
                        <Upload size={24} className="mx-auto mb-2 text-black/20 group-hover:text-[#5A5A40]" />
                        <p className="text-sm font-medium text-black/40 group-hover:text-black/60">
                            Clique para enviar a imagem
                        </p>
                        <p className="text-[10px] text-black/30 mt-1">PNG, JPG ou WebP</p>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleImageUpload}
                    />
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-[#F9F9F9] rounded-2xl border border-black/5 flex gap-4 items-center"
                >
                    <div className="w-20 h-20 rounded-xl overflow-hidden border border-black/5 bg-white shrink-0">
                        <img src={prodImage.preview} className="w-full h-full object-cover" alt="Produto" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold truncate">{productName || 'Produto Detectado'}</h4>
                        <p className="text-[10px] text-black/40 line-clamp-2 mt-1">{techData || 'Sem descrição'}</p>
                    </div>
                    <button
                        onClick={resetProduct}
                        className="p-2 hover:bg-black/5 rounded-full transition-colors text-black/40"
                        title="Remover produto"
                    >
                        <X size={16} />
                    </button>
                </motion.div>
            )}
        </div>
    );
}
