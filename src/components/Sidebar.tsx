import React, { useState, useEffect, useRef } from 'react';
import { Settings, Shield, Cpu, Key, Compass, CheckCircle2, AlertCircle, Loader2, Zap, MessageSquare } from 'lucide-react';
import { AIProvider, AppSettings } from '../types';
import { cn } from '../utils/cn';

interface ModelInfo {
  id: string;
  isMultimodal: boolean;
}

interface SidebarProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ settings, onSettingsChange }) => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const providers = [
    { id: AIProvider.SILICONFLOW, name: 'SiliconFlow（使用云端模型）', icon: Cpu },
    { id: AIProvider.OLLAMA, name: 'Ollama（使用本地模型）', icon: Shield },
  ];

  const updateSetting = (key: keyof AppSettings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
    setSaveSuccess(false);
  };

  const saveSettings = () => {
    localStorage.setItem('pinpoint_settings', JSON.stringify(settings));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handlePathSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const path = files[0].webkitRelativePath.split('/')[0] || '本地路径';
      updateSetting('modelPath', path);
      verifyApiKey();
    }
  };

  const verifyApiKey = async () => {
    // For Ollama, we don't strictly need an API key, but we use this function to fetch models
    if (settings.provider === AIProvider.SILICONFLOW && !settings.apiKey) {
      setVerifyError('请输入 API Key');
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);

    try {
      const baseUrl = settings.baseUrl || (settings.provider === AIProvider.SILICONFLOW ? 'https://api.siliconflow.cn/v1' : 'http://localhost:11434/v1');
      
      // Ollama uses /api/tags for model list, while OpenAI-compatible uses /models
      const endpoint = settings.provider === AIProvider.OLLAMA ? `${baseUrl.replace(/\/v1$/, '')}/api/tags` : `${baseUrl}/models`;
      
      const headers: any = {};
      if (settings.apiKey) {
        headers['Authorization'] = `Bearer ${settings.apiKey}`;
      }

      const response = await fetch(endpoint, { headers });

      if (!response.ok) {
        throw new Error('连接失败，请检查接口地址或服务状态');
      }

      const data = await response.json();
      let modelList: ModelInfo[] = [];

      const checkMultimodal = (id: string) => {
        const lowerId = id.toLowerCase();
        return lowerId.includes('vl') || 
               lowerId.includes('vision') || 
               lowerId.includes('multimodal') ||
               lowerId.includes('gpt-4o') ||
               lowerId.includes('claude-3') ||
               lowerId.includes('gemini');
      };

      if (settings.provider === AIProvider.SILICONFLOW) {
        modelList = data.data.map((m: any) => ({
          id: m.id,
          isMultimodal: checkMultimodal(m.id)
        }));
      } else if (settings.provider === AIProvider.OLLAMA) {
        // Ollama response format is { models: [{ name: '...' }] }
        modelList = data.models.map((m: any) => ({
          id: m.name,
          isMultimodal: checkMultimodal(m.name)
        }));
      } else {
        modelList = data.data.map((m: any) => ({
          id: m.id,
          isMultimodal: checkMultimodal(m.id)
        }));
      }

      setModels(modelList);
      if (modelList.length > 0 && !modelList.some(m => m.id === settings.model)) {
        updateSetting('model', modelList[0].id);
      }
    } catch (err: any) {
      setVerifyError(err.message);
      setModels([]);
    } finally {
      setIsVerifying(false);
    }
  };

  // Reset models when provider changes
  useEffect(() => {
    setModels([]);
    setVerifyError(null);
  }, [settings.provider]);

  return (
    <div className="w-80 h-full bg-white border-r border-slate-200 p-6 flex flex-col gap-8 overflow-y-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
          <Compass className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">图钉 · PinPoint</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">让像素，归于经纬</p>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between text-slate-900 font-semibold text-sm">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <h2>AI 配置</h2>
          </div>
          <button
            onClick={saveSettings}
            className={cn(
              "px-3 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1",
              saveSuccess 
                ? "bg-emerald-100 text-emerald-700" 
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            )}
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-3 h-3" />
                已保存
              </>
            ) : (
              <>
                <Zap className="w-3 h-3" />
                保存配置
              </>
            )}
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-500">服务商</label>
          <div className="grid grid-cols-1 gap-2">
            {providers.map((p) => (
              <button
                key={p.id}
                onClick={() => updateSetting('provider', p.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  settings.provider === p.id 
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200" 
                    : "bg-slate-50 text-slate-600 border border-transparent hover:bg-slate-100"
                )}
              >
                <p.icon className="w-4 h-4" />
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Provider Specific Settings */}
        {settings.provider === AIProvider.OLLAMA ? (
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500">选择本地模型文件地址</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={settings.modelPath || ''}
                  placeholder="点击选择路径..."
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePathSelect}
                  className="hidden"
                  // @ts-ignore
                  webkitdirectory=""
                  directory=""
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-500">本地模型的选择列表</label>
                <button
                  onClick={verifyApiKey}
                  disabled={isVerifying}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {isVerifying ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  刷新列表
                </button>
              </div>
              {models.length > 0 ? (
                <div className="relative">
                  <select
                    value={settings.model}
                    onChange={(e) => updateSetting('model', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none"
                  >
                    {models.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.isMultimodal ? '🖼️ ' : '📝 '} {m.id}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <Settings className="w-3 h-3" />
                  </div>
                </div>
              ) : (
                <input
                  type="text"
                  value={settings.model}
                  onChange={(e) => updateSetting('model', e.target.value)}
                  placeholder="请先选择路径或手动输入"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              )}
              {verifyError && (
                <p className="text-[10px] text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {verifyError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500">接口地址的入口</label>
              <input
                type="text"
                value={settings.baseUrl || ''}
                onChange={(e) => updateSetting('baseUrl', e.target.value)}
                placeholder="http://localhost:11434/v1"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-500">API 密钥</label>
                <Key className="w-3 h-3 text-slate-400" />
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={settings.apiKey || ''}
                  onChange={(e) => updateSetting('apiKey', e.target.value)}
                  placeholder="请输入 API Key"
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  onClick={verifyApiKey}
                  disabled={isVerifying || !settings.apiKey}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1 shrink-0"
                >
                  {isVerifying ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  鉴权
                </button>
              </div>
              {verifyError && (
                <p className="text-[10px] text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {verifyError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500">模型选择</label>
              {models.length > 0 ? (
                <div className="relative">
                  <select
                    value={settings.model}
                    onChange={(e) => updateSetting('model', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none"
                  >
                    {models.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.isMultimodal ? '🖼️ ' : '📝 '} {m.id}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <Settings className="w-3 h-3" />
                  </div>
                </div>
              ) : (
                <input
                  type="text"
                  value={settings.model}
                  onChange={(e) => updateSetting('model', e.target.value)}
                  placeholder="请先鉴权以获取模型"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
