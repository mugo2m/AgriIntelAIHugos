import { NextRequest, NextResponse } from "next/server";
import { getRandomInterviewCover } from "@/lib/utils";
import { GoogleGenerativeAI } from "@google/generative-ai"; // ✅ ADD THIS
// Use lazy imports for Firebase to avoid Edge Runtime issues
console.log("🔍 Question Generation Route (with cache) Loaded");
console.log("📦 GoogleGenerativeAI import:", !!GoogleGenerativeAI);
console.log("🔑 API Key exists:", !!process.env.GOOGLE_GENERATIVE_AI_API_KEY);
console.log("🔑 API Key preview:", process.env.GOOGLE_GENERATIVE_AI_API_KEY?.substring(0, 10) + "...");

let db: any = null;
let cacheModule: any = null;

async function initializeModules() {
  if (!db) {
    try {
      const firebaseModule = await import("@/firebase/admin");
      db = firebaseModule.getFirestoreInstance ? firebaseModule.getFirestoreInstance() : firebaseModule.db;
      console.log("✅ Firebase Admin connected");
    } catch (error) {
      console.warn("⚠️ Firebase not available:", error.message);
      db = null;
    }
  }

  if (!cacheModule) {
    try {
      cacheModule = await import("@/lib/cache/firestoreInterviewCache");
      console.log("✅ Using Firestore cache");
    } catch (error) {
      console.warn("⚠️ Firestore cache failed, using simple cache");
      try {
        cacheModule = await import("@/lib/cache/simpleInterviewCache");
        console.log("✅ Using simple cache");
      } catch (error2) {
        console.warn("⚠️ All caches failed, using mock");
        cacheModule = {
          getCachedInterview: () => null,
          cacheInterview: async () => `mock_${Date.now()}`,
          recordInterviewUsage: async () => {}
        };
      }
    }
  }
}

// Helper functions (keeping yours but with fixes)
function parseGeneratedText(text: string, expectedCount: number): string[] {
  try {
    const cleanedText = text.trim();
    console.log(`📝 Parsing AI response (first 300 chars): ${cleanedText.substring(0, 300)}...`);

    // Method 1: Try direct JSON parse
    try {
      const parsed = JSON.parse(cleanedText);
      if (Array.isArray(parsed)) {
        console.log(`✅ Direct JSON parse success: ${parsed.length} items`);
        return parsed
          .slice(0, expectedCount)
          .filter((q: any) => typeof q === 'string' && q.trim().length > 10)
          .map((q: string) => q.trim());
      }
    } catch (e) {
      // Continue to other methods
    }

    // Method 2: Extract JSON array with regex
    const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          console.log(`✅ Regex JSON extract success: ${parsed.length} items`);
          return parsed
            .slice(0, expectedCount)
            .filter((q: any) => typeof q === 'string' && q.trim().length > 10)
            .map((q: string) => q.trim());
        }
      } catch (e) {
        console.log("❌ Regex JSON parse failed:", e.message);
      }
    }

    // Method 3: Line-by-line extraction (fallback)
    const lines = cleanedText.split('\n');
    const questions: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.length < 5) continue;

      // Skip markdown and instructional lines
      if (trimmed.startsWith('```') || trimmed.startsWith('{') ||
          trimmed.toLowerCase().includes('here are') ||
          trimmed.toLowerCase().includes('example:')) {
        continue;
      }

      // Remove numbering and bullets
      let question = trimmed
        .replace(/^[\d]+[\.\)]\s*/, '')
        .replace(/^[-*•]\s*/, '')
        .replace(/^["']|["']$/g, '')
        .trim();

      // Check if it looks like a question
      if (question.length > 10 && question.length < 300 &&
          (question.includes('?') ||
           question.toLowerCase().startsWith('how ') ||
           question.toLowerCase().startsWith('what ') ||
           question.toLowerCase().startsWith('why ') ||
           question.toLowerCase().startsWith('describe ') ||
           question.toLowerCase().startsWith('explain '))) {
        questions.push(question);
      }

      if (questions.length >= expectedCount) break;
    }

    console.log(`📝 Line parsing found ${questions.length} questions`);
    return questions.slice(0, expectedCount);

  } catch (error) {
    console.error("❌ Error parsing generated text:", error);
    return [];
  }
}

function cleanQuestions(questions: string[]): string[] {
  return questions
    .filter((q, index, self) => {
      if (typeof q !== 'string') return false;
      const trimmed = q.trim();

      // Filter by length
      if (trimmed.length < 10 || trimmed.length > 250) return false;

      // Filter out duplicates (case-insensitive)
      const normalized = trimmed.toLowerCase();
      const firstIndex = self.findIndex(item =>
        item.toLowerCase() === normalized
      );

      // Filter out non-questions
      const blacklist = [
        'okay', 'alright', 'let me', 'first,', 'i need to', 'so,',
        'well,', 'hmm,', 'um,', 'ah,', 'that should cover',
        'here are', 'questions:', 'interview questions:',
        'technical questions:', 'behavioral questions:',
        'mixed questions:', 'following questions:'
      ];

      if (blacklist.some(word => normalized.startsWith(word))) {
        return false;
      }

      return firstIndex === index; // Keep only first occurrence
    })
    .map(q => {
      return q
        .replace(/\\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    });
}

// Mock questions (unchanged, but moved here for completeness)
const MOCK_QUESTIONS = {
  "pilot": ["What experience do you have with commercial flight operations?", "How do you handle emergency situations?", "Describe your pre-flight checklist.", "Experience with different aircraft?", "How do you manage crew communication?"],
  "cook": ["What commercial cooking experience?", "Handle high-pressure kitchen?", "Describe menu planning.", "Ensure food safety?", "Kitchen systems familiar?"],
  "developer": ["Proficient programming languages?", "Experience with version control?", "Handle debugging complex issues?", "Approach to code review?", "Challenging project experience?"],
  "manager": ["Handle team conflict?", "Leadership style?", "Prioritize projects?", "Performance review approach?", "Motivate team?"],
  "teacher": ["Teaching philosophy?", "Classroom management?", "Curriculum development?", "Differentiate instruction?", "Assessment methods?"],
  "default": ["Experience in this role?", "Strengths and weaknesses?", "Handle stressful situations?", "Challenging project?", "Where in 5 years?"]
};

async function getMockQuestions(role: string, level: string, type: string, amount: number): Promise<string[]> {
  const roleLower = role.toLowerCase();
  let questions: string[] = [];

  if (roleLower.includes('pilot') || roleLower.includes('flight')) {
    questions = MOCK_QUESTIONS.pilot;
  } else if (roleLower.includes('cook') || roleLower.includes('chef')) {
    questions = MOCK_QUESTIONS.cook;
  } else if (roleLower.includes('teacher') || roleLower.includes('professor')) {
    questions = MOCK_QUESTIONS.teacher;
  } else if (roleLower.includes('dev') || roleLower.includes('engineer')) {
    questions = MOCK_QUESTIONS.developer;
  } else if (roleLower.includes('manager') || roleLower.includes('lead')) {
    questions = MOCK_QUESTIONS.manager;
  } else {
    questions = MOCK_QUESTIONS.default;
  }

  // Adjust based on level
  const adjustedQuestions = questions.map(q => {
    if (level.toLowerCase().includes('junior')) {
      return q.replace(/complex|challenging|senior/g, 'basic');
    } else if (level.toLowerCase().includes('senior')) {
      return q + " (considering senior-level responsibilities)";
    }
    return q;
  });

  return adjustedQuestions.slice(0, amount);
}

// FIXED: Include techstack in cache key generation
function generateCacheKey(role: string, level: string, type: string, amount: number, techstack: string): string {
  const normalizedTechstack = Array.isArray(techstack)
    ? techstack.sort().join(',')
    : typeof techstack === 'string'
      ? techstack.toLowerCase().trim()
      : '';

  return `${role.toLowerCase()}_${level.toLowerCase()}_${type.toLowerCase()}_${amount}_${normalizedTechstack}`;
}

// Main endpoint
export async function POST(request: NextRequest) {
  console.log("🎯 POST /api/vapi/generate-with-cache called");

  // Initialize modules
  await initializeModules();

  try {
    const body = await request.json();
    const {
      type = "Technical",
      role = "",
      level = "Mid-level",
      techstack = "",
      amount = 5,
      userid = "anonymous"
    } = body;

    // Validate
    if (!role.trim()) {
      return NextResponse.json({
        success: false,
        error: "Missing required field: role"
      }, { status: 400 });
    }

    const cleanRole = role.replace(/\.$/g, '').trim();
    const cleanLevel = level.trim();
    const cleanType = type.trim();
    const cleanTechstack = techstack;
    const cleanAmount = Math.min(Math.max(parseInt(amount.toString()) || 5, 3), 10);

    console.log(`🎯 Processing: ${cleanRole} (${cleanLevel}, ${cleanType}, ${cleanAmount} questions)`);

    let questionsArray: string[] = [];
    let interviewId = `generated_${Date.now()}`;
    let fromCache = false;

    // 1️⃣ CHECK CACHE WITH ALL PARAMETERS
    try {
      const cacheKey = generateCacheKey(cleanRole, cleanLevel, cleanType, cleanAmount, cleanTechstack);
      console.log(`🔍 Cache key: ${cacheKey}`);

      // Try to get cached interview - NEEDS TO BE IMPLEMENTED IN CACHE MODULE
      const cachedInterview = await cacheModule.getCachedInterview(
        cleanRole,
        cleanLevel,
        cleanType,
        cleanAmount,
        cleanTechstack  // Add techstack parameter
      );

      if (cachedInterview && Array.isArray(cachedInterview.questions)) {
        console.log(`✅ CACHE HIT for ${cleanRole}`);
        questionsArray = cachedInterview.questions.map((q: any) => q.text || q);
        interviewId = cachedInterview.id || interviewId;
        fromCache = true;

        // Record usage
        try {
          await cacheModule.recordInterviewUsage(interviewId, userid);
        } catch (usageError) {
          console.log("⚠️ Cache usage recording failed:", usageError);
        }
      } else {
        console.log(`❌ Cache MISS for ${cleanRole}`);
      }
    } catch (cacheError: any) {
      console.log("⚠️ Cache check failed:", cacheError.message);
    }

    // 2️⃣ GENERATE NEW QUESTIONS IF NOT FROM CACHE
    if (!fromCache || !questionsArray.length) {
      console.log(`🔄 Generating new questions for ${cleanRole}...`);

      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      let aiSuccess = false;

      if (apiKey) {
        try {
          // IMPROVED PROMPT
          const prompt = `Generate EXACTLY ${cleanAmount} interview questions for a ${cleanLevel} ${cleanRole} position.

Focus: ${cleanType} questions
${cleanTechstack ? `Tech Stack: ${cleanTechstack}` : ''}

Return ONLY a JSON array of strings with EXACTLY ${cleanAmount} questions.
Example format: ["Question 1?", "Question 2?", "Question 3?"]

Requirements:
- Each question must be complete and grammatically correct
- Questions should be relevant to the role and level
- Avoid yes/no questions
- Make questions practical and job-related
- Questions should be 10-25 words each

Generated questions:`;
          console.log("🤖 Initializing Gemini with API key length:", apiKey.length);
          const genAI = new GoogleGenerativeAI(apiKey);
          console.log("✅ Gemini initialized successfully");

          const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
              responseMimeType: "application/json"
            }
          });

          const result = await model.generateContent(prompt);
          const response = await result.response;
          const generatedText = response.text();

          if (generatedText.trim()) {
            questionsArray = parseGeneratedText(generatedText, cleanAmount);
            console.log(`🤖 Gemini generated ${questionsArray.length}/${cleanAmount} questions`);
            aiSuccess = questionsArray.length > 0;
          }
        } catch (geminiError: any) {
          console.warn("⚠️ Gemini failed:", geminiError.message);
        }
      }

      // Fallback to mock if AI failed
      if (!aiSuccess || questionsArray.length === 0) {
        questionsArray = await getMockQuestions(cleanRole, cleanLevel, cleanType, cleanAmount);
        console.log(`🎭 Using ${questionsArray.length} mock questions`);
      }

      // Clean and validate
      questionsArray = cleanQuestions(questionsArray);

      // Ensure correct amount
      if (questionsArray.length !== cleanAmount) {
        console.log(`⚠️ Adjusting from ${questionsArray.length} to ${cleanAmount} questions`);
        if (questionsArray.length > cleanAmount) {
          questionsArray = questionsArray.slice(0, cleanAmount);
        } else {
          const mockQuestions = await getMockQuestions(cleanRole, cleanLevel, cleanType, cleanAmount - questionsArray.length);
          questionsArray = [...questionsArray, ...mockQuestions];
        }
      }

      // 3️⃣ CACHE THE NEW QUESTIONS
      try {
        interviewId = await cacheModule.cacheInterview(
          cleanRole,
          cleanLevel,
          cleanType,
          cleanAmount,
          cleanTechstack,  // Add techstack parameter
          questionsArray.map(q => ({
            text: q,
            category: cleanType,
            difficulty: cleanLevel.toLowerCase().includes('junior') ? 'easy' :
                      cleanLevel.toLowerCase().includes('senior') ? 'hard' : 'medium',
            idealAnswer: `Ideal answer for ${cleanRole}: ${q}`,
            keywords: [
              cleanRole.toLowerCase(),
              cleanLevel.toLowerCase(),
              cleanType.toLowerCase(),
              ...(cleanTechstack ? cleanTechstack.toString().toLowerCase().split(/[,\s]+/) : [])
            ]
          })),
          userid
        );
        console.log(`💾 Cached new questions with ID: ${interviewId}`);
      } catch (cacheSaveError) {
        console.warn("⚠️ Failed to cache questions:", cacheSaveError);
      }
    }

    // 4️⃣ SAVE TO FIREBASE (optional)
    if (db && questionsArray.length > 0) {
      try {
        const interviewData = {
          role: cleanRole,
          type: cleanType,
          level: cleanLevel,
          techstack: Array.isArray(cleanTechstack)
            ? cleanTechstack
            : typeof cleanTechstack === 'string'
              ? cleanTechstack.split(",").map(t => t.trim()).filter(Boolean)
              : [],
          questions: questionsArray,
          userId: userid,
          finalized: true,
          coverImage: getRandomInterviewCover(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          questionCount: questionsArray.length,
          source: fromCache ? "cache" : (process.env.GOOGLE_GENERATIVE_AI_API_KEY ? "gemini" : "mock"),
          isRealInterview: true,
          cached: fromCache,
          cachedInterviewId: interviewId,
          title: `${cleanRole} ${cleanType} Interview`,
          description: `${cleanLevel} level interview focusing on ${cleanTechstack || "general skills"}`,
          status: "completed",
          duration: 30,
          difficulty: cleanLevel.toLowerCase().includes('junior') ? 'easy' :
                    cleanLevel.toLowerCase().includes('senior') ? 'hard' : 'medium'
        };

        await db.collection("interviews").doc(interviewId).set(interviewData);
        console.log(`✅ Saved to Firebase: ${interviewId}`);
      } catch (firebaseError) {
        console.error("❌ Firebase save failed:", firebaseError);
      }
    }

    // 5️⃣ RETURN RESPONSE
    return NextResponse.json({
      success: true,
      questions: questionsArray,
      count: questionsArray.length,
      interviewId,
      fromCache,
      metadata: {
        role: cleanRole,
        level: cleanLevel,
        type: cleanType,
        techstack: cleanTechstack,
        generatedAt: new Date().toISOString(),
        source: fromCache ? "cache" : (process.env.GOOGLE_GENERATIVE_AI_API_KEY ? "gemini" : "mock")
      }
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error("❌ API Error:", error);

    // Emergency fallback
    const mockQuestions = await getMockQuestions("Developer", "Mid-level", "Technical", 5);

    return NextResponse.json({
      success: true,
      questions: mockQuestions,
      count: mockQuestions.length,
      interviewId: `fallback_${Date.now()}`,
      fromCache: false,
      metadata: {
        role: "Developer",
        level: "Mid-level",
        type: "Technical",
        techstack: "",
        generatedAt: new Date().toISOString(),
        source: "fallback",
        note: "Using fallback due to error"
      }
    }, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// GET endpoint for API info
export async function GET() {
  await initializeModules();

  return NextResponse.json({
    status: "operational",
    name: "Interview Generation API with Caching",
    version: "2.1.0",
    features: [
      "Intelligent caching by role/level/type/techstack",
      "Gemini AI integration with fallback",
      "Firestore persistence",
      "Usage statistics",
      "Mock question fallback"
    ],
    endpoints: {
      generate: "POST /api/vapi/generate-with-cache",
      cacheEnabled: !!cacheModule.getCachedInterview,
      firebaseEnabled: !!db
    }
  });
}