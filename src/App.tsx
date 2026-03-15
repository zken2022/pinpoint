/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ImageUploader } from './components/ImageUploader';
import { AnalysisPanel } from './components/AnalysisPanel';
import { MapDisplay } from './components/MapDisplay';
import { ReportView } from './components/ReportView';
import { HistoryList } from './components/HistoryList';
import { ExifPanel } from './components/ExifPanel';
import { AIProvider, AppSettings, GeoAnalysisResult, AnalysisState, AnalysisHistoryItem, ExifData } from './types';
import { analyzeWithOpenAICompatible } from './services/aiService';
import { Search, History, FileText, AlertCircle, MapPin, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './utils/cn';

export default function App() {
  const [activeTab, setActiveTab] = useState<'analysis' | 'history'>('analysis');
  const [locationTab, setLocationTab] = useState<'ai' | 'exif'>('ai');
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('pinpoint_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('无法解析保存的配置:', e);
      }
    }
    return {
      provider: AIProvider.SILICONFLOW,
      model: 'deepseek-ai/deepseek-vl2',
    };
  });

  const [image, setImage] = useState<string | null>(null);
  const [exif, setExif] = useState<ExifData | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    thinking: '',
    content: '',
    isThinkingCollapsed: false
  });
  const [result, setResult] = useState<GeoAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>(() => {
    const saved = localStorage.getItem('geo_analysis_history');
    return saved ? JSON.parse(saved) : [];
  });

  const saveToHistory = useCallback((img: string, res: GeoAnalysisResult, state: AnalysisState, exifData?: ExifData) => {
    const newItem: AnalysisHistoryItem = {
      id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Date.now().toString(),
      timestamp: Date.now(),
      image: img,
      exif: exifData,
      result: res,
      analysisState: state
    };
    
    setHistory(prev => {
      const updatedHistory = [newItem, ...prev].slice(0, 5); // 限制存储最近 5 条记录以节省空间
      try {
        localStorage.setItem('geo_analysis_history', JSON.stringify(updatedHistory));
      } catch (e) {
        console.warn('LocalStorage quota exceeded, attempting to save fewer items');
        let reducedHistory = updatedHistory;
        while (reducedHistory.length > 1) {
          reducedHistory = reducedHistory.slice(0, -1);
          try {
            localStorage.setItem('geo_analysis_history', JSON.stringify(reducedHistory));
            break;
          } catch (innerE) {
            continue;
          }
        }
        return reducedHistory;
      }
      return updatedHistory;
    });
  }, []);

  const deleteHistoryItem = useCallback((id: string) => {
    setHistory(prev => {
      const updatedHistory = prev.filter(item => item.id !== id);
      try {
        localStorage.setItem('geo_analysis_history', JSON.stringify(updatedHistory));
      } catch (e) {
        console.error('Failed to update localStorage after deletion', e);
      }
      return updatedHistory;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('geo_analysis_history');
  }, []);

  const selectHistoryItem = useCallback((item: AnalysisHistoryItem) => {
    setImage(item.image);
    setExif(item.exif);
    setResult(item.result);
    setAnalysisState(item.analysisState);
    setActiveTab('analysis');
  }, []);

  const handleImageUpload = useCallback((base64: string, exifData?: ExifData) => {
    setImage(base64);
    setExif(exifData);
    setResult(null);
    setAnalysisState({ thinking: '', content: '', isThinkingCollapsed: false });
    setError(null);
    // 无论是否有坐标，上传后首先切换到 EXIF 识别标签页
    setLocationTab('exif');
  }, []);

  const handleClearImage = useCallback(() => {
    setImage(null);
    setExif(undefined);
    setResult(null);
    setAnalysisState({ thinking: '', content: '', isThinkingCollapsed: false });
    setError(null);
  }, []);

  const runAnalysis = async () => {
    if (!image) return;
    
    setIsAnalyzing(true);
    setAnalysisState({ thinking: '', content: '', isThinkingCollapsed: false });
    setResult(null);
    setError(null);

    try {
      let finalResult: GeoAnalysisResult;
      let fullThinking = '';
      let fullContent = '';
      
      const onStream = (chunk: string, type: 'thinking' | 'content') => {
        if (type === 'thinking') fullThinking += chunk;
        else fullContent += chunk;

        setAnalysisState(prev => ({
          ...prev,
          [type]: prev[type as keyof AnalysisState] + chunk
        }));
      };

      finalResult = await analyzeWithOpenAICompatible(image, settings, onStream, exif);

      setResult(finalResult);
      setLocationTab('ai'); // Switch to AI tab after analysis
      saveToHistory(image, finalResult, { 
        thinking: fullThinking, 
        content: fullContent, 
        isThinkingCollapsed: true 
      }, exif);
    } catch (err: any) {
      setError(err.message || '分析过程中发生未知错误');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#F8F9FA]">
      <Sidebar 
        settings={settings} 
        onSettingsChange={setSettings} 
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-1">
              <TabButton 
                active={activeTab === 'analysis'} 
                icon={LayoutDashboard} 
                label="分析结果" 
                onClick={() => setActiveTab('analysis')}
              />
              <TabButton 
                active={activeTab === 'history'} 
                icon={History} 
                label="分析历史列表" 
                onClick={() => setActiveTab('history')}
              />
            </nav>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'analysis' ? (
                <motion.div
                  key="analysis"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  {error && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-sm">
                      <AlertCircle className="w-5 h-5" />
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Image and Reasoning */}
                    <div className="space-y-8">
                      <div className="space-y-4">
                        <ImageUploader 
                          image={image} 
                          exif={exif} 
                          onImageUpload={handleImageUpload} 
                          onClear={handleClearImage}
                          isAnalyzing={isAnalyzing} 
                        />
                        
                        <button
                          onClick={runAnalysis}
                          disabled={!image || isAnalyzing}
                          className="w-full py-4 bg-indigo-600 text-white rounded-xl text-base font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                        >
                          {isAnalyzing ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              分析中...
                            </>
                          ) : (
                            <>
                              <Search className="w-5 h-5" />
                              开始研判
                            </>
                          )}
                        </button>
                      </div>

                      <section className="h-[500px]">
                        <AnalysisPanel 
                          thinking={analysisState.thinking} 
                          content={analysisState.content} 
                          isAnalyzing={isAnalyzing} 
                        />
                      </section>
                    </div>

                    {/* Right Column: Map and Report */}
                    <div className="space-y-8">
                      <section className="h-[450px] glass-card overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-indigo-600" />
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">地理位置</h3>
                          </div>
                          
                          <div className="flex bg-slate-200/50 p-1 rounded-lg">
                            <button
                              onClick={() => setLocationTab('ai')}
                              className={cn(
                                "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                                locationTab === 'ai' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                              )}
                            >
                              AI 推理
                            </button>
                            <button
                              onClick={() => setLocationTab('exif')}
                              className={cn(
                                "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                                locationTab === 'exif' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                              )}
                            >
                              EXIF 识别
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-h-0 relative">
                          {locationTab === 'exif' && (!exif?.lat || !exif?.lng) ? (
                            <div className="absolute inset-0 z-10 bg-slate-50/90 backdrop-blur-sm flex flex-col items-center justify-center text-slate-400 gap-3">
                              <AlertCircle className="w-8 h-8 opacity-20" />
                              <p className="text-sm font-medium">当前图像无 EXIF 坐标信息</p>
                            </div>
                          ) : null}
                          
                          <MapDisplay 
                            center={
                              locationTab === 'ai' 
                                ? (result?.location.coordinates || { lat: 0, lng: 0 })
                                : (exif?.lat && exif?.lng ? { lat: exif.lat, lng: exif.lng } : { lat: 0, lng: 0 })
                            } 
                            zoom={
                              locationTab === 'ai'
                                ? (result ? 18 : 2)
                                : (exif?.lat && exif?.lng ? 18 : 2)
                            } 
                          />
                        </div>
                      </section>

                      <ExifPanel exif={exif} />
                      <ReportView result={result} exif={exif} />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <HistoryList 
                    history={history} 
                    onSelectItem={selectHistoryItem} 
                    onDeleteItem={deleteHistoryItem} 
                    onClearAll={clearHistory}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

const TabButton = ({ active, icon: Icon, label, onClick }: { active?: boolean, icon: any, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
      active 
        ? "bg-slate-100 text-slate-900" 
        : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
    )}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);
