import { Layout, CheckCircle2, Download, Share2, RefreshCw } from 'lucide-react';
import { AdFormat, AdResult } from '../types';
import { cn } from '../lib/utils';

interface ResultSectionProps {
    result: AdResult | null;
    isGenerating: boolean;
    generationStep: string;
    activeFormat: AdFormat;
    handleDownload: () => void;
    handleShare: () => Promise<void>;
    handleGenerate: () => Promise<void>;
}

export function ResultSection({
    result,
    isGenerating,
    generationStep,
    activeFormat,
    handleDownload,
    handleShare,
    handleGenerate
}: ResultSectionProps) {
    return (
        <section className="relative">
            {!result && !isGenerating && (
                <div className="h-full min-h-[600px] border-2 border-dashed border-black/10 rounded-3xl flex flex-col items-center justify-center text-black/30 p-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center">
                        <Layout size={32} />
                    </div>
                    <div>
                        <p className="font-medium text-black/60">Seu visual aparecerá aqui</p>
                        <p className="text-sm">Escolha o estilo e envie as informações</p>
                    </div>
                </div>
            )}

            {isGenerating && (
                <div className="h-full min-h-[600px] bg-white rounded-3xl shadow-sm border border-black/5 flex flex-col items-center justify-center p-12 text-center space-y-6 animate-pulse">
                    <div className={cn(
                        "w-full bg-black/5 rounded-2xl mb-8",
                        activeFormat === 'post' ? "aspect-square" :
                            activeFormat === 'stories' ? "aspect-[9/16]" :
                                activeFormat === 'banner' ? "aspect-[4/1]" : "aspect-[3.2/1]"
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
                                    activeFormat === 'banner' ? "aspect-[4/1]" : "aspect-[3.2/1]"
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
                                {activeFormat === 'post' && result.hashtags && result.hashtags.length > 0 && (
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
    );
}
