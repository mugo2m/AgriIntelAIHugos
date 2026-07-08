// lib/ai/inference/edgeInference.ts
// Edge-based inference for offline use

export class EdgeInference {
  private model: any; // TensorFlow Lite model
  private modelLoaded: boolean = false;
  private readonly MODEL_PATH = '/models/plant_disease_tfmodel.tflite';
  private readonly LABELS_PATH = '/models/plant_labels.txt';

  async loadModel() {
    try {
      // Load TensorFlow Lite model
      const modelResponse = await fetch(this.MODEL_PATH);
      const modelBuffer = await modelResponse.arrayBuffer();

      // Initialize TFLite interpreter
      this.model = await tflite.loadModel(modelBuffer);
      this.modelLoaded = true;

      console.log('Edge model loaded successfully - 1.2MB size [citation:1]');
    } catch (error) {
      console.error('Failed to load edge model:', error);
      throw new Error('AI model not available offline');
    }
  }

  async detectOffline(imageElement: HTMLImageElement): Promise<AIDetectionResult[]> {
    if (!this.modelLoaded) {
      await this.loadModel();
    }

    // Preprocess image for model input
    const processedImage = await this.preprocessImage(imageElement);

    // Run inference (3.46ms per image for YOLOv8s [citation:9])
    const predictions = this.model.predict(processedImage);

    // Parse results
    const results: AIDetectionResult[] = [];
    const labels = await this.getLabels();

    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i].confidence > 0.5) { // 50% confidence threshold
        results.push({
          id: `edge-${i}`,
          type: this.determineType(labels[i]),
          name: labels[i],
          confidence: predictions[i].confidence,
          recommendations: this.getCachedRecommendations(labels[i])
        });
      }
    }

    return results;
  }

  private async preprocessImage(image: HTMLImageElement): Promise<any> {
    // Resize to model input size (usually 224x224 or 256x256)
    const canvas = document.createElement('canvas');
    canvas.width = 224;
    canvas.height = 224;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(image, 0, 0, 224, 224);

    // Normalize pixel values (0-1)
    const imageData = ctx?.getImageData(0, 0, 224, 224);
    return this.normalizeImage(imageData);
  }

  private async getLabels(): Promise<string[]> {
    const response = await fetch(this.LABELS_PATH);
    const text = await response.text();
    return text.split('\n').filter(l => l.trim());
  }

  private determineType(label: string): 'pest' | 'disease' | 'deficiency' {
    const lower = label.toLowerCase();
    if (lower.includes('blight') || lower.includes('rot') || lower.includes('mildew') || lower.includes('virus')) {
      return 'disease';
    }
    if (lower.includes('aphid') || lower.includes('worm') || lower.includes('borer') || lower.includes('beetle')) {
      return 'pest';
    }
    if (lower.includes('deficiency') || lower.includes('nitrogen') || lower.includes('phosphorus') || lower.includes('potassium')) {
      return 'deficiency';
    }
    return 'disease'; // default
  }

  private getCachedRecommendations(label: string): string[] {
    // Cache common recommendations for offline use
    const cache: Record<string, string[]> = {
      'Blight': ['Apply copper-based fungicides', 'Remove infected leaves', 'Ensure air circulation'],
      'Rust': ['Apply sulfur fungicides', 'Avoid overhead irrigation'],
      'Nitrogen Deficiency': ['Apply UREA or CAN', 'Side-dress near plants']
    };
    return cache[label] || ['Consult when online for specific recommendations'];
  }
}