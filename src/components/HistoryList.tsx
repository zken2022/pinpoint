import React from 'react';
import { AnalysisHistoryItem } from '../types';
import { Clock, MapPin, ChevronRight, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface HistoryListProps {
  history: AnalysisHistoryItem[];
  onSelectItem: (item: AnalysisHistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onSelectItem, onDeleteItem, onClearAll }) => {
  const [isConfirmingClear, setIsConfirmingClear] = React.useState(false);

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
        <Clock className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-lg font-medium">暂无分析历史记录</p>
        <p className="text-sm">完成一次研判后，结果将自动保存在此处</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">分析历史记录</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">共 {history.length} 条记录</span>
          {isConfirmingClear ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClearAll();
                  setIsConfirmingClear(false);
                }}
                className="px-3 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
              >
                确认清空
              </button>
              <button
                onClick={() => setIsConfirmingClear(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsConfirmingClear(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              清空全部
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {history.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-all cursor-pointer flex h-32"
            onClick={() => onSelectItem(item)}
          >
            {/* Thumbnail */}
            <div className="w-48 h-full shrink-0 overflow-hidden bg-slate-100">
              <img 
                src={item.image} 
                alt="History" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Info */}
            <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">
                      {new Date(item.timestamp).toLocaleString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase">
                    置信度 {Math.round(item.result.confidence * 100)}%
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-900 truncate mb-1">
                  {item.result.location.address}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {item.result.reasoning}
                </p>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <MapPin className="w-3 h-3" />
                <span>{item.result.location.coordinates.lat.toFixed(4)}, {item.result.location.coordinates.lng.toFixed(4)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteItem(item.id);
                }}
                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                title="删除记录"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="p-2 text-slate-300 group-hover:text-indigo-600 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
