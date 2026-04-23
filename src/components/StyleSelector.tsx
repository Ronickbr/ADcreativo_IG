import { Palette } from 'lucide-react';
import { AdStyle, STYLES } from '../types';
import { cn } from '../lib/utils';

interface StyleSelectorProps {
    selectedStyle: AdStyle;
    setSelectedStyle: (style: AdStyle) => void;
}

export function StyleSelector({ selectedStyle, setSelectedStyle }: StyleSelectorProps) {
    return (
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
    );
}
