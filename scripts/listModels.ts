const API_KEY = "AIzaSyDXkNKnIRUNKwJKoHwI669OX_PvWYefQ84"; // ⬅️ Keep your actual key here

import { GoogleGenerativeAI } from "@google/generative-ai";

async function listAvailableModels() {
  console.log("🔐 Testing key:", API_KEY.substring(0, 10) + "...\n");

  const genAI = new GoogleGenerativeAI(API_KEY);

  try {
    // First, get the actual available models from Google's API
    console.log("📡 Fetching available models from Google API...\n");

    // You need to call the REST API directly to list models
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    console.log("✅ Available models for your key:\n");
    console.log("=".repeat(60));

    // Filter for Gemini models that support generateContent
    const geminiModels = data.models
      .filter((model: any) =>
        model.name.includes('gemini') &&
        model.supportedGenerationMethods?.includes('generateContent')
      )
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    if (geminiModels.length === 0) {
      console.log("No Gemini models found!");
      console.log("\nAll models returned:");
      data.models.forEach((model: any) => {
        console.log(`- ${model.name} (${model.supportedGenerationMethods?.join(', ') || 'no methods'})`);
      });
    } else {
      geminiModels.forEach((model: any, index: number) => {
        console.log(`${index + 1}. ${model.name}`);
        console.log(`   📝 Version: ${model.version}`);
        console.log(`   📊 Token Limit: ${model.inputTokenLimit?.toLocaleString() || 'N/A'} tokens`);
        console.log(`   ⚡ Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);
        console.log("");
      });

      console.log("=".repeat(60));

      // Test the first available model
      if (geminiModels.length > 0) {
        console.log("\n🧪 Testing first model:", geminiModels[0].name);

        const modelName = geminiModels[0].name.split('/').pop(); // Get just the model ID
        const model = genAI.getGenerativeModel({ model: modelName });

        const start = Date.now();
        const result = await model.generateContent("Say 'Hello'");
        const time = Date.now() - start;
        const response = await result.response;

        console.log(`✅ Test successful! Time: ${time}ms`);
        console.log(`📝 Response: "${response.text()}"`);
      }
    }

  } catch (error: any) {
    console.error("❌ Error:", error.message);

    // Try alternative model names
    console.log("\n🔄 Trying alternative model names...\n");

    const altModels = [
      "gemini-pro",  // Most common free tier model
      "models/gemini-pro",  // Full path
      "gemini-1.0-pro",
      "text-bison-001",  // Sometimes available
    ];

    for (const modelName of altModels) {
      try {
        console.log(`Trying ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(".");
        console.log(`✅ ${modelName} works!`);
        break;
      } catch (e: any) {
        console.log(`❌ ${modelName}: ${e.message.split('\n')[0]}`);
      }
    }
  }
}

listAvailableModels();