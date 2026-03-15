import React, { useState, useEffect } from 'react';
import { Info, Camera, MapPin, Calendar, Layers, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { ExifData } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ExifPanelProps {
  exif?: ExifData;
}

export const ExifPanel: React.FC<ExifPanelProps> = ({ exif }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // 如果没有 EXIF 信息，默认收起；如果有，默认展开
    setIsCollapsed(!exif);
  }, [exif]);

  const sections = exif ? [
    {
      title: '设备信息',
      icon: Camera,
      items: [
        { label: '制造商', value: exif.make },
        { label: '型号', value: exif.model },
        { label: '软件', value: exif.software },
      ]
    },
    {
      title: '拍摄参数',
      icon: Layers,
      items: [
        { label: '曝光时间', value: exif.exposureTime },
        { label: '光圈值', value: exif.fNumber },
        { label: 'ISO 感光度', value: exif.iso },
        { label: '焦距', value: exif.focalLength },
      ]
    },
    {
      title: '地理位置',
      icon: MapPin,
      items: [
        { label: '纬度', value: exif.lat?.toFixed(6) },
        { label: '经度', value: exif.lng?.toFixed(6) },
        { label: '海拔', value: exif.altitude ? `${exif.altitude.toFixed(2)}m` : undefined },
      ]
    },
    {
      title: '时间信息',
      icon: Calendar,
      items: [
        { label: '拍摄时间', value: exif.dateTime },
      ]
    }
  ] : [];

  return (
    <div className="glass-card flex flex-col overflow-hidden transition-all duration-300">
      <div 
        className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 cursor-pointer hover:bg-slate-100/50 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
            EXIF 信息展示
            {!exif && <span className="text-[10px] font-medium text-slate-400 normal-case tracking-normal">(当前图像无 EXIF 信息)</span>}
          </h3>
        </div>
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>
      
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-6 space-y-6">
              {!exif ? (
                <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <AlertCircle className="w-10 h-10 opacity-20" />
                  <p className="text-sm font-medium">当前图像无 EXIF 信息</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sections.map((section, idx) => {
                    const hasData = section.items.some(item => item.value !== undefined && item.value !== null);
                    if (!hasData) return null;

                    return (
                      <motion.div 
                        key={section.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                          <section.icon className="w-3 h-3 text-indigo-500" />
                          {section.title}
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {section.items.map(item => item.value && (
                            <div key={item.label} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                              <span className="text-[10px] font-medium text-slate-500">{item.label}</span>
                              <span className="text-[11px] font-bold text-slate-900 truncate max-w-[150px]">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
