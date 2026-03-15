import React, { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, X, Maximize2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import EXIF from 'exif-js';
import { ExifData } from '../types';

interface ImageUploaderProps {
  image?: string | null;
  exif?: ExifData | null;
  onImageUpload: (base64: string, exif?: ExifData) => void;
  onClear?: () => void;
  isAnalyzing: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ image, exif, onImageUpload, onClear, isAnalyzing }) => {
  const [preview, setPreview] = useState<string | null>(image || null);
  const [exifData, setExifData] = useState<ExifData | null>(exif || null);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with external props (e.g. from history)
  useEffect(() => {
    if (image !== undefined) {
      setPreview(image);
    }
  }, [image]);

  useEffect(() => {
    if (exif !== undefined) {
      setExifData(exif || null);
    }
  }, [exif]);

  const extractExif = (file: File): Promise<ExifData | undefined> => {
    return new Promise((resolve) => {
      // 设置 2秒超时，防止 EXIF 解析挂起
      const timeout = setTimeout(() => {
        console.warn('EXIF 提取超时');
        resolve(undefined);
      }, 2000);

      try {
        EXIF.getData(file as any, function(this: any) {
          clearTimeout(timeout);
          const allMetaData = EXIF.getAllTags(this);
          if (!allMetaData || Object.keys(allMetaData).length === 0) {
            resolve(undefined);
            return;
          }
          // ... 保持原有解析逻辑 ...
          const lat = EXIF.getTag(this, "GPSLatitude");
          const latRef = EXIF.getTag(this, "GPSLatitudeRef");
          const lng = EXIF.getTag(this, "GPSLongitude");
          const lngRef = EXIF.getTag(this, "GPSLongitudeRef");

          let latitude: number | undefined;
          let longitude: number | undefined;

          if (lat && latRef) {
            latitude = lat[0] + lat[1] / 60 + lat[2] / 3600;
            if (latRef === "S") latitude = -latitude;
          }

          if (lng && lngRef) {
            longitude = lng[0] + lng[1] / 60 + lng[2] / 3600;
            if (lngRef === "W") longitude = -longitude;
          }

          const data: ExifData = {
            make: allMetaData.Make,
            model: allMetaData.Model,
            software: allMetaData.Software,
            dateTime: allMetaData.DateTime,
            lat: latitude,
            lng: longitude,
            altitude: allMetaData.GPSAltitude ? (allMetaData.GPSAltitude.numerator / allMetaData.GPSAltitude.denominator) : undefined,
            exposureTime: allMetaData.ExposureTime ? `${allMetaData.ExposureTime.numerator}/${allMetaData.ExposureTime.denominator}` : undefined,
            fNumber: allMetaData.FNumber ? `f/${allMetaData.FNumber.numerator / allMetaData.FNumber.denominator}` : undefined,
            iso: allMetaData.ISOSpeedRatings,
            focalLength: allMetaData.FocalLength ? `${allMetaData.FocalLength.numerator / allMetaData.FocalLength.denominator}mm` : undefined,
          };
          resolve(data);
        });
      } catch (e) {
        clearTimeout(timeout);
        console.error('EXIF.getData 错误:', e);
        resolve(undefined);
      }
    });
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    // 1. 立即开始读取图片用于预览，不等待 EXIF 解析
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      
      // 2. 异步解析 EXIF，解析完成后再通知父组件
      try {
        const exif = await extractExif(file);
        setExifData(exif || null);
        onImageUpload(base64, exif);
      } catch (error) {
        console.error('EXIF 提取失败:', error);
        setExifData(null);
        onImageUpload(base64, undefined);
      }
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const clearImage = () => {
    setPreview(null);
    setExifData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClear?.();
  };

  return (
    <div className="w-full glass-card overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
        <ImageIcon className="w-4 h-4 text-indigo-600" />
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">图像上传</h3>
      </div>
      <div className="p-6">
        <AnimatePresence mode="wait">
          {!preview ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onDragOver={(e) => { 
                e.preventDefault(); 
                e.stopPropagation();
                setIsDragging(true); 
                if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDrop(e);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200",
                isDragging 
                  ? "border-indigo-600 bg-indigo-50/50" 
                  : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50"
              )}
            >
              <Upload className={cn("w-10 h-10 mb-4 transition-colors", isDragging ? "text-indigo-600" : "text-slate-400")} />
              <p className="text-sm font-medium text-slate-600">点击或拖拽文件到此处上传图像</p>
              <p className="text-xs text-slate-400 mt-1">支持 JPG, PNG, WEBP</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={onFileChange}
                accept="image/*"
                className="hidden"
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-video group"
            >
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              
              {isAnalyzing && <div className="scan-line" />}
              
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <button
                  onClick={(e) => { e.stopPropagation(); setIsFullScreen(true); }}
                  className="p-3 bg-white/90 rounded-full text-slate-900 hover:bg-white transition-all hover:scale-110 shadow-lg"
                  title="全屏查看"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); clearImage(); }}
                  className="p-3 bg-white/90 rounded-full text-rose-600 hover:bg-white transition-all hover:scale-110 shadow-lg"
                  title="移除图片"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="absolute bottom-4 left-4 flex flex-col gap-2">
                <div className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-full flex items-center gap-2 w-fit">
                  <ImageIcon className="w-4 h-4 text-white" />
                  <span className="text-xs font-medium text-white">图片已载入</span>
                </div>
                
                {exifData && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="px-3 py-2 bg-indigo-600/90 backdrop-blur-md rounded-xl flex flex-col gap-1 border border-white/20 shadow-xl"
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/70 uppercase tracking-wider">
                      <Info className="w-3 h-3" />
                      EXIF 数据已提取
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                      {exifData.model && <div className="text-[10px] text-white/90 truncate"><span className="opacity-60">设备:</span> {exifData.model}</div>}
                      {exifData.dateTime && <div className="text-[10px] text-white/90 truncate"><span className="opacity-60">时间:</span> {exifData.dateTime.split(' ')[0]}</div>}
                      {exifData.lat && <div className="text-[10px] text-white/90 truncate"><span className="opacity-60">坐标:</span> {exifData.lat.toFixed(4)}, {exifData.lng?.toFixed(4)}</div>}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Full Screen Modal */}
      <AnimatePresence>
        {isFullScreen && preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
            onClick={() => setIsFullScreen(false)}
          >
            <button
              onClick={() => setIsFullScreen(false)}
              className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              src={preview}
              alt="Full Screen"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
