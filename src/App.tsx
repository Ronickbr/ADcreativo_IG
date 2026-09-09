import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle, Banknote, Check, CheckCircle2, Copy, Crown, Download, Globe,
  ImagePlus, LayoutTemplate, Loader2, MonitorSmartphone, Palette, Plus, RefreshCw,
  Settings, Share2, ShieldCheck, Sparkles, Tag, Trash2, Upload, WandSparkles, X, Zap,
} from "lucide-react";
import { parseJsonResponse, requestAi, type AiProvider } from "./lib/api";

type AdFormat = "post" | "stories" | "banner" | "banner_mobile";
import { buildCopyPrompt, buildImagePrompt, type AdStyle } from "./lib/adPrompts";
type Badge = "a_vista" | "12x" | "promo" | "none";
interface ImageState { file: File | null; preview: string | null; base64: string | null }
interface Product { id: string; image: ImageState; name: string; url: string; techData: string; price: string; badge: Badge }
interface AdResult { headline: string; benefits: string[]; cta: string; caption: string; hashtags: string[]; visualDescription: string; imageUrl?: string }

const emptyImage = (): ImageState => ({ file: null, preview: null, base64: null });
const emptyProduct = (): Product => ({ id: crypto.randomUUID(), image: emptyImage(), name: "", url: "", techData: "", price: "", badge: "none" });
const FORMATS = [
  { id: "post", label: "Post", ratio: "1:1", size: "1080 × 1080", icon: LayoutTemplate },
  { id: "stories", label: "Stories", ratio: "9:16", size: "1080 × 1920", icon: MonitorSmartphone },
  { id: "banner", label: "Banner web", ratio: "144:41", size: "1440 × 410", icon: LayoutTemplate },
  { id: "banner_mobile", label: "Banner mobile", ratio: "3.2:1", size: "320 × 100", icon: MonitorSmartphone },
] as const;
const STYLES = [
  { id: "gastronomia_premium", name: "Gastronomia Premium", desc: "Inox, grafite e luz editorial", icon: Crown, color: "from-amber-500/30 to-stone-950" },
  { id: "experiencia_vip", name: "Experiência VIP", desc: "Contraste, energia e impacto", icon: Zap, color: "from-red-600/40 to-stone-950" },
  { id: "vanguarda_tech", name: "Vanguarda Tech", desc: "Precisão, luz e inovação", icon: Sparkles, color: "from-cyan-500/30 to-slate-950" },
] as const;
const BADGES = [
  { id: "none", label: "Sem selo" }, { id: "a_vista", label: "À vista" },
  { id: "12x", label: "12x sem juros" }, { id: "promo", label: "Promoção" },
] as const;
const MODELS = [
  { id: "google/gemini-2.5-flash-image", label: "Nano Banana" },
  { id: "google/gemini-3.1-flash-image-preview", label: "Nano Banana 2" },
  { id: "google/gemini-3-pro-image-preview", label: "Nano Banana Pro" },
] as const;

function readImage(file: File, callback: (image: ImageState) => void) {
  if (!file.type.startsWith("image/")) throw new Error("Selecione uma imagem válida.");
  if (file.size > 8_000_000) throw new Error("A imagem deve ter no máximo 8 MB.");
  const reader = new FileReader();
  reader.onload = () => {
    const preview = String(reader.result);
    callback({ file, preview, base64: preview.split(",")[1] });
  };
  reader.readAsDataURL(file);
}

function ImageInput({ value, label, hint, onChange }: { value: ImageState; label: string; hint: string; onChange: (image: ImageState) => void }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-3">
        <label className="label">{label}</label><span className="text-[11px] text-zinc-500">{hint}</span>
      </div>
      <button type="button" onClick={() => input.current?.click()} className="upload-zone group">
        {value.preview ? <img src={value.preview} alt="" className="h-full w-full object-contain p-3" /> : (
          <><span className="icon-box"><ImagePlus size={20} /></span><span><b>Enviar imagem</b><small>PNG, JPG ou WebP</small></span></>
        )}
        {value.preview && <span onClick={(e) => { e.stopPropagation(); onChange(emptyImage()); }} className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white"><X size={14} /></span>}
      </button>
      <input ref={input} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => e.target.files?.[0] && readImage(e.target.files[0], onChange)} />
    </div>
  );
}

export default function App() {
  const [format, setFormat] = useState<AdFormat>("post");
  const [style, setStyle] = useState<AdStyle>("gastronomia_premium");
  const [products, setProducts] = useState<Product[]>([emptyProduct()]);
  const [background, setBackground] = useState<ImageState>(emptyImage());
  const [logo, setLogo] = useState<ImageState>(emptyImage());
  const [result, setResult] = useState<AdResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState<string | null>(null);
  const [step, setStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [useOpenRouter, setUseOpenRouter] = useState(() => localStorage.getItem("provider") === "openrouter");
  const [fallback, setFallback] = useState(() => localStorage.getItem("fallback") === "true");
  const [geminiKey, setGeminiKey] = useState(() => sessionStorage.getItem("geminiKey") || "");
  const [openRouterKey, setOpenRouterKey] = useState(() => sessionStorage.getItem("openRouterKey") || "");
  const [openRouterModel, setOpenRouterModel] = useState(() => localStorage.getItem("openRouterModel") || MODELS[0].id);
  const [server, setServer] = useState({ geminiConfigured: false, openRouterConfigured: false });

  useEffect(() => { fetch("/api/settings").then(r => r.json()).then(setServer).catch(() => undefined); }, []);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(null), 2600); return () => clearTimeout(timer); }, [notice]);
  const activeFormat = FORMATS.find(item => item.id === format)!;
  const ready = products.every(item => item.name.trim() && item.image.base64);
  const completion = useMemo(() => [products[0]?.name, products[0]?.image.base64, style, format].filter(Boolean).length, [products, style, format]);

  const updateProduct = (id: string, patch: Partial<Product>) => setProducts(current => current.map(item => item.id === id ? { ...item, ...patch } : item));
  const fetchProduct = async (product: Product) => {
    if (!product.url) return;
    setFetching(product.id); setError(null);
    try {
      const response = await fetch("/api/scrape", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: product.url }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível ler este produto.");
      updateProduct(product.id, {
        name: data.title || product.name, techData: data.description || product.techData,
        image: data.base64Image ? { file: null, preview: `data:${data.mimeType};base64,${data.base64Image}`, base64: data.base64Image } : product.image,
      });
      setNotice("Dados do produto importados.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao importar produto."); }
    finally { setFetching(null); }
  };

  const saveSettings = () => {
    geminiKey ? sessionStorage.setItem("geminiKey", geminiKey) : sessionStorage.removeItem("geminiKey");
    openRouterKey ? sessionStorage.setItem("openRouterKey", openRouterKey) : sessionStorage.removeItem("openRouterKey");
    localStorage.setItem("provider", useOpenRouter ? "openrouter" : "gemini");
    localStorage.setItem("fallback", String(fallback));
    localStorage.setItem("openRouterModel", openRouterModel);
    setSettingsOpen(false); setNotice("Configurações salvas nesta sessão.");
  };

  const generate = async () => {
    if (!ready) return setError("Adicione o nome e a imagem de todos os produtos.");
    const hasGemini = Boolean(geminiKey || server.geminiConfigured);
    const hasOR = Boolean(openRouterKey || server.openRouterConfigured);
    const provider: AiProvider = useOpenRouter || (fallback && !hasGemini && hasOR) ? "openrouter" : "gemini";
    if ((provider === "gemini" && !hasGemini) || (provider === "openrouter" && !hasOR)) {
      setSettingsOpen(true); return setError("Configure uma chave de IA para continuar.");
    }
    const apiKey = provider === "gemini" ? geminiKey : openRouterKey;
    const images = [
      ...(background.base64 ? [{ mimeType: background.file?.type || "image/jpeg", data: background.base64 }] : []),
      ...products.map(p => ({ mimeType: p.image.file?.type || p.image.preview?.match(/^data:(.*?);/)?.[1] || "image/png", data: p.image.base64! })),
      ...(logo.base64 ? [{ mimeType: logo.file?.type || "image/png", data: logo.base64 }] : []),
    ];
    const promptInput = { style, format: activeFormat, products,
      hasBackground: Boolean(background.base64), hasLogo: Boolean(logo.base64) };
    setLoading(true); setResult(null); setError(null);
    try {
      setStep("Criando estratégia de campanha");
      const copyPrompt = buildCopyPrompt(promptInput);
      const copyModel = provider === "gemini" ? "gemini-2.0-flash" : "google/gemini-2.0-flash-001";
      const copy = await requestAi({ provider, mode: "copy", model: copyModel, apiKey, prompt: copyPrompt, images });
      const campaign = parseJsonResponse<AdResult>(copy.text);
      setStep("Compondo o criativo final");
      const visualPrompt = buildImagePrompt(promptInput, campaign);
      const imageModel = provider === "gemini" ? "gemini-2.5-flash-image" : openRouterModel;
      const image = await requestAi({ provider, mode: "image", model: imageModel, apiKey, prompt: visualPrompt, images, aspectRatio: activeFormat.ratio });
      if (!image.imageUrl) throw new Error("O modelo não retornou uma imagem. Selecione um modelo com geração de imagem.");
      setResult({ ...campaign, imageUrl: image.imageUrl });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível gerar o criativo."); }
    finally { setLoading(false); setStep(""); }
  };

  const download = () => {
    if (!result?.imageUrl) return;
    const anchor = document.createElement("a"); anchor.href = result.imageUrl; anchor.download = `adcreative-${format}.png`; anchor.click();
  };
  const share = async () => {
    if (!result?.imageUrl) return;
    try {
      const blob = await fetch(result.imageUrl).then(r => r.blob());
      const file = new File([blob], "adcreative.png", { type: blob.type });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ title: result.headline, text: result.caption, files: [file] });
      else { await navigator.clipboard.writeText(result.caption); setNotice("Legenda copiada."); }
    } catch { setNotice("Não foi possível compartilhar."); }
  };

  return (
    <div className="min-h-screen bg-[#f3f2ed] text-zinc-950">
      <AnimatePresence>{notice && <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} className="toast"><Check size={16} />{notice}</motion.div>}</AnimatePresence>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#171714]/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-[#d8ff3e] text-zinc-950"><WandSparkles size={19} /></span><div><b className="block text-sm">AdCreative AI</b><span className="hidden text-[10px] uppercase tracking-[.22em] text-zinc-500 sm:block">Creative command center</span></div></div>
          <div className="hidden items-center gap-1 rounded-xl bg-white/5 p-1 lg:flex">{FORMATS.map(item => <button key={item.id} onClick={() => { setFormat(item.id); setResult(null); }} className={`format-tab ${format === item.id ? "active" : ""}`}>{item.label}<small>{item.ratio}</small></button>)}</div>
          <button onClick={() => setSettingsOpen(true)} className="secondary-dark"><Settings size={16} /><span className="hidden sm:inline">Configurações</span></button>
        </div>
        <div className="scrollbar-none flex gap-2 overflow-x-auto border-t border-white/5 px-4 py-2 lg:hidden">{FORMATS.map(item => <button key={item.id} onClick={() => { setFormat(item.id); setResult(null); }} className={`format-tab shrink-0 ${format === item.id ? "active" : ""}`}>{item.label}<small>{item.ratio}</small></button>)}</div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:py-9">
        <div className="mb-7 grid gap-5 border-b border-zinc-300 pb-7 md:grid-cols-[1fr_auto] md:items-end">
          <div><span className="eyebrow"><Sparkles size={13} /> Estúdio de criação inteligente</span><h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-.045em] sm:text-5xl">Do produto ao anúncio pronto para vender.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">Importe os dados, defina a direção visual e gere uma campanha completa sem perder a fidelidade do produto.</p></div>
          <div className="progress-card"><div className="flex items-center justify-between"><span>Preparação</span><b>{completion}/4</b></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200"><motion.div animate={{ width: `${completion * 25}%` }} className="h-full bg-[#9fc300]" /></div></div>
        </div>

        <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1.05fr)_minmax(430px,.95fr)]">
          <div className="space-y-6">
            <section className="panel">
              <header className="panel-head"><span className="step">01</span><div><h2>Produto</h2><p>Importe por link ou preencha manualmente.</p></div>{format === "banner" && products.length < 2 && <button onClick={() => setProducts(p => [...p, emptyProduct()])} className="text-button"><Plus size={15} /> Adicionar produto</button>}</header>
              <div className="space-y-5 p-4 sm:p-6">{products.map((product, index) => <div key={product.id} className="product-card">
                <div className="mb-4 flex items-center justify-between"><b className="text-sm">Produto {index + 1}</b>{products.length > 1 && <button onClick={() => setProducts(p => p.filter(x => x.id !== product.id))} className="icon-button text-red-600" aria-label="Remover produto"><Trash2 size={16} /></button>}</div>
                <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                  <ImageInput value={product.image} label="Imagem do produto *" hint="máx. 8 MB" onChange={image => updateProduct(product.id, { image })} />
                  <div className="space-y-4">
                    <div><label className="label">Link do produto</label><div className="mt-2 flex gap-2"><div className="input-wrap"><Globe size={15} /><input type="url" value={product.url} onChange={e => updateProduct(product.id, { url: e.target.value })} placeholder="https://loja.com/produto" /></div><button onClick={() => fetchProduct(product)} disabled={!product.url || fetching === product.id} className="square-button" aria-label="Buscar produto">{fetching === product.id ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}</button></div></div>
                    <div><label className="label">Nome do produto *</label><input className="input mt-2" value={product.name} onChange={e => updateProduct(product.id, { name: e.target.value })} placeholder="Ex.: Liquidificador profissional 1,5 L" /></div>
                    <div className="grid gap-3 sm:grid-cols-2"><div><label className="label">Preço</label><div className="input-wrap mt-2"><Banknote size={15} /><input value={product.price} onChange={e => updateProduct(product.id, { price: e.target.value })} placeholder="R$ 4.500,00" /></div></div><div><label className="label">Selo</label><select className="input mt-2" value={product.badge} onChange={e => updateProduct(product.id, { badge: e.target.value as Badge })}>{BADGES.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}</select></div></div>
                    <div><label className="label">Informações técnicas</label><textarea className="input mt-2 min-h-20 resize-y" value={product.techData} onChange={e => updateProduct(product.id, { techData: e.target.value })} placeholder="Capacidade, potência, materiais e diferenciais..." /></div>
                  </div>
                </div>
              </div>)}</div>
            </section>

            <section className="panel">
              <header className="panel-head"><span className="step">02</span><div><h2>Direção visual</h2><p>Escolha o estilo e os ativos da marca.</p></div></header>
              <div className="p-4 sm:p-6">
                <label className="label">Estilo da campanha</label><div className="mt-3 grid gap-3 md:grid-cols-3">{STYLES.map(item => <button key={item.id} onClick={() => setStyle(item.id)} className={`style-card ${style === item.id ? "selected" : ""}`}><span className={`style-art bg-gradient-to-br ${item.color}`}><item.icon size={22} /></span><b>{item.name}</b><small>{item.desc}</small>{style === item.id && <CheckCircle2 className="absolute right-3 top-3 text-[#9fc300]" size={18} />}</button>)}</div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2"><ImageInput value={background} label="Cenário de referência" hint="opcional" onChange={setBackground} /><ImageInput value={logo} label="Logo da marca" hint="opcional" onChange={setLogo} /></div>
              </div>
            </section>
            {error && <div className="error-box"><AlertCircle size={19} /><span>{error}</span><button onClick={() => setError(null)}><X size={16} /></button></div>}
            <button onClick={generate} disabled={loading} className="generate-button">{loading ? <><Loader2 className="animate-spin" size={20} />{step}</> : <><Sparkles size={20} />Gerar criativo <span>{activeFormat.label} · {activeFormat.ratio}</span></>}</button>
          </div>

          <aside className="xl:sticky xl:top-26">
            <div className="preview-shell">
              <div className="preview-top"><div><span className="eyebrow text-zinc-400">03 · Resultado</span><b className="mt-1 block text-white">{activeFormat.label}</b></div><span>{activeFormat.size}</span></div>
              <div className={`preview-canvas ratio-${format}`}>
                {loading ? <div className="grid h-full place-items-center text-center"><div><Loader2 className="mx-auto animate-spin text-[#d8ff3e]" size={30} /><b className="mt-4 block text-white">{step}</b><small className="mt-1 block text-zinc-500">A IA está preservando os detalhes do produto.</small></div></div> : result?.imageUrl ? <img src={result.imageUrl} alt="Criativo gerado" className="h-full w-full object-contain" /> : <div className="grid h-full place-items-center p-10 text-center"><div><span className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-400"><Upload size={23} /></span><b className="mt-4 block text-white">Seu criativo aparecerá aqui</b><small className="mt-2 block max-w-xs leading-5 text-zinc-500">Complete o produto, escolha um estilo e clique em gerar.</small></div></div>}
              </div>
              {result && <div className="preview-actions"><button onClick={download}><Download size={17} /> Baixar</button><button onClick={share}><Share2 size={17} /> Compartilhar</button><button onClick={generate}><RefreshCw size={17} /> Regerar</button></div>}
            </div>
            {result && <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5"><div className="flex items-start justify-between gap-4"><div><span className="label">Copy da campanha</span><h3 className="mt-2 text-xl font-semibold">{result.headline}</h3></div><button onClick={() => { navigator.clipboard.writeText(`${result.caption}\n\n${result.hashtags.join(" ")}`); setNotice("Legenda copiada."); }} className="icon-button"><Copy size={17} /></button></div><ul className="my-4 space-y-2">{result.benefits.map(item => <li key={item} className="flex gap-2 text-sm text-zinc-600"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#8eae00]" />{item}</li>)}</ul><p className="whitespace-pre-wrap rounded-xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">{result.caption}</p><div className="mt-3 flex flex-wrap gap-2">{result.hashtags.map(tag => <span key={tag} className="rounded-full bg-lime-50 px-2.5 py-1 text-xs font-medium text-[#647b00]">{tag}</span>)}</div></motion.div>}
          </aside>
        </div>
      </main>

      <AnimatePresence>{settingsOpen && <div className="fixed inset-0 z-50 grid place-items-center p-4"><motion.button aria-label="Fechar" onClick={() => setSettingsOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" /><motion.div role="dialog" aria-modal="true" initial={{ opacity: 0, scale: .97, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }} className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between"><div><span className="icon-box mb-3"><Settings size={19} /></span><h2 className="text-2xl font-semibold tracking-tight">Configuração de IA</h2><p className="mt-1 text-sm text-zinc-500">Chaves digitadas ficam apenas nesta aba.</p></div><button onClick={() => setSettingsOpen(false)} className="icon-button"><X size={18} /></button></div>
        <div className="security-note"><ShieldCheck size={18} /><span><b>Mais segurança</b>As chaves não são gravadas no servidor nem incluídas no código da aplicação.</span></div>
        <div className="mt-6 flex rounded-xl bg-zinc-100 p-1"><button onClick={() => setUseOpenRouter(false)} className={`provider-tab ${!useOpenRouter ? "active" : ""}`}>Google Gemini</button><button onClick={() => setUseOpenRouter(true)} className={`provider-tab ${useOpenRouter ? "active" : ""}`}>OpenRouter</button></div>
        {!useOpenRouter ? <div className="mt-5"><label className="label">Gemini API key {server.geminiConfigured && <span className="status-dot">Servidor configurado</span>}</label><input type="password" className="input mt-2" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} placeholder={server.geminiConfigured ? "Opcional — usando chave do servidor" : "AIza..."} /></div> : <div className="mt-5 space-y-4"><div><label className="label">OpenRouter API key {server.openRouterConfigured && <span className="status-dot">Servidor configurado</span>}</label><input type="password" className="input mt-2" value={openRouterKey} onChange={e => setOpenRouterKey(e.target.value)} placeholder="sk-or-v1-..." /></div><div><label className="label">Modelo de imagem</label><select className="input mt-2" value={openRouterModel} onChange={e => setOpenRouterModel(e.target.value)}>{MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}</select></div></div>}
        <label className="mt-5 flex cursor-pointer items-center justify-between rounded-xl border border-zinc-200 p-4"><span><b className="block text-sm">Fallback automático</b><small className="text-zinc-500">Usar OpenRouter se o Gemini não estiver configurado.</small></span><input type="checkbox" checked={fallback} onChange={e => setFallback(e.target.checked)} className="size-5 accent-[#9fc300]" /></label>
        <button onClick={saveSettings} className="generate-button mt-6">Salvar configurações</button>
      </motion.div></div>}</AnimatePresence>
    </div>
  );
}
