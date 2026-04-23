/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { cn } from './lib/utils';
import { AdFormat, AdStyle, ImageState, STYLES } from './types';
import { useProductScraper } from './hooks/useProductScraper';
import { useAdGenerator } from './hooks/useAdGenerator';

import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { ProductInput } from './components/ProductInput';
import { StyleSelector } from './components/StyleSelector';
import { ResultSection } from './components/ResultSection';

export default function App() {
  const [activeFormat, setActiveFormat] = useState<AdFormat>('post');
  const [bgImage, setBgImage] = useState<ImageState>({ file: null, preview: null, base64: null });
  const [logoImage, setLogoImage] = useState<ImageState>({ file: null, preview: null, base64: null });

  const [selectedStyle, setSelectedStyle] = useState<AdStyle>('realistic');

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [openRouterKey, setOpenRouterKey] = useState(() => localStorage.getItem('openRouterKey') || '');

  // Custom Hooks
  const {
    productUrl,
    setProductUrl,
    productName,
    setProductName,
    techData,
    setTechData,
    isFetchingProduct,
    prodImage,
    setProdImage,
    fetchProduct,
    error: scraperError,
    setError: setScraperError,
    resetProduct
  } = useProductScraper();

  const {
    isGenerating,
    generationStep,
    result,
    setResult,
    generateAd
  } = useAdGenerator({
    openRouterKey,
    productName,
    techData,
    selectedStyle,
    activeFormat,
    bgImage,
    prodImage,
    logoImage,
    onError: setScraperError
  });

  const handleSaveSettings = () => {
    localStorage.setItem('openRouterKey', openRouterKey);
    setShowSettings(false);
  };

  const handleDownload = () => {
    if (!result?.imageUrl) return;
    const link = document.createElement('a');
    link.href = result.imageUrl;
    link.download = `criativo-${productName.toLowerCase().replace(/\s+/g, '-') || 'ads'}.png`;
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
        await navigator.clipboard.writeText(result.imageUrl);
        alert('Link da imagem copiado para a área de transferência!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
      await navigator.clipboard.writeText(result.imageUrl);
      alert('Link da imagem copiado para a área de transferência!');
    }
  };

  const handleFormatChange = () => {
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] font-sans selection:bg-[#5A5A40] selection:text-white pb-20">
      <SettingsModal
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        openRouterKey={openRouterKey}
        setOpenRouterKey={setOpenRouterKey}
        onSave={handleSaveSettings}
      />

      <Header
        activeFormat={activeFormat}
        setActiveFormat={setActiveFormat}
        setShowSettings={setShowSettings}
        onFormatChange={handleFormatChange}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Inputs Section */}
          <section className="space-y-6 sm:space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-serif font-medium tracking-tight">
                Criador de {activeFormat === 'post' ? 'Posts' : activeFormat === 'stories' ? 'Stories' : 'Banners'}
              </h2>
              <p className="text-black/60 text-sm sm:text-base">
                {activeFormat === 'post'
                  ? 'Formato quadrado ideal para Instagram e redes sociais.'
                  : activeFormat === 'stories'
                    ? 'Formato vertical ideal para Stories, Reels e TikTok.'
                    : 'Formato panorâmico ideal para sites, blogs e cabeçalhos.'}
              </p>
            </div>

            <div className="space-y-6 bg-white p-5 sm:p-8 rounded-3xl shadow-sm border border-black/5">
              <ProductInput
                productUrl={productUrl}
                setProductUrl={setProductUrl}
                isFetchingProduct={isFetchingProduct}
                handleFetchProduct={fetchProduct}
                prodImage={prodImage}
                setProdImage={setProdImage}
                productName={productName}
                setProductName={setProductName}
                techData={techData}
                setTechData={setTechData}
                resetProduct={resetProduct}
              />

              <StyleSelector
                selectedStyle={selectedStyle}
                setSelectedStyle={setSelectedStyle}
              />

              {scraperError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{scraperError}</span>
                </div>
              )}

              <button
                onClick={generateAd}
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
          <ResultSection
            result={result}
            isGenerating={isGenerating}
            generationStep={generationStep}
            activeFormat={activeFormat}
            handleDownload={handleDownload}
            handleShare={handleShare}
            handleGenerate={generateAd}
          />
        </div>
      </main>

      <footer className="border-t border-black/5 py-8 sm:py-12 mt-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
          <p className="text-sm text-black/40">© 2025 ADCreativo IG. Powered by OpenRouter.</p>
          <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-black/40">
            <a href="#" className="hover:text-black transition-colors">Termos</a>
            <a href="#" className="hover:text-black transition-colors">Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
