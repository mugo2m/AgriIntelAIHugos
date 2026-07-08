// lib/ai/inference/cloudInference.ts
// Cloud-based inference using YOLOv8 models

export class YOLOv8Inference {
  private apiEndpoint: string;
  private apiKey: string;

  constructor() {
    this.apiEndpoint = process.env.AI_MODEL_API || 'https://api.agriai.com/v1';
    this.apiKey = process.env.AI_MODEL_API_KEY || '';
  }

  async detectPestYOLOv8(imageFile: File): Promise<AIDetectionResult[]> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('model', 'yolov8s-pest');

    try {
      const response = await fetch(`${this.apiEndpoint}/detect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      const data = await response.json();

      // Map to our interface
      return data.detections.map((det: any) => ({
        id: det.class_id.toString(),
        type: 'pest',
        name: det.class_name,
        confidence: det.confidence,
        boundingBox: det.bbox,
        recommendations: this.getPestRecommendations(det.class_name),
        similarMatches: det.similar_matches
      }));
    } catch (error) {
      console.error('YOLOv8 inference error:', error);
      throw new Error('Failed to analyze image');
    }
  }

  async detectDeficiencyYOLOv8(imageFile: File): Promise<AIDetectionResult[]> {
    // YOLOv8s achieves 98.51% mAP for N, P, K deficiency detection [citation:9]
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('model', 'yolov8s-deficiency');

    const response = await fetch(`${this.apiEndpoint}/detect`, formData);
    const data = await response.json();

    return data.detections.map((det: any) => ({
      id: `deficiency-${det.class_name.toLowerCase()}`,
      type: 'deficiency',
      name: this.mapNutrientName(det.class_name),
      confidence: det.confidence,
      recommendations: this.getDeficiencyRecommendations(det.class_name)
    }));
  }

  private mapNutrientName(classId: string): string {
    const mapping: Record<string, string> = {
      'N': 'Nitrogen Deficiency',
      'P': 'Phosphorus Deficiency',
      'K': 'Potassium Deficiency',
      'Mg': 'Magnesium Deficiency',
      'Fe': 'Iron Deficiency',
      'Zn': 'Zinc Deficiency',
      'Mn': 'Manganese Deficiency'
    };
    return mapping[classId] || `Deficiency: ${classId}`;
  }

  private getPestRecommendations(pestName: string): string[] {
    // Use your existing pestDiseaseMapping data
    const pestData = cropPestDiseaseMap[pestName.toLowerCase()];
    if (pestData) {
      return pestData.chemicalControls.map(c =>
        `${c.productName}: ${c.rate}, ${c.timing}`
      );
    }
    return ['Consult local agricultural extension for control options'];
  }

  private getDeficiencyRecommendations(deficiency: string): string[] {
    // Use your existing nutrientDeficiency data
    const deficiencyData = nutrientDeficiencies.find(d =>
      d.nutrientSymbol === deficiency || d.id.includes(deficiency.toLowerCase())
    );
    if (deficiencyData) {
      return [
        `Apply: ${deficiencyData.correction.fertilizer.join(' or ')}`,
        `Rate: ${deficiencyData.correction.rate}`,
        `Application: ${deficiencyData.correction.application}`
      ];
    }
    return ['Conduct a soil test for accurate diagnosis'];
  }
}