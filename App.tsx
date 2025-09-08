import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Status, type ClonedDesign, type Mockup, type ProductDetails } from './types';
import { PRODUCTS, IconSparkles, IconUpload } from './constants';
import * as geminiService from './services/geminiService';
import { toBase64 } from './utils/fileUtils';
import Button from './components/Button';
import ErrorNotification from './components/ErrorNotification';
import ProductDetailsDisplay from './components/ProductDetailsDisplay';
import MockupCard from './components/MockupCard';
import InstructionsModal from './components/InstructionsModal';
import PromptGuide from './components/PromptGuide';

const ProductSelectorCard = ({ id, name, isSelected, onSelect }: { id: string, name: string, isSelected: boolean, onSelect: (id: string) => void }) => (
    <div
        onClick={() => onSelect(id)}
        className={`cursor-pointer p-3 text-center rounded-xl border-2 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center h-full ${isSelected ? 'border-yellow-400 bg-yellow-900/20 ring-1 ring-yellow-400' : 'border-gray-700 bg-gray-900 hover:border-gray-600'}`}
    >
        <h3 className="text-md font-semibold text-white">{name}</h3>
    </div>
);

const App: React.FC = () => {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [clonedDesign, setClonedDesign] = useState<ClonedDesign>({ status: Status.IDLE, imageUrl: null });
    const [removedBgDesign, setRemovedBgDesign] = useState<ClonedDesign>({ status: Status.IDLE, imageUrl: null });
    const [resizedDesign, setResizedDesign] = useState<ClonedDesign>({ status: Status.IDLE, imageUrl: null });
    const [mockups, setMockups] = useState<Mockup[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<string[]>(Object.keys(PRODUCTS).slice(0, 4));
    const [productDetails, setProductDetails] = useState<ProductDetails | null>(null);
    const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);
    const [additionalInstructions, setAdditionalInstructions] = useState<string>('');
    const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState(false);
    const [page, setPage] = useState<'studio' | 'guide'>('studio');
    const [mode, setMode] = useState<'cloner' | 'redesign'>('cloner');
    
    // API Key State
    const [geminiApiKey, setGeminiApiKey] = useState<string>(() => localStorage.getItem('geminiApiKey') || '');
    const [photoroomApiKey, setPhotoroomApiKey] = useState<string>(() => localStorage.getItem('photoroomApiKey') || 'sk_pr_default_a0f75c1bea6776987fcd3790bd047935b9eb5ece');
    const [showApiKeys, setShowApiKeys] = useState<boolean>(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        localStorage.setItem('geminiApiKey', geminiApiKey);
    }, [geminiApiKey]);

    useEffect(() => {
        localStorage.setItem('photoroomApiKey', photoroomApiKey);
    }, [photoroomApiKey]);

    useEffect(() => {
        // Open the API key section by default if the required key is missing
        if (!geminiApiKey) {
            setShowApiKeys(true);
        }
    }, []); // Run only once on mount

    const processImageFile = useCallback(async (file: File) => {
        if (file && file.type.startsWith('image/')) {
            try {
                const base64Image = await toBase64(file);
                setUploadedImage(base64Image);
                setClonedDesign({ status: Status.IDLE, imageUrl: null });
                setRemovedBgDesign({ status: Status.IDLE, imageUrl: null });
                setResizedDesign({ status: Status.IDLE, imageUrl: null });
                setMockups([]);
                setError(null);
                setProductDetails(null);
            } catch (err) {
                setError("Couldn't process this image. Please try another file.");
            }
        } else {
            setError("Please paste or upload a valid image file.");
        }
    }, []);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            processImageFile(file);
        }
    };
    
    useEffect(() => {
        const handlePaste = (event: ClipboardEvent) => {
            const file = event.clipboardData?.files[0];
            if (file) {
                processImageFile(file);
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [processImageFile]);


    const handleProductSelect = (productId: string) => {
        setSelectedProducts(prev => {
            const isSelected = prev.includes(productId);
            if (isSelected) {
                return prev.filter(id => id !== productId);
            } else {
                 if (prev.length >= 6) {
                    setError("You can select a maximum of 6 mockups.");
                    setTimeout(() => setError(null), 3000);
                    return prev;
                }
                return [...prev, productId];
            }
        });
    };
    
    const handleGenerateClick = async () => {
        if (!geminiApiKey) {
            setError("Please enter your Gemini API key to start.");
            setShowApiKeys(true);
            return;
        }
        if (!uploadedImage) {
            setError("Please upload a design image to start!");
            return;
        }

        setIsLoading(true);
        setError(null);
        setProductDetails(null);
        setClonedDesign({ status: Status.PENDING, imageUrl: null });
        setRemovedBgDesign({ status: Status.IDLE, imageUrl: null });
        setResizedDesign({ status: Status.IDLE, imageUrl: null });
        if (selectedProducts.length > 0) {
            setMockups(selectedProducts.map(id => ({ id, name: PRODUCTS[id].name, status: Status.PENDING, imageUrl: null })));
        } else {
            setMockups([]);
        }
        
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

        try {
            setLoadingMessage('Analyzing color...');
            const dominantColor = await geminiService.analyzeImageColor(geminiApiKey, uploadedImage);

            setLoadingMessage(mode === 'cloner' ? 'Cloning design...' : 'Redesigning...');
            const instructionsToPass = mode === 'redesign' ? additionalInstructions : undefined;
            const clonedImageUrl = await geminiService.cloneDesign(geminiApiKey, uploadedImage, instructionsToPass);
            setClonedDesign({ status: Status.SUCCESS, imageUrl: clonedImageUrl });

            setLoadingMessage('Removing background...');
            setRemovedBgDesign({ status: Status.PENDING, imageUrl: null });
            const transparentImageUrl = await geminiService.removeBackground(photoroomApiKey, clonedImageUrl);
            setRemovedBgDesign({ status: Status.SUCCESS, imageUrl: transparentImageUrl });

            setLoadingMessage('Resizing for print...');
            setResizedDesign({ status: Status.PENDING, imageUrl: null });
            const resizedImageUrl = await geminiService.resizeDesign(transparentImageUrl);
            setResizedDesign({ status: Status.SUCCESS, imageUrl: resizedImageUrl });

            if (selectedProducts.length > 0) {
                setLoadingMessage(`Creating mockups...`);
                await Promise.all(selectedProducts.map(async (productId) => {
                    try {
                        const mockupImageUrl = await geminiService.createMockup(geminiApiKey, resizedImageUrl, PRODUCTS[productId].prompt, dominantColor, instructionsToPass);
                        setMockups(prev => prev.map(m => m.id === productId ? { ...m, status: Status.SUCCESS, imageUrl: mockupImageUrl } : m));
                    } catch (err) {
                        console.error(`Failed mockup for ${productId}:`, err);
                        setMockups(prev => prev.map(m => m.id === productId ? { ...m, status: Status.FAILED } : m));
                    }
                }));
            }

        } catch (err: any) {
            console.error("A critical step failed:", err);
            setError(err.message || "Could not process the design. Please try another image.");
            if (clonedDesign.status === Status.PENDING) setClonedDesign({ status: Status.FAILED, imageUrl: null });
            if (removedBgDesign.status !== Status.SUCCESS) setRemovedBgDesign({ status: Status.FAILED, imageUrl: null });
            if (resizedDesign.status !== Status.SUCCESS) setResizedDesign({ status: Status.FAILED, imageUrl: null });
            if (selectedProducts.length > 0) {
                setMockups(prev => prev.map(m => (m.status === Status.PENDING ? { ...m, status: Status.FAILED } : m)));
            }
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleGenerateDetails = async () => {
        if (!removedBgDesign.imageUrl) return;

        setIsGeneratingDetails(true);
        setProductDetails(null);
        setError(null);

        try {
            const details = await geminiService.generateProductDetails(geminiApiKey, removedBgDesign.imageUrl);
            setProductDetails(details);
        } catch (err: any) {
            setError(err.message || "Could not generate product details. Please try again.");
        } finally {
            setIsGeneratingDetails(false);
        }
    };

    const handleDownload = (imageUrl: string, name: string) => {
        const fileName = `${name.toLowerCase().replace(/\s+/g, '-')}.png`;
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadAll = () => {
        mockups.filter(m => m.status === Status.SUCCESS).forEach((mockup, index) => {
            setTimeout(() => handleDownload(mockup.imageUrl!, `mockup-${mockup.name}`), index * 300);
        });
    };

    const generateButtonText = selectedProducts.length > 0 ? 'Generate Mockups' : 'Process Design';

    if (page === 'guide') {
        return (
            <div className="bg-black text-gray-200 min-h-screen flex flex-col items-center p-4 pb-20">
                <PromptGuide onBack={() => setPage('studio')} />
            </div>
        );
    }

    return (
        <>
            <div className="bg-black text-gray-200 min-h-screen flex flex-col items-center p-4 pb-20">
                <ErrorNotification message={error} onDismiss={() => setError(null)} />
                
                <div className="w-full max-w-6xl mx-auto">
                    <header className="text-center my-12">
                        <h1 className="text-6xl md:text-7xl font-caveat text-white tracking-tight">
                            AI Mockup <span className="text-yellow-400">Studio</span>
                        </h1>
                        <p className="mt-4 text-lg text-gray-500">Clone designs and generate product mockups instantly.</p>
                    </header>

                    <main>
                        <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-800 mb-8">
                            <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowApiKeys(!showApiKeys)}>
                                <h2 className="text-xl font-semibold text-white">API Keys</h2>
                                <button className="text-gray-400 hover:text-white transition-transform duration-300" style={{ transform: showApiKeys ? 'rotate(180deg)' : 'rotate(0deg)'}}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                                </button>
                            </div>
                            {showApiKeys && (
                                <div className="mt-6 space-y-4 animate-fade-in-down">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-400 block mb-2">Gemini API Key (Required)</label>
                                        <input 
                                            type="password"
                                            value={geminiApiKey}
                                            onChange={(e) => setGeminiApiKey(e.target.value)}
                                            placeholder="Enter your Gemini API key"
                                            className="w-full bg-gray-800 p-3 rounded-md text-gray-200 border border-gray-700 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-400 block mb-2">Photoroom API Key (Optional)</label>
                                        <input 
                                            type="password"
                                            value={photoroomApiKey}
                                            onChange={(e) => setPhotoroomApiKey(e.target.value)}
                                            placeholder="Defaults to a trial key"
                                            className="w-full bg-gray-800 p-3 rounded-md text-gray-200 border border-gray-700 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 pt-2">Your keys are stored in your browser's local storage and are never sent to our servers.</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-800 mb-16">
                            <div className="mb-8">
                                <h2 className="text-2xl font-semibold text-white mb-4">Mode</h2>
                                <div className="flex space-x-2 rounded-lg bg-gray-800 p-1">
                                    <button
                                        onClick={() => setMode('cloner')}
                                        className={`w-full py-2 px-4 rounded-md font-medium transition-colors duration-300 ${mode === 'cloner' ? 'bg-yellow-400 text-black shadow' : 'text-gray-300 hover:bg-gray-700'}`}
                                    >
                                        Cloner
                                    </button>
                                    <button
                                        onClick={() => setMode('redesign')}
                                        className={`w-full py-2 px-4 rounded-md font-medium transition-colors duration-300 ${mode === 'redesign' ? 'bg-yellow-400 text-black shadow' : 'text-gray-300 hover:bg-gray-700'}`}
                                    >
                                        Redesign
                                    </button>
                                </div>
                                <p className="text-sm text-gray-400 mt-2 text-center">
                                    {mode === 'cloner' 
                                        ? 'Recreates the design with the highest fidelity.' 
                                        : 'Reimagines the design based on your instructions.'}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div>
                                    <h2 className="text-2xl font-semibold mb-6 text-white">1. Upload Design</h2>
                                    <div 
                                        className="w-full aspect-square border-4 border-dashed border-gray-700 rounded-xl flex items-center justify-center cursor-pointer hover:border-yellow-400 transition-colors bg-gray-800 overflow-hidden shadow-inner"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {uploadedImage ? (
                                            <img src={uploadedImage} alt="Uploaded design" className="w-full h-full object-contain p-4" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center p-6 text-center text-gray-500">
                                                <IconUpload />
                                                <p className="mt-4 text-lg text-gray-300">Click to upload or paste image</p>
                                                <p className="text-sm mt-1">(Ctrl+V)</p>
                                            </div>
                                        )}
                                    </div>
                                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/png, image/jpeg" className="hidden" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold mb-6 text-white">2. Select Products (Optional)</h2>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {Object.entries(PRODUCTS).map(([key, data]) => (
                                            <ProductSelectorCard
                                                key={key}
                                                id={key}
                                                name={data.name}
                                                isSelected={selectedProducts.includes(key)}
                                                onSelect={handleProductSelect}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className={`mt-8 pt-8 border-t border-gray-700/50 transition-opacity duration-300 ${mode === 'cloner' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <div className="flex justify-between items-center flex-wrap gap-4">
                                     <div className="flex items-baseline gap-4">
                                        <div>
                                            <h2 className="text-2xl font-semibold text-white">3. Additional Instructions</h2>
                                            <p className="text-gray-400 mt-1">Optional: Customize style, colors, or add elements.</p>
                                        </div>
                                        <button 
                                            onClick={() => setPage('guide')} 
                                            className="text-sm text-yellow-400 hover:text-yellow-300 underline transition-colors disabled:text-gray-500 disabled:no-underline"
                                            title="Learn how to write effective prompts"
                                            disabled={mode === 'cloner'}
                                        >
                                            View Prompting Guide
                                        </button>
                                    </div>
                                    <Button onClick={() => setIsInstructionsModalOpen(true)} disabled={mode === 'cloner'}>
                                        {additionalInstructions ? 'Edit Instructions' : 'Add Instructions'}
                                    </Button>
                                </div>
                                {mode === 'cloner' && (
                                    <p className="text-xs text-yellow-500 mt-2 text-right">Enable Redesign mode to add instructions.</p>
                                )}
                                {additionalInstructions && mode === 'redesign' && (
                                    <div className="mt-4 text-left p-4 bg-gray-800 border border-gray-700 rounded-lg whitespace-pre-wrap">
                                        <p className="text-gray-300">{additionalInstructions}</p>
                                    </div>
                                )}
                            </div>


                            <div className="mt-12 text-center">
                                <Button onClick={handleGenerateClick} disabled={!uploadedImage || isLoading || !geminiApiKey} primary className="text-lg px-12 py-4">
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
                                            <span>{loadingMessage}</span>
                                        </>
                                    ) : (
                                        <> <IconSparkles /> {generateButtonText} </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div ref={resultsRef}>
                            {clonedDesign.status !== Status.IDLE && (
                                <div className="mb-16">
                                    <h2 className="text-3xl font-bold text-white mb-8 text-center">1. Generated Design</h2>
                                    <div className="max-w-md mx-auto bg-gray-900 rounded-xl p-4">
                                        {clonedDesign.status === Status.PENDING && <div className="animate-pulse bg-gray-800 aspect-square rounded-lg" />}
                                        {clonedDesign.status === Status.SUCCESS && 
                                            <img src={clonedDesign.imageUrl!} alt="Cloned design" className="w-full h-full object-contain rounded-lg" />
                                        }
                                        {clonedDesign.status === Status.FAILED && <div className="aspect-square rounded-lg bg-gray-800 flex items-center justify-center text-red-400">Design generation failed</div>}
                                    </div>
                                    {clonedDesign.status === Status.SUCCESS && (
                                        <div className="text-center mt-6 flex justify-center flex-wrap gap-4">
                                            <Button onClick={() => handleDownload(clonedDesign.imageUrl!, 'cloned-design')}>Download Design</Button>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {resizedDesign.status !== Status.IDLE && (
                                <div className="mb-16">
                                    <h2 className="text-3xl font-bold text-white mb-8 text-center">2. Resized for Print (4500x5400)</h2>
                                    <div className="max-w-md mx-auto bg-gray-900 rounded-xl p-4">
                                        {resizedDesign.status === Status.PENDING && <div className="animate-pulse bg-gray-800 aspect-square rounded-lg" />}
                                        {resizedDesign.status === Status.SUCCESS && 
                                            <div className="aspect-square rounded-lg bg-grid-pattern">
                                                <img src={resizedDesign.imageUrl!} alt="Resized design" className="w-full h-full object-contain" />
                                            </div>
                                        }
                                        {resizedDesign.status === Status.FAILED && <div className="aspect-square rounded-lg bg-gray-800 flex items-center justify-center text-red-400">Resizing failed</div>}
                                    </div>
                                    {resizedDesign.status === Status.SUCCESS && (
                                        <div className="text-center mt-6 flex justify-center flex-wrap gap-4">
                                            <Button onClick={() => handleDownload(resizedDesign.imageUrl!, 'design-4500x5400')}>Download Resized Design</Button>
                                            <Button onClick={handleGenerateDetails} disabled={isGeneratingDetails} primary>
                                                {isGeneratingDetails ? (
                                                    <>
                                                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-black"></div>
                                                      <span>Generating...</span>
                                                    </>
                                                ) : "✨ Generate Details"}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {productDetails && <ProductDetailsDisplay details={productDetails} />}

                            {mockups.length > 0 && (
                                <div className={productDetails || resizedDesign.status !== Status.IDLE ? 'mt-16' : ''}>
                                    <div className="flex flex-col sm:flex-row justify-center items-center mb-8 gap-4 sm:gap-6">
                                        <h2 className="text-3xl font-bold text-white text-center">3. Your Product Mockups</h2>
                                        <Button onClick={handleDownloadAll} disabled={isLoading || mockups.every(m => m.status !== Status.SUCCESS)}>Download All</Button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                                        {mockups.map((mockup) => <MockupCard key={mockup.id} mockup={mockup} onDownload={handleDownload} />)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
            <InstructionsModal
                isOpen={isInstructionsModalOpen}
                onClose={() => setIsInstructionsModalOpen(false)}
                onSave={(instructions) => {
                    setAdditionalInstructions(instructions);
                    setIsInstructionsModalOpen(false);
                }}
                initialInstructions={additionalInstructions}
            />
        </>
    );
};

export default App;