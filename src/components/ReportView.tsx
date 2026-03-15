import React from 'react';
import { MapPin, Target, Building2, TreePine, Info, Languages, CloudSun, Copy, FileText, Zap, Trees, Cloud, Camera } from 'lucide-react';
import { GeoAnalysisResult, ExifData } from '../types';
import { motion } from 'motion/react';
import { cn } from '../utils/cn';

interface ReportViewProps {
  result: GeoAnalysisResult | null;
  exif?: ExifData;
}

export const ReportView: React.FC<ReportViewProps> = ({ result, exif }) => {
  if (!result) {
    return (
      <div className="glass-card p-12 flex flex-col items-center justify-center text-slate-400 gap-4">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
          <FileText className="w-10 h-10 opacity-20" />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-slate-600">暂无研判报告</p>
          <p className="text-sm mt-1">上传图片并开始研判以生成详细报告</p>
        </div>
      </div>
    );
  }

  const confidence = typeof result.confidence === 'number' && !isNaN(result.confidence) ? result.confidence : 0;
  const confidenceColor = confidence > 0.8 ? 'text-emerald-600' : confidence > 0.5 ? 'text-amber-600' : 'text-rose-600';
  const confidenceBg = confidence > 0.8 ? 'bg-emerald-50' : confidence > 0.5 ? 'bg-amber-50' : 'bg-rose-50';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Detailed Report Header */}
      <div className="glass-card flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">研判报告详情</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5", confidenceBg, confidenceColor)}>
              <Target className="w-3 h-3" />
              置信度 {Math.round(confidence * 100)}%
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* EXIF Data Section */}
          {exif && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-indigo-600 rounded-full" />
                <h4 className="text-sm font-bold text-slate-900">图像元数据 (EXIF)</h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <ExifItem icon={Camera} label="设备" value={exif.model} />
                <ExifItem icon={CloudSun} label="拍摄时间" value={exif.dateTime} />
                <ExifItem icon={MapPin} label="GPS 坐标" value={exif.lat ? `${exif.lat.toFixed(4)}, ${exif.lng?.toFixed(4)}` : undefined} />
                <ExifItem icon={Zap} label="曝光/光圈" value={exif.exposureTime ? `${exif.exposureTime} @ ${exif.fNumber}` : undefined} />
                <ExifItem icon={Info} label="软件" value={exif.software} />
                <ExifItem icon={Target} label="海拔" value={exif.altitude ? `${exif.altitude.toFixed(1)}m` : undefined} />
              </div>
            </section>
          )}

          {/* Location Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-indigo-600 rounded-full" />
              <h4 className="text-sm font-bold text-slate-900">推测地理位置</h4>
            </div>
            <div className="p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100/50 flex items-start gap-4">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 mb-1">{result.location.address}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
                  <span className="bg-white px-2 py-1 rounded border border-slate-100">LAT: {result.location.coordinates.lat.toFixed(6)}</span>
                  <span className="bg-white px-2 py-1 rounded border border-slate-100">LNG: {result.location.coordinates.lng.toFixed(6)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Reasoning Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-indigo-600 rounded-full" />
              <h4 className="text-sm font-bold text-slate-900">研判依据摘要</h4>
            </div>
            <div className="relative">
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100 italic">
                "{result.reasoning}"
              </p>
              <div className="absolute -top-2 -left-2 w-6 h-6 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-300">
                <Info className="w-3 h-3" />
              </div>
            </div>
          </section>

          {/* Features Vertical List */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-indigo-600 rounded-full" />
              <h4 className="text-sm font-bold text-slate-900">环境特征深度分析</h4>
            </div>
            <div className="flex flex-col gap-4">
              <FeatureCard icon={Building2} label="建筑风格" value={result.features.architecture} />
              <FeatureCard icon={Trees} label="植被特征" value={result.features.vegetation} />
              <FeatureCard icon={Zap} label="基础设施" value={result.features.infrastructure} />
              <FeatureCard icon={Languages} label="语言文字" value={result.features.language} />
              <FeatureCard icon={Cloud} label="气候环境" value={result.features.climate} />
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
};

const FeatureCard = ({ icon: Icon, label, value }: { icon: any, label: string, value?: string }) => (
  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col h-full hover:bg-white hover:shadow-sm transition-all duration-300">
    <div className="flex items-center gap-2 text-slate-500 mb-2 shrink-0">
      <Icon className="w-4 h-4 text-indigo-500" />
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
    <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{value || '未识别'}</p>
  </div>
);

const ExifItem = ({ icon: Icon, label, value }: { icon: any, label: string, value?: string }) => (
  <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex flex-col gap-1">
    <div className="flex items-center gap-1.5 text-slate-400">
      <Icon className="w-3 h-3" />
      <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-xs font-bold text-slate-700 truncate">{value || '未知'}</p>
  </div>
);
