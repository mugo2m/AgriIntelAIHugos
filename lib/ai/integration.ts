// lib/ai/integration.ts
// Connect AI detections to your recommendation engine

export function integrateAIDetections(
  detections: AIDetectionResult[],
  crop: string,
  farmerData: any
): RecommendationInput {

  // Group detections by type
  const pests = detections.filter(d => d.type === 'pest' && d.confidence > 0.7);
  const diseases = detections.filter(d => d.type === 'disease' && d.confidence > 0.7);
  const deficiencies = detections.filter(d => d.type === 'deficiency' && d.confidence > 0.7);

  // Add to farmerData for recommendation engine
  const enhancedFarmerData = {
    ...farmerData,
    commonPests: farmerData.commonPests
      ? farmerData.commonPests + ',' + pests.map(p => p.name).join(',')
      : pests.map(p => p.name).join(','),
    commonDiseases: farmerData.commonDiseases
      ? farmerData.commonDiseases + ',' + diseases.map(d => d.name).join(',')
      : diseases.map(d => d.name).join(','),
    deficiencySymptoms: farmerData.deficiencySymptoms
      ? farmerData.deficiencySymptoms + ', ' + deficiencies.map(d => d.name).join(', ')
      : deficiencies.map(d => d.name).join(', '),
    aiDetections: detections // Store raw detections
  };

  return {
    hasSoilTest: farmerData.hasDoneSoilTest === 'Yes',
    soilAnalysis: farmerData.soilAnalysis,
    fertilizerPlan: farmerData.fertilizerPlan,
    crop: crop,
    crops: [crop],
    farmerData: enhancedFarmerData
  };
}