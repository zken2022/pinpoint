/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum AIProvider {
  SILICONFLOW = 'siliconflow',
  OLLAMA = 'ollama',
}

export interface GeoAnalysisResult {
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  confidence: number;
  reasoning: string;
  features: {
    architecture?: string;
    vegetation?: string;
    infrastructure?: string;
    climate?: string;
    language?: string;
  };
}

export interface AppSettings {
  provider: AIProvider;
  model: string;
  modelPath?: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface AnalysisStep {
  title: string;
  content: string;
  status: 'pending' | 'processing' | 'completed';
}

export interface AnalysisState {
  thinking: string;
  content: string;
  isThinkingCollapsed: boolean;
}

export interface ExifData {
  make?: string;
  model?: string;
  software?: string;
  dateTime?: string;
  lat?: number;
  lng?: number;
  altitude?: number;
  exposureTime?: string;
  fNumber?: string;
  iso?: number;
  focalLength?: string;
}

export interface AnalysisHistoryItem {
  id: string;
  timestamp: number;
  image: string;
  exif?: ExifData;
  result: GeoAnalysisResult;
  analysisState: AnalysisState;
}
