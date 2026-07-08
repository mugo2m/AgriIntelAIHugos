// lib/ai/models/pestModel.ts
// AI Model interfaces for pest, disease, and deficiency detection

export interface AIDetectionResult {
  id: string;
  type: 'pest' | 'disease' | 'deficiency';
  name: string;
  confidence: number; // 0-1 scale
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  recommendations: string[];
  similarMatches?: Array<{
    name: string;
    confidence: number;
  }>;
}

export interface ModelInfo {
  name: string;
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  mAP?: number; // mean Average Precision
  inferenceTime: number; // ms
  modelSize: number; // MB
  supportedCrops: string[];
  supportedClasses: string[];
  lastTrained: string;
}

export interface PestDetectionModel {
  id: 'pest-yolov8s' | 'pest-vit' | 'pest-tinylitenet';
  name: string;
  info: ModelInfo;
  detectPest(imageData: ImageData | File): Promise<AIDetectionResult[]>;
}

export interface DiseaseDetectionModel {
  id: 'disease-cnn' | 'disease-efficientnet' | 'disease-resnet';
  name: string;
  info: ModelInfo;
  detectDisease(imageData: ImageData | File): Promise<AIDetectionResult[]>;
}

export interface DeficiencyDetectionModel {
  id: 'deficiency-yolov8' | 'deficiency-ann' | 'deficiency-cnn';
  name: string;
  info: ModelInfo;
  detectDeficiency(imageData: ImageData | File): Promise<AIDetectionResult[]>;
}