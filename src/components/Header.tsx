import { Sparkles, Settings } from 'lucide-react';
import { AdFormat, FORMATS } from '../types';
import { cn } from '../lib/utils';

interface HeaderProps {
    activeFormat: AdFormat;
    setActiveFormat: (format: AdFormat) => void;
    setShowSettings: (show: boolean) => void;
    onFormatChange: () => void;
}

export function Header({ activeFormat, setActiveFormat, setShowSettings, onFormatChange }: HeaderProps) {
    return (
        <header className="border-b border-black/10 bg-white/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 shrink-0">
                    <div className="w-8 h-8 bg-[#1A1A1A] rounded-lg flex items-center justify-center text-white">
                        <Sparkles size={18} />
                    </div>
                    <h1 className="text-lg font-semibold tracking-tight hidden sm:block">ADCreativo IG</h1>
                </div>

                {/* Format Switcher */}
                <div className="flex bg-[#F5F5F0] p-1 rounded-xl border border-black/5 overflow-x-auto no-scrollbar">
                    {FORMATS.map((format) => (
                        <button
                            key={format.id}
                            onClick={() => {
                                setActiveFormat(format.id as AdFormat);
                                onFormatChange();
                            }}
                            className={cn(
                                "px-3 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                                activeFormat === format.id
                                    ? "bg-white text-black shadow-sm"
                                    : "text-black/40 hover:text-black/60"
                            )}
                        >
                            {format.name}
                        </button>
                    ))}
                </div>

                {/* Settings - visível em todos os tamanhos */}
                <button
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border border-black/5 hover:bg-black/5 transition-colors text-black/80 shrink-0"
                    title="Configurações"
                >
                    <Settings size={16} />
                    <span className="hidden sm:inline text-sm font-medium">Configurações</span>
                </button>
            </div>
        </header>
    );
}
