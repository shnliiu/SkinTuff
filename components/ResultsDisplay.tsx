import React, { useState } from 'react';
import type { AnalysisResponse, RoutineStep, Product, WeeklyStep } from '../types';
import { SunIcon, MoonIcon, AlertTriangleIcon, InfoIcon, ChevronDownIcon } from './icons';

const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
    <div className="bg-light-bg dark:bg-dark-bg p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <h4 className="font-semibold text-light-text dark:text-dark-text">{product.name}</h4>
        <p className="text-sm text-brand-primary dark:text-brand-secondary font-medium">${product.price.toFixed(2)} {product.currency}</p>
        <p className="text-xs text-light-subtle dark:text-dark-subtle mt-1 italic">"{product.why_this_pick}"</p>
        <div className="mt-2 flex flex-wrap gap-1">
            {product.key_ingredients.map((ing, i) => (
                <span key={i} className="text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded-full">{ing}</span>
            ))}
        </div>
        <a href={product.link} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-primary dark:text-brand-secondary mt-3 inline-block hover:underline">
            View Product &rarr;
        </a>
    </div>
);

const RoutineStepCard: React.FC<{ step: RoutineStep | WeeklyStep, isAm: boolean | null }> = ({ step, isAm }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    
    return (
        <div className="mb-4">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full text-left bg-light-card dark:bg-dark-card p-4 rounded-xl shadow-sm flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-light-text dark:text-dark-text">{step.step}</h3>
                    {'schedule' in step && step.schedule && <p className="text-sm font-medium text-brand-primary dark:text-brand-secondary">{step.schedule}</p>}
                    {'frequency' in step && step.frequency && <p className="text-sm font-medium text-brand-primary dark:text-brand-secondary">{step.frequency}</p>}
                    {'usage' in step && step.usage && <p className="text-sm text-light-subtle dark:text-dark-subtle mt-1">{step.usage}</p>}
                    {'guardrails' in step && step.guardrails && <p className="text-sm text-light-subtle dark:text-dark-subtle mt-1">{step.guardrails}</p>}
                </div>
                <ChevronDownIcon className={`w-6 h-6 text-light-subtle dark:text-dark-subtle transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            {isExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 px-2">
                    {step.products.map((p, i) => <ProductCard key={i} product={p} />)}
                </div>
            )}
        </div>
    );
};

export const ResultsDisplay: React.FC<{ results: AnalysisResponse; onReset: () => void }> = ({ results, onReset }) => {
    const [activeTab, setActiveTab] = useState<'beneficial' | 'avoid'>('beneficial');

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 text-light-text dark:text-dark-text">
            <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">Your Personal Skin Analysis</h1>
                <p className="text-light-subtle dark:text-dark-subtle mt-2">An AI-powered, non-diagnostic screening for educational purposes.</p>
            </div>

            {/* Screening Summary */}
            <div className="bg-light-card dark:bg-dark-card p-6 rounded-2xl shadow-lg mb-8">
                <h2 className="text-2xl font-bold mb-4">Screening Summary</h2>
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-lg">Estimated Skin Type</h3>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-xl font-bold text-brand-primary dark:text-brand-secondary capitalize">{results.screening_summary.skin_type.label}</span>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                                <div className="bg-gradient-to-r from-brand-primary to-brand-secondary h-2.5 rounded-full" style={{ width: `${results.screening_summary.skin_type.confidence * 100}%` }}></div>
                            </div>
                            <span className="text-sm font-mono text-light-subtle dark:text-dark-subtle">{(results.screening_summary.skin_type.confidence * 100).toFixed(0)}%</span>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">Possible Concerns Noted</h3>
                        <div className="space-y-3 mt-2">
                            {results.screening_summary.possible_concerns.map((concern, i) => (
                                <div key={i}>
                                    <p className="capitalize text-light-text dark:text-dark-text">{concern.label}</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                                            <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full" style={{ width: `${concern.confidence * 100}%` }}></div>
                                        </div>
                                        <span className="text-sm font-mono text-light-subtle dark:text-dark-subtle">{(concern.confidence * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {results.screening_summary.limitations.length > 0 && (
                         <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 p-4 rounded-lg flex items-start gap-3">
                             <InfoIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                             <div>
                                 <h4 className="font-semibold">Analysis Limitations</h4>
                                 <ul className="list-disc list-inside text-sm">
                                     {results.screening_summary.limitations.map((l, i) => <li key={i}>{l}</li>)}
                                 </ul>
                             </div>
                         </div>
                    )}
                </div>
            </div>

            {/* Ingredient Guidance */}
            <div className="bg-light-card dark:bg-dark-card p-6 rounded-2xl shadow-lg mb-8">
                 <h2 className="text-2xl font-bold mb-4">Ingredient Guidance</h2>
                 <div className="border-b border-slate-200 dark:border-slate-700 mb-4">
                     <nav className="-mb-px flex space-x-6">
                         <button onClick={() => setActiveTab('beneficial')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'beneficial' ? 'border-brand-primary text-brand-primary dark:border-brand-secondary dark:text-brand-secondary' : 'border-transparent text-light-subtle hover:text-light-text dark:text-dark-subtle dark:hover:text-dark-text'}`}>Beneficial</button>
                         <button onClick={() => setActiveTab('avoid')} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'avoid' ? 'border-brand-primary text-brand-primary dark:border-brand-secondary dark:text-brand-secondary' : 'border-transparent text-light-subtle hover:text-light-text dark:text-dark-subtle dark:hover:text-dark-text'}`}>Avoid or Limit</button>
                     </nav>
                 </div>
                 {activeTab === 'beneficial' && (
                     <ul className="space-y-3">
                         {results.ingredient_guidance.beneficial.map((ing, i) => (
                             <li key={i} className="p-3 bg-light-bg dark:bg-dark-bg rounded-lg">
                                 <p className="font-semibold">{ing.ingredient}</p>
                                 <p className="text-sm text-light-subtle dark:text-dark-subtle">{ing.why}</p>
                             </li>
                         ))}
                     </ul>
                 )}
                 {activeTab === 'avoid' && (
                     <ul className="space-y-3">
                         {results.ingredient_guidance.avoid_or_limit.map((ing, i) => (
                              <li key={i} className="p-3 bg-light-bg dark:bg-dark-bg rounded-lg">
                                 <p className="font-semibold">{ing.ingredient}</p>
                                 <p className="text-sm text-light-subtle dark:text-dark-subtle">{ing.reason}</p>
                             </li>
                         ))}
                     </ul>
                 )}
                 {results.ingredient_guidance.interaction_warnings.length > 0 && (
                    <div className="mt-6 bg-rose-50 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 p-4 rounded-lg flex items-start gap-3">
                        <AlertTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold">Interaction Warnings</h4>
                            <ul className="list-disc list-inside text-sm">
                                {results.ingredient_guidance.interaction_warnings.map((w, i) => <li key={i}>{w}</li>)}
                            </ul>
                        </div>
                    </div>
                 )}
            </div>

            {/* Routines */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-center">Your Personalized Routine</h2>
                {/* AM Routine */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <SunIcon className="w-8 h-8 text-amber-500" />
                        <h3 className="text-2xl font-bold">AM Routine</h3>
                    </div>
                    {results.routines.AM.map((step, i) => <RoutineStepCard key={i} step={step} isAm={true} />)}
                </div>
                {/* PM Routine */}
                <div className="mb-8">
                     <div className="flex items-center gap-3 mb-4">
                        <MoonIcon className="w-8 h-8 text-indigo-400" />
                        <h3 className="text-2xl font-bold">PM Routine</h3>
                    </div>
                    {results.routines.PM.map((step, i) => <RoutineStepCard key={i} step={step} isAm={false} />)}
                </div>
                 {/* Weekly Routine */}
                 {results.routines.weekly.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <h3 className="text-2xl font-bold">Weekly Treatments</h3>
                        </div>
                        {results.routines.weekly.map((step, i) => <RoutineStepCard key={i} step={step} isAm={null} />)}
                    </div>
                 )}
            </div>
            
            {/* Follow Up & Disclaimer */}
            <div className="space-y-6 text-sm">
                <div className="bg-light-card dark:bg-dark-card p-6 rounded-2xl shadow-lg">
                    <h3 className="font-bold text-lg mb-2">Important Next Steps</h3>
                    <p><span className="font-semibold">Patch Testing:</span> {results.follow_up.patch_test_instructions}</p>
                    <div className="mt-2">
                         <p className="font-semibold">What to Expect:</p>
                         <ul className="list-disc list-inside text-light-subtle dark:text-dark-subtle">
                           {results.follow_up.what_to_expect.map((item, i) => <li key={i}>{item}</li>)}
                         </ul>
                    </div>
                </div>

                <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-800 dark:text-red-200 p-4" role="alert">
                    <p className="font-bold">When to See a Dermatologist</p>
                    <ul className="list-disc list-inside mt-1">
                        {results.follow_up.when_to_seek_dermatology.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </div>

                <div className="text-center text-xs text-light-subtle dark:text-dark-subtle p-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="font-bold">DISCLAIMER</p>
                    <p>{results.disclaimer}</p>
                </div>
            </div>

            <div className="text-center mt-8">
                <button onClick={onReset} className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-6 rounded-full transition-colors duration-300">
                    Analyze Again
                </button>
            </div>
        </div>
    );
};