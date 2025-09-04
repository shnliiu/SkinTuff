
import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { AnalysisResponse, UserProfile, ScreeningSummary } from './types';
import { AppState } from './types';
import { analyzeSkin, analyzeSkinStream } from './services/geminiService';
import { ResultsDisplay } from './components/ResultsDisplay';
import { SunIcon, MoonIcon, CameraIcon, UploadIcon, SparklesIcon, AlertTriangleIcon } from './components/icons';

const WelcomeScreen: React.FC<{ 
    onStart: () => void, 
    onStartLive: () => void,
    profile: UserProfile, 
    setProfile: React.Dispatch<React.SetStateAction<UserProfile>> 
}> = ({ onStart, onStartLive, profile, setProfile }) => {
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };
    
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setProfile(prev => ({ ...prev, [name]: checked }));
    };

    return (
        <div className="text-center max-w-2xl mx-auto p-4">
            <SparklesIcon className="w-16 h-16 text-brand-primary mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-extrabold text-light-text dark:text-dark-text mb-4">
                AI Skin Analyzer
            </h1>
            <p className="text-lg text-light-subtle dark:text-dark-subtle mb-8">
                Get a personalized skincare routine based on an analysis of your photo. For educational purposes only.
            </p>

            <div className="bg-light-card dark:bg-dark-card p-6 rounded-2xl shadow-lg text-left mb-8">
                <h2 className="text-xl font-bold mb-4 text-light-text dark:text-dark-text">Tell us a bit about you (Optional)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="ageRange" className="block text-sm font-medium text-light-subtle dark:text-dark-subtle mb-1">Age Range</label>
                        <select name="ageRange" id="ageRange" value={profile.ageRange} onChange={handleInputChange} className="w-full bg-light-bg dark:bg-dark-bg border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-light-text dark:text-dark-text">
                            <option>Under 18</option>
                            <option>18-24</option>
                            <option>25-34</option>
                            <option>35-44</option>
                            <option>45+</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="budget" className="block text-sm font-medium text-light-subtle dark:text-dark-subtle mb-1">Budget</label>
                        <select name="budget" id="budget" value={profile.budget} onChange={handleInputChange} className="w-full bg-light-bg dark:bg-dark-bg border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-light-text dark:text-dark-text">
                            <option>Drugstore</option>
                            <option>Mid-range</option>
                            <option>Luxe</option>
                            <option>Mix</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="sensitivities" className="block text-sm font-medium text-light-subtle dark:text-dark-subtle mb-1">Sensitivities or Allergies</label>
                        <input type="text" name="sensitivities" id="sensitivities" value={profile.sensitivities} onChange={handleInputChange} placeholder="e.g., fragrance, essential oils" className="w-full bg-light-bg dark:bg-dark-bg border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-light-text dark:text-dark-text" />
                    </div>
                    <div className="md:col-span-2 flex items-center">
                         <input type="checkbox" name="isPregnantOrBreastfeeding" id="isPregnantOrBreastfeeding" checked={profile.isPregnantOrBreastfeeding} onChange={handleCheckboxChange} className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-secondary" />
                        <label htmlFor="isPregnantOrBreastfeeding" className="ml-2 block text-sm text-light-subtle dark:text-dark-subtle">Are you pregnant or breastfeeding?</label>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                 <button
                    onClick={onStart}
                    className="bg-brand-primary text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-brand-secondary transition-transform transform hover:scale-105 duration-300"
                >
                    Analyze Single Photo
                </button>
                 <button
                    onClick={onStartLive}
                    className="bg-light-card dark:bg-dark-card text-brand-primary dark:text-dark-text font-bold py-3 px-8 rounded-full text-lg ring-2 ring-brand-primary/50 hover:ring-brand-primary transition-all duration-300"
                >
                    Start Live Analysis
                </button>
            </div>
             <div className="mt-8 text-xs text-light-subtle dark:text-dark-subtle p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                <p className="font-bold">Disclaimer:</p>
                <p>This is a non-diagnostic screening tool and does not provide medical advice. Consult a licensed dermatologist for any medical concerns.</p>
            </div>
        </div>
    );
};

const CaptureScreen: React.FC<{ onCapture: (data: string) => void }> = ({ onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [useCamera, setUseCamera] = useState(true);
    const [cameraError, setCameraError] = useState<string | null>(null);

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraError(null);
        } catch (err) {
            console.error("Camera access denied:", err);
            setCameraError("Camera access was denied. Please enable it in your browser settings or upload a photo instead.");
            setUseCamera(false);
        }
    }, []);
    
    const stopCamera = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    }, []);

    useEffect(() => {
        if (useCamera) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => {
           stopCamera();
        }
    }, [useCamera, startCamera, stopCamera]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (!context) return;
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL('image/jpeg');
            onCapture(dataUrl.split(',')[1]);
        }
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                onCapture(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="max-w-xl mx-auto p-4 text-center">
             <h2 className="text-3xl font-bold text-light-text dark:text-dark-text mb-2">Capture Your Image</h2>
             <p className="text-light-subtle dark:text-dark-subtle mb-6">For best results: use even lighting, no heavy makeup, and hold steady.</p>
            
            <div className="flex justify-center mb-4 border border-slate-300 dark:border-slate-600 rounded-lg p-1 bg-light-bg dark:bg-dark-bg w-fit mx-auto">
                <button onClick={() => setUseCamera(true)} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${useCamera ? 'bg-brand-primary text-white' : 'text-light-subtle dark:text-dark-subtle'}`}>Use Camera</button>
                <button onClick={() => setUseCamera(false)} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${!useCamera ? 'bg-brand-primary text-white' : 'text-light-subtle dark:text-dark-subtle'}`}>Upload Photo</button>
            </div>

            {cameraError && <p className="text-red-500 text-sm mb-4">{cameraError}</p>}

            {useCamera ? (
                <div className="relative w-full aspect-square bg-slate-200 dark:bg-slate-700 rounded-2xl overflow-hidden shadow-lg mx-auto">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                     <div className="absolute inset-0 border-[20px] border-black/20 rounded-2xl pointer-events-none"></div>
                    <canvas ref={canvasRef} className="hidden" />
                    <button onClick={handleCapture} className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-sm p-4 rounded-full shadow-xl hover:bg-white transition">
                        <CameraIcon className="w-8 h-8 text-brand-primary" />
                    </button>
                </div>
            ) : (
                <div className="w-full aspect-square bg-light-card dark:bg-dark-card rounded-2xl flex flex-col items-center justify-center shadow-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                    <UploadIcon className="w-16 h-16 text-light-subtle dark:text-dark-subtle" />
                    <p className="mt-4 text-light-subtle dark:text-dark-subtle">Select a photo of your face</p>
                    <button onClick={() => fileInputRef.current?.click()} className="mt-4 bg-brand-primary text-white font-bold py-2 px-6 rounded-full hover:bg-brand-secondary transition">
                        Choose File
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                </div>
            )}
        </div>
    );
};

const LiveSummaryDisplay: React.FC<{ summary: ScreeningSummary | null; isAnalyzing: boolean; error: string | null }> = ({ summary, isAnalyzing, error }) => {
    const hasSummary = summary && summary.skin_type;
    return (
        <div className="bg-light-card dark:bg-dark-card p-6 rounded-2xl shadow-lg h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-4 text-light-text dark:text-dark-text">Live Analysis</h2>
            
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            
            {!hasSummary && (
                <div className="flex-grow flex flex-col items-center justify-center text-center">
                    <SparklesIcon className={`w-12 h-12 text-light-subtle dark:text-dark-subtle ${isAnalyzing ? 'animate-pulse text-brand-primary' : ''}`} />
                    <p className="mt-2 text-light-subtle dark:text-dark-subtle">{isAnalyzing ? 'Analyzing...' : 'Point the camera at your face'}</p>
                </div>
            )}

            {hasSummary && (
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-lg">Estimated Skin Type</h3>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-xl font-bold text-brand-primary dark:text-brand-secondary capitalize">{summary.skin_type.label}</span>
                             <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                                <div className="bg-gradient-to-r from-brand-primary to-brand-secondary h-2.5 rounded-full transition-all duration-500" style={{ width: `${summary.skin_type.confidence * 100}%` }}></div>
                            </div>
                            <span className="text-sm font-mono text-light-subtle dark:text-dark-subtle">{(summary.skin_type.confidence * 100).toFixed(0)}%</span>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">Possible Concerns Noted</h3>
                        <div className="space-y-3 mt-2">
                            {summary.possible_concerns.map((concern, i) => (
                                <div key={i}>
                                    <p className="capitalize text-light-text dark:text-dark-text">{concern.label}</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                                            <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${concern.confidence * 100}%` }}></div>
                                        </div>
                                        <span className="text-sm font-mono text-light-subtle dark:text-dark-subtle">{(concern.confidence * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                     {summary.limitations.length > 0 && (
                         <div className="text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 p-2 rounded-lg">
                             <p><span className="font-bold">Limitations:</span> {summary.limitations.join(', ')}</p>
                         </div>
                    )}
                </div>
            )}
        </div>
    );
};

const LiveAnalysisScreen: React.FC<{ profile: UserProfile; onGenerateFullRoutine: (base64Image: string) => void }> = ({ profile, onGenerateFullRoutine }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    const [summary, setSummary] = useState<ScreeningSummary | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [lastGoodFrame, setLastGoodFrame] = useState<string | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraError(null);
        } catch (err) {
            console.error("Camera access denied:", err);
            setCameraError("Camera access was denied. Please enable it in your browser settings.");
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    }, []);
    
    const performAnalysis = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current || isAnalyzing || document.hidden) return;

        const video = videoRef.current;
        if (video.readyState < video.HAVE_ENOUGH_DATA) {
            return;
        }

        setIsAnalyzing(true);
        setAnalysisError(null);
        
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (!context) {
            setIsAnalyzing(false);
            return;
        }
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];

        try {
            const stream = await analyzeSkinStream(base64Image);
            let responseText = "";
            for await (const chunk of stream) {
                responseText += chunk.text;
            }
            if (responseText) {
                const result: ScreeningSummary = JSON.parse(responseText.trim());
                setSummary(result);
                setLastGoodFrame(base64Image);
            }
        } catch (e: any) {
            console.error("Live analysis frame failed:", e);
            setAnalysisError("Could not analyze frame. Retrying...");
        } finally {
            setIsAnalyzing(false);
        }
    }, [isAnalyzing]);

    useEffect(() => {
        startCamera();
        
        let isMounted = true;
        let timeoutId: number;

        const analysisLoop = async () => {
            if (!isMounted) return;

            if (!document.hidden) {
                 await performAnalysis();
            }
           
            if (isMounted) {
                // Schedule the next analysis after the current one completes with a short delay
                // to create a fast, continuous loop.
                timeoutId = window.setTimeout(analysisLoop, 500);
            }
        };

        analysisLoop();

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
            stopCamera();
        };
    }, [startCamera, stopCamera, performAnalysis]);

    const handleGenerate = () => {
        if (lastGoodFrame) {
            onGenerateFullRoutine(lastGoodFrame);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4">
             <h2 className="text-3xl font-bold text-light-text dark:text-dark-text mb-2 text-center">Live Skin Analysis</h2>
             <p className="text-light-subtle dark:text-dark-subtle mb-6 text-center">Adjust your lighting and position for the best results.</p>
             {cameraError && <p className="text-red-500 text-sm mb-4 text-center">{cameraError}</p>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative w-full aspect-square bg-slate-200 dark:bg-slate-700 rounded-2xl overflow-hidden shadow-lg mx-auto">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <div className={`absolute inset-0 border-[10px] rounded-2xl pointer-events-none transition-all duration-500 ${isAnalyzing ? 'border-brand-primary' : 'border-transparent'}`}></div>
                    <canvas ref={canvasRef} className="hidden" />
                </div>
                <div>
                    <LiveSummaryDisplay summary={summary} isAnalyzing={isAnalyzing} error={analysisError} />
                </div>
            </div>

            <div className="text-center mt-8">
                <button 
                    onClick={handleGenerate} 
                    disabled={!lastGoodFrame}
                    className="bg-brand-primary text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-brand-secondary transition-all duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed transform disabled:scale-100 hover:scale-105"
                >
                    Stop & Generate Full Routine
                </button>
            </div>
        </div>
    );
};


const LoadingScreen: React.FC = () => (
    <div className="text-center p-4">
        <SparklesIcon className="w-16 h-16 text-brand-primary mx-auto mb-4 animate-pulse" />
        <h2 className="text-3xl font-bold text-light-text dark:text-dark-text mb-2">Analyzing...</h2>
        <p className="text-light-subtle dark:text-dark-subtle">Our AI is crafting your personalized routine. This might take a moment.</p>
    </div>
);

const ErrorScreen: React.FC<{ error: string, onRetry: () => void }> = ({ error, onRetry }) => (
    <div className="text-center max-w-lg mx-auto p-4">
        <AlertTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">An Error Occurred</h2>
        <p className="text-light-subtle dark:text-dark-subtle bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">{error}</p>
        <button onClick={onRetry} className="mt-6 bg-brand-primary text-white font-bold py-3 px-8 rounded-full hover:bg-brand-secondary transition">
            Try Again
        </button>
    </div>
);


const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>(AppState.Welcome);
    const [results, setResults] = useState<AnalysisResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile>({
        ageRange: '25-34',
        sensitivities: '',
        isPregnantOrBreastfeeding: false,
        budget: 'Mix',
    });

    useEffect(() => {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setIsDarkMode(true);
        }
        
        const modeMe = (e: MediaQueryListEvent) => setIsDarkMode(!!e.matches);
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', modeMe);
        return () => window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', modeMe);
    }, []);


    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);
    
    const handleStart = () => setAppState(AppState.Capture);
    const handleStartLive = () => setAppState(AppState.LiveCapture);

    const handleCapture = async (base64Image: string) => {
        setAppState(AppState.Analyzing);
        try {
            const analysisResults = await analyzeSkin(base64Image, userProfile);
            setResults(analysisResults);
            setAppState(AppState.Results);
        } catch (e: any) {
            setError(e.message || "An unknown error occurred.");
            setAppState(AppState.Error);
        }
    };
    
    const handleReset = () => {
        setResults(null);
        setError(null);
        setAppState(AppState.Welcome);
    };

    const renderContent = () => {
        switch (appState) {
            case AppState.Welcome:
                return <WelcomeScreen onStart={handleStart} onStartLive={handleStartLive} profile={userProfile} setProfile={setUserProfile} />;
            case AppState.Capture:
                return <CaptureScreen onCapture={handleCapture} />;
            case AppState.LiveCapture:
                return <LiveAnalysisScreen profile={userProfile} onGenerateFullRoutine={handleCapture} />;
            case AppState.Analyzing:
                return <LoadingScreen />;
            case AppState.Results:
                return results ? <ResultsDisplay results={results} onReset={handleReset} /> : <ErrorScreen error="No results found." onRetry={handleReset}/>;
            case AppState.Error:
                return <ErrorScreen error={error || 'An unknown error occurred.'} onRetry={handleReset} />;
            default:
                return <WelcomeScreen onStart={handleStart} onStartLive={handleStartLive} profile={userProfile} setProfile={setUserProfile} />;
        }
    };

    return (
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg font-sans transition-colors duration-300">
             <header className="p-4 flex justify-between items-center max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <SparklesIcon className="w-6 h-6 text-brand-primary" />
                    <span className="font-bold text-lg text-light-text dark:text-dark-text">Skincare AI</span>
                </div>
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full bg-light-card dark:bg-dark-card shadow-sm">
                    {isDarkMode ? <SunIcon className="w-5 h-5 text-amber-400" /> : <MoonIcon className="w-5 h-5 text-indigo-500" />}
                </button>
            </header>
            <main className="py-10 md:py-16">
                {renderContent()}
            </main>
        </div>
    );
};

export default App;
