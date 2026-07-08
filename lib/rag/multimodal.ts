// lib/rag/multimodal.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from 'sharp';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
const visionModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-vision" });

export interface ProcessedImage {
  description: string;
  embedding: number[];
  thumbnail: string; // base64
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
    detectedObjects?: string[];
    crops?: string[];
    diseases?: string[];
  };
}

export async function processImage(
  imageInput: Buffer | File | string,
  metadata: Record<string, any> = {}
): Promise<ProcessedImage> {
  try {
    console.log("🖼️ Processing image...");

    // Convert to buffer if needed
    let buffer: Buffer;
    if (imageInput instanceof File) {
      buffer = Buffer.from(await imageInput.arrayBuffer());
    } else if (typeof imageInput === 'string') {
      const response = await fetch(imageInput);
      buffer = Buffer.from(await response.arrayBuffer());
    } else {
      buffer = imageInput;
    }

    // Generate thumbnail
    const thumbnail = await sharp(buffer)
      .resize(300, 300, { fit: 'inside' })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Get image metadata
    const imageMetadata = await sharp(buffer).metadata();

    // Convert to base64 for Gemini
    const base64Image = buffer.toString('base64');
    const mimeType = `image/${imageMetadata.format || 'jpeg'}`;

    // Generate description with Gemini Vision
    const prompt = `Analyze this farming image in detail:
1. What crops or plants do you see?
2. Are there any signs of pests or diseases? (yellowing, spots, wilting, insects)
3. What's the overall health of the plants?
4. Any farming practices visible? (irrigation, spacing, mulching)
5. Soil condition visible?
6. Weather or environmental conditions?

Provide a detailed, structured analysis.`;

    const result = await visionModel.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType
        }
      }
    ]);

    const description = result.response.text();

    // Extract key information for metadata
    const detectedObjects = extractFarmingEntities(description);
    const diseases = detectDiseases(description);
    const crops = extractCrops(description);

    // Generate embedding from description (for text search)
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const embeddingResult = await embeddingModel.embedContent(description);
    const embedding = embeddingResult.embedding.values;

    return {
      description,
      embedding,
      thumbnail: thumbnail.toString('base64'),
      metadata: {
        width: imageMetadata.width || 0,
        height: imageMetadata.height || 0,
        format: imageMetadata.format || 'unknown',
        size: buffer.length,
        detectedObjects,
        crops,
        diseases,
        ...metadata
      }
    };

  } catch (error) {
    console.error("❌ Image processing failed:", error);
    return {
      description: "Failed to process image",
      embedding: new Array(768).fill(0),
      thumbnail: "",
      metadata
    };
  }
}

export async function searchSimilarImages(
  imageInput: Buffer | File | string,
  limit: number = 5
): Promise<any[]> {
  try {
    // Process query image
    const processed = await processImage(imageInput);

    // Search by description embedding
    const { supabase } = await import('@/lib/supabase/client');

    const { data } = await supabase.rpc('match_farming_knowledge', {
      query_embedding: processed.embedding,
      match_threshold: 0.7,
      match_count: limit
    });

    return data || [];
  } catch (error) {
    console.error("❌ Image search failed:", error);
    return [];
  }
}

// Helper functions
function extractFarmingEntities(text: string): string[] {
  const entities: string[] = [];
  const patterns = [
    /maize|corn|beans|coffee|tea|wheat|rice|potato/gi,
    /fall armyworm|aphid|caterpillar|beetle/gi,
    /yellow|brown spot|rust|blight|mildew/gi
  ];

  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      entities.push(...matches.map(m => m.toLowerCase()));
    }
  });

  return [...new Set(entities)];
}

function detectDiseases(text: string): string[] {
  const diseases: string[] = [];
  const diseasePatterns = [
    /maize streak|rust|blight|mildew|wilt|rot/gi,
    /yellow leaf|brown spot|leaf spot/gi
  ];

  diseasePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      diseases.push(...matches.map(m => m.toLowerCase()));
    }
  });

  return [...new Set(diseases)];
}

function extractCrops(text: string): string[] {
  const crops: string[] = [];
  const cropPattern = /maize|corn|beans|coffee|tea|wheat|rice|potato|tomato|cabbage|kale/gi;

  const matches = text.match(cropPattern);
  if (matches) {
    crops.push(...matches.map(m => m.toLowerCase()));
  }

  return [...new Set(crops)];
}