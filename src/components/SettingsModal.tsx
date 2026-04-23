import { motion, AnimatePresence } from 'motion/react';
import { Settings, X, Key } from 'lucide-react';

interface SettingsModalProps {
    showSettings: boolean;
    setShowSettings: (show: boolean) => void;
    openRouterKey: string;
    setOpenRouterKey: (key: string) => void;
    onSave: () => void;
}

export function SettingsModal({
    showSettings,
    setShowSettings,
    openRouterKey,
    setOpenRouterKey,
    onSave
}: SettingsModalProps) {
    return (
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
                                <div className="flex items-center gap-2 mb-2">
                                    <Key size={16} className="text-[#5A5A40]" />
                                    <span className="text-sm font-medium">OpenRouter API Key</span>
                                </div>

                                <div className="space-y-2">
                                    <input
                                        type="password"
                                        placeholder="sk-or-v1-..."
                                        className="w-full bg-[#F9F9F9] border border-black/5 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all"
                                        value={openRouterKey}
                                        onChange={(e) => setOpenRouterKey(e.target.value)}
                                    />
                                    <p className="text-[10px] text-black/40 leading-relaxed text-center mt-2">
                                        A API do OpenRouter será utilizada tanto para a geração da estratégia de copy quanto para as imagens.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={onSave}
                            className="w-full bg-[#1A1A1A] text-white py-4 rounded-xl font-semibold hover:bg-black active:scale-[0.98] transition-all"
                        >
                            Salvar Configurações
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
