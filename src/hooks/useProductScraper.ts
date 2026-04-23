import { useState } from 'react';
import { ImageState } from '../types';

interface UseProductScraperReturn {
    productUrl: string;
    setProductUrl: (url: string) => void;
    productName: string;
    setProductName: (name: string) => void;
    techData: string;
    setTechData: (data: string) => void;
    isFetchingProduct: boolean;
    prodImage: ImageState;
    setProdImage: (image: ImageState) => void;
    fetchProduct: () => Promise<void>;
    error: string | null;
    setError: (error: string | null) => void;
    resetProduct: () => void;
}

export function useProductScraper(): UseProductScraperReturn {
    const [productUrl, setProductUrl] = useState('');
    const [productName, setProductName] = useState('');
    const [techData, setTechData] = useState('');
    const [isFetchingProduct, setIsFetchingProduct] = useState(false);
    const [prodImage, setProdImage] = useState<ImageState>({ file: null, preview: null, base64: null });
    const [error, setError] = useState<string | null>(null);

    const fetchProduct = async () => {
        if (!productUrl) return;
        setIsFetchingProduct(true);
        setError(null);
        try {
            const response = await fetch('/api/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: productUrl }),
            });

            if (!response.ok) {
                throw new Error('Falha ao buscar informações do produto. Verifique o link.');
            }

            const data = await response.json();
            if (data.title) setProductName(data.title);
            if (data.description) setTechData(data.description);
            if (data.base64Image) {
                setProdImage({
                    file: new File([], 'product.png', { type: data.mimeType || 'image/png' }),
                    preview: `data:${data.mimeType || 'image/png'};base64,${data.base64Image}`,
                    base64: data.base64Image
                });
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao buscar informações do produto.');
        } finally {
            setIsFetchingProduct(false);
        }
    };

    const resetProduct = () => {
        setProdImage({ file: null, preview: null, base64: null });
        setProductName('');
        setTechData('');
        setProductUrl('');
    };

    return {
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
        error,
        setError,
        resetProduct
    };
}
