import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Terminal, CheckCircle2, Loader2, ChevronDown, ChevronUp, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';

interface AnalysisPanelProps {
  thinking: string;
  content: string;
  isAnalyzing: boolean;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ thinking, content, isAnalyzing }) => {
  const [isThinkingCollapsed, setIsThinkingCollapsed] = useState(false);

  return (
    <div className="flex flex-col h-full glass-card">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2 text-slate-900 font-semibold">
          <Terminal className="w-4 h-4 text-indigo-600" />
          <h2>推理依据</h2>
        </div>
        {isAnalyzing && (
          <div className="flex items-center gap-2 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-[10px] font-bold uppercase tracking-wider animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            处理中
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 font-mono text-sm leading-relaxed text-slate-700 space-y-4">
        {!thinking && !content && !isAnalyzing ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
            <Terminal className="w-12 h-12 opacity-20" />
            <p>上传图片以开始分析</p>
          </div>
        ) : (
          <>
            {/* Collapsible Thinking Block */}
            <AnimatePresence>
              {thinking && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-indigo-100 rounded-xl overflow-hidden bg-indigo-50/30"
                >
                  <button
                    onClick={() => setIsThinkingCollapsed(!isThinkingCollapsed)}
                    className="w-full px-4 py-2 flex items-center justify-between bg-indigo-50/50 hover:bg-indigo-50 transition-colors text-indigo-700 font-medium text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="w-3.5 h-3.5" />
                      <span>推理依据</span>
                    </div>
                    {isThinkingCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                  </button>
                  
                  {!isThinkingCollapsed && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="px-4 py-3 text-slate-600 border-t border-indigo-100/50"
                    >
                      <ReactMarkdown>{thinking}</ReactMarkdown>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="markdown-body prose prose-slate prose-sm max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
              {isAnalyzing && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="inline-block w-2 h-4 bg-indigo-600 ml-1 align-middle"
                />
              )}
            </div>
          </>
        )}
      </div>

      {content && !isAnalyzing && (
        <div className="px-6 py-3 border-t border-slate-100 bg-emerald-50/30 flex items-center gap-2 text-emerald-700 text-xs font-medium">
          <CheckCircle2 className="w-3 h-3" />
          分析完成
        </div>
      )}
    </div>
  );
};
