// lib/ai/questionGenerator.ts
"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

// Configure Google Gemini AI (FREE tier available)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

// Fallback mock questions for when AI services are unavailable
const FALLBACK_QUESTIONS: Record<string, Record<string, string[]>> = {
  "software developer": {
    technical: [
      "Explain the difference between var, let, and const in JavaScript.",
      "What is the virtual DOM in React and how does it improve performance?",
      "How would you optimize a slow-performing web application?",
      "Explain the concept of closures in JavaScript with an example.",
      "What are React hooks and when would you use useEffect vs useState?",
      "Describe the difference between SQL and NoSQL databases.",
      "How does the event loop work in Node.js?",
      "What is TypeScript and what are its main advantages over JavaScript?",
      "Explain the concept of server-side rendering vs client-side rendering.",
      "How would you implement authentication in a Next.js application?"
    ],
    behavioral: [
      "Tell me about a time you had to solve a difficult technical problem.",
      "Describe a situation where you had to work with a difficult team member.",
      "How do you handle tight deadlines and multiple priorities?",
      "Tell me about a project you're particularly proud of and why.",
      "How do you stay updated with the latest technologies and trends?",
      "Describe a time when you had to learn a new technology quickly.",
      "How do you approach code reviews and giving feedback to peers?",
      "Tell me about a time you made a mistake and how you handled it.",
      "How do you balance writing clean code with meeting deadlines?",
      "Describe your ideal work environment and team culture."
    ],
    mixed: [
      "Explain how you would design a scalable microservices architecture.",
      "What's your approach to debugging a production issue?",
      "How do you ensure code quality in a large codebase?",
      "Describe your experience with testing methodologies.",
      "How would you mentor a junior developer?",
      "What's your process for estimating project timelines?",
      "How do you handle technical debt in a project?",
      "Explain your approach to system design interviews.",
      "How do you communicate technical concepts to non-technical stakeholders?",
      "What's your experience with DevOps practices?"
    ]
  },
  "cook": {
    technical: [
      "Explain the five mother sauces of French cuisine.",
      "What are the different methods of cooking eggs?",
      "How do you properly sharpen and maintain kitchen knives?",
      "Describe the Maillard reaction and its importance in cooking.",
      "What are the key differences between baking and roasting?",
      "How do you ensure food safety and prevent cross-contamination?",
      "Explain the importance of mise en place in professional kitchens.",
      "What techniques would you use to thicken a sauce?",
      "How do you properly cook different types of pasta?",
      "Describe the process of making a classic beef stock."
    ],
    behavioral: [
      "How do you handle pressure during busy dinner service?",
      "Describe a time you had to adapt a recipe for dietary restrictions.",
      "How do you ensure consistency in dish quality?",
      "Tell me about a time you had to deal with a difficult customer.",
      "How do you stay creative and develop new menu items?",
      "Describe your experience training junior kitchen staff.",
      "How do you manage food waste in a professional kitchen?",
      "What's your approach to inventory management and ordering?",
      "How do you handle constructive criticism about your dishes?",
      "Describe your ideal kitchen team dynamic."
    ],
    mixed: [
      "How would you design a menu for a new restaurant?",
      "What's your process for costing out a new dish?",
      "How do you ensure consistency when scaling recipes?",
      "Describe your experience with different kitchen equipment.",
      "How do you stay current with food trends?",
      "What's your approach to plating and presentation?",
      "How do you manage time during prep for a large event?",
      "Describe your experience with different cooking techniques.",
      "How do you ensure health and safety standards are met?",
      "What's your philosophy on food and cooking?"
    ]
  },
  "project manager": {
    technical: [
      "Explain the difference between Agile and Waterfall methodologies.",
      "What tools do you use for project tracking and why?",
      "How do you create and manage a project timeline?",
      "Describe your approach to risk management in projects.",
      "What metrics do you track to measure project success?",
      "How do you handle scope creep in a project?",
      "Explain the different types of project dependencies.",
      "What's your experience with budget management and forecasting?",
      "How do you create and maintain project documentation?",
      "Describe your approach to resource allocation."
    ],
    behavioral: [
      "Tell me about a time you had to manage a difficult stakeholder.",
      "How do you handle conflicts within a project team?",
      "Describe a project that failed and what you learned from it.",
      "How do you motivate a team during challenging projects?",
      "What's your approach to giving and receiving feedback?",
      "How do you handle missed deadlines or project delays?",
      "Describe your communication style with different team members.",
      "How do you prioritize multiple competing projects?",
      "Tell me about a time you had to make a difficult project decision.",
      "How do you build trust with a new project team?"
    ],
    mixed: [
      "How would you approach a project with unclear requirements?",
      "What's your process for project planning and initiation?",
      "How do you ensure project quality throughout the lifecycle?",
      "Describe your experience with cross-functional teams.",
      "How do you handle changes in project requirements mid-way?",
      "What's your approach to stakeholder management?",
      "How do you ensure effective communication in remote teams?",
      "Describe your experience with project management software.",
      "How do you balance project constraints (scope, time, cost)?",
      "What's your philosophy on leadership in project management?"
    ]
  }
};

// Expanded roles for better matching
const ROLE_CATEGORIES: Record<string, string> = {
  "software developer": "software developer",
  "frontend developer": "software developer",
  "backend developer": "software developer",
  "fullstack developer": "software developer",
  "web developer": "software developer",
  "javascript developer": "software developer",
  "react developer": "software developer",
  "node.js developer": "software developer",
  "python developer": "software developer",
  "java developer": "software developer",
  "mobile developer": "software developer",
  "ios developer": "software developer",
  "android developer": "software developer",
  "devops engineer": "software developer",
  "data scientist": "software developer",
  "cook": "cook",
  "chef": "cook",
  "sous chef": "cook",
  "pastry chef": "cook",
  "baker": "cook",
  "kitchen staff": "cook",
  "restaurant manager": "cook",
  "project manager": "project manager",
  "product manager": "project manager",
  "program manager": "project manager",
  "team lead": "project manager",
  "technical lead": "project manager",
  "scrum master": "project manager",
  "default": "software developer"
};

// Difficulty modifiers based on level
const DIFFICULTY_MODIFIERS = {
  junior: {
    prefix: "Basic ",
    explanation: "Explain in simple terms: ",
    modifiers: ["basic", "fundamental", "simple", "introductory"],
    depth: "Provide a basic understanding"
  },
  mid: {
    prefix: "",
    explanation: "",
    modifiers: ["intermediate", "practical", "standard"],
    depth: "Demonstrate practical application"
  },
  senior: {
    prefix: "Advanced ",
    explanation: "Discuss in depth: ",
    modifiers: ["advanced", "complex", "strategic", "leadership"],
    depth: "Show strategic thinking"
  },
  executive: {
    prefix: "Strategic ",
    explanation: "From a strategic perspective: ",
    modifiers: ["strategic", "executive", "high-level", "business"],
    depth: "Demonstrate business impact"
  }
};

export async function generateQuestions(
  role: string,
  level: string = 'mid',
  interviewType: string = 'technical',
  questionCount: number = 5
): Promise<Array<{
  question: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  idealAnswer: string;
  keywords: string[];
}>> {
  try {
    console.log(`🤖 Generating ${questionCount} questions for ${role} (${level}, ${interviewType})`);

    // Use Gemini AI if API key is available, otherwise use fallback
    if (process.env.GOOGLE_AI_API_KEY) {
      console.log("🔑 Using Gemini AI for question generation...");
      return await generateWithGemini(role, level, interviewType, questionCount);
    } else {
      console.log("⚠️ No Gemini API key found, using fallback questions");
      return generateFallbackQuestions(role, level, interviewType, questionCount);
    }

  } catch (error) {
    console.error("❌ Error generating questions:", error);
    return generateFallbackQuestions(role, level, interviewType, questionCount);
  }
}

async function generateWithGemini(
  role: string,
  level: string,
  interviewType: string,
  questionCount: number
) {
  const difficulty = getDifficultyFromLevel(level);
  const difficultyModifier = DIFFICULTY_MODIFIERS[level as keyof typeof DIFFICULTY_MODIFIERS] || DIFFICULTY_MODIFIERS.mid;

  // Use Gemini Pro model (free tier available)
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  // Build dynamic prompt
  const prompt = `Generate ${questionCount} ${interviewType} interview questions for a ${level} ${role} position.

Requirements:
- Questions should be appropriate for a ${level} level position
- Focus on ${interviewType} aspects of the role
- Include a mix of conceptual and practical questions
- Make questions challenging but fair for the experience level
- Format: Each question should be on a new line with a number

Please generate exactly ${questionCount} questions:`;

  console.log(`📝 Prompt for Gemini: ${prompt.substring(0, 200)}...`);

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log(`✅ Gemini response received: ${text.substring(0, 200)}...`);

    const questions = parseQuestions(text, questionCount);

    return questions.map((question, index) => ({
      question: `${difficultyModifier.prefix}${question}`,
      category: getCategory(interviewType),
      difficulty,
      idealAnswer: generateIdealAnswer(question, role, level, interviewType),
      keywords: generateKeywords(question, role, level, interviewType)
    }));

  } catch (error: any) {
    console.error("❌ Gemini API error:", error.message);

    // If rate limited or other API error, fall back
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      console.log("⚠️ API quota exceeded, using fallback questions");
      return generateFallbackQuestions(role, level, interviewType, questionCount);
    }

    throw error;
  }
}

function generateFallbackQuestions(
  role: string,
  level: string,
  interviewType: string,
  questionCount: number
) {
  const difficulty = getDifficultyFromLevel(level);
  const difficultyModifier = DIFFICULTY_MODIFIERS[level as keyof typeof DIFFICULTY_MODIFIERS] || DIFFICULTY_MODIFIERS.mid;

  // Find the best matching role category
  const normalizedRole = role.toLowerCase();
  let matchedRole = "software developer"; // Default

  for (const [key, value] of Object.entries(ROLE_CATEGORIES)) {
    if (normalizedRole.includes(key)) {
      matchedRole = value;
      break;
    }
  }

  console.log(`🔄 Using fallback questions for role: ${matchedRole} (original: ${role})`);

  // Get questions for matched role
  const roleQuestions = FALLBACK_QUESTIONS[matchedRole];
  if (!roleQuestions) {
    console.log(`⚠️ No questions found for ${matchedRole}, using software developer questions`);
    return getDefaultQuestions(level, interviewType, questionCount);
  }

  // Get questions for interview type
  const questions = roleQuestions[interviewType] || roleQuestions.technical || [];

  if (questions.length === 0) {
    console.log(`⚠️ No ${interviewType} questions for ${matchedRole}, using technical questions`);
    return getDefaultQuestions(level, interviewType, questionCount);
  }

  // Shuffle and take required number
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(questionCount, questions.length));

  // If we don't have enough questions, supplement with default
  if (selected.length < questionCount) {
    const needed = questionCount - selected.length;
    const defaultQuestions = getDefaultQuestions(level, interviewType, needed);
    selected.push(...defaultQuestions.map(q => q.question));
  }

  return selected.map((question, index) => ({
    question: `${difficultyModifier.prefix}${question}`,
    category: getCategory(interviewType),
    difficulty,
    idealAnswer: generateIdealAnswer(question, role, level, interviewType),
    keywords: generateKeywords(question, role, level, interviewType)
  }));
}

function getDefaultQuestions(level: string, interviewType: string, count: number) {
  const difficulty = getDifficultyFromLevel(level);
  const difficultyModifier = DIFFICULTY_MODIFIERS[level as keyof typeof DIFFICULTY_MODIFIERS] || DIFFICULTY_MODIFIERS.mid;

  const defaultQuestions = [
    "Describe your experience relevant to this position.",
    "What skills do you bring to this role?",
    "How do you approach problem-solving?",
    "Tell me about a challenging project you worked on.",
    "What are your strengths and areas for improvement?",
    "How do you stay current in your field?",
    "Describe a time you had to learn something quickly.",
    "How do you handle feedback and criticism?",
    "What motivates you in your work?",
    "Where do you see yourself in 5 years?"
  ];

  // Shuffle and select
  const shuffled = [...defaultQuestions].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  return selected.map(question => ({
    question: `${difficultyModifier.prefix}${question}`,
    category: getCategory(interviewType),
    difficulty,
    idealAnswer: generateIdealAnswer(question, "professional", level, interviewType),
    keywords: generateKeywords(question, "professional", level, interviewType)
  }));
}

function parseQuestions(text: string, expectedCount: number): string[] {
  if (!text) return [];

  // Extract questions from the response
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // Remove numbering and bullet points
  const questions = lines
    .map(line =>
      line.replace(/^\d+[\.\)]\s*/, '')          // Remove "1. " or "1) "
          .replace(/^[\-\*•]\s*/, '')            // Remove bullet points
          .replace(/^Q\d+[:\.]?\s*/i, '')        // Remove "Q1: " or "Q1. "
          .replace(/^Question\s*\d+[:\.]?\s*/i, '') // Remove "Question 1: "
          .replace(/^#{1,3}\s*/, '')             // Remove markdown headers
          .trim()
    )
    .filter(q => q.length > 10 && !q.startsWith('Generate')); // Filter out short lines and prompt fragments

  // If we got enough questions, return them
  if (questions.length >= expectedCount) {
    return questions.slice(0, expectedCount);
  }

  // If not enough, pad with generic questions
  const genericQuestions = [
    "What experience do you have with this type of role?",
    "How do you approach learning new skills?",
    "Describe your work process.",
    "What achievements are you most proud of?",
    "How do you handle challenges at work?"
  ];

  while (questions.length < expectedCount) {
    const generic = genericQuestions[questions.length % genericQuestions.length];
    questions.push(generic);
  }

  return questions;
}

function getDifficultyFromLevel(level: string): 'easy' | 'medium' | 'hard' {
  switch (level.toLowerCase()) {
    case 'junior':
    case 'entry':
    case 'beginner':
      return 'easy';
    case 'mid':
    case 'middle':
    case 'intermediate':
    case 'mid-level':
      return 'medium';
    case 'senior':
    case 'lead':
    case 'executive':
    case 'director':
    case 'expert':
      return 'hard';
    default:
      return 'medium';
  }
}

function getCategory(interviewType: string): string {
  switch (interviewType.toLowerCase()) {
    case 'technical':
      return 'Technical Skills';
    case 'behavioral':
      return 'Behavioral & Soft Skills';
    case 'mixed':
      return 'Mixed (Technical & Behavioral)';
    default:
      return interviewType.charAt(0).toUpperCase() + interviewType.slice(1);
  }
}

function generateIdealAnswer(question: string, role: string, level: string, interviewType: string): string {
  const difficultyModifier = DIFFICULTY_MODIFIERS[level as keyof typeof DIFFICULTY_MODIFIERS] || DIFFICULTY_MODIFIERS.mid;

  if (interviewType === 'technical') {
    return `For a ${level} ${role} position, an ideal answer would:
1. Demonstrate solid technical knowledge related to the question
2. Provide specific examples or scenarios where applicable
3. Explain the reasoning behind the approach
4. Reference industry best practices or standards
5. Show practical application of knowledge

${difficultyModifier.depth} with clear, structured explanations.`;
  } else if (interviewType === 'behavioral') {
    return `For a ${level} ${role} position, use the STAR method (Situation, Task, Action, Result):
1. Describe a specific situation or challenge
2. Explain your role and responsibilities
3. Detail the actions you took
4. Share the results and what you learned
5. Relate it back to the role you're applying for

Focus on demonstrating ${level.toLowerCase()}-appropriate soft skills and emotional intelligence.`;
  } else {
    return `For a ${level} ${role} position, combine technical knowledge with behavioral insights:
1. Address the technical aspect with expertise
2. Include relevant work examples or case studies
3. Demonstrate problem-solving and critical thinking
4. Show communication and collaboration skills
5. Connect to business impact or team success

Balance depth of knowledge with practical application and interpersonal skills.`;
  }
}

function generateKeywords(question: string, role: string, level: string, interviewType: string): string[] {
  const keywords = new Set<string>();

  // Add basic metadata
  keywords.add(role.toLowerCase());
  keywords.add(level.toLowerCase());
  keywords.add(interviewType.toLowerCase());

  // Add question keywords (filter out common words)
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'about']);
  const questionWords = question.toLowerCase()
    .split(/[\s\-\_]+/)
    .filter(word => word.length > 3 && !commonWords.has(word));

  // Take top 5-7 significant words
  questionWords.slice(0, 7).forEach(word => {
    // Remove punctuation
    const cleanWord = word.replace(/[^\w\s]/g, '');
    if (cleanWord.length > 2) {
      keywords.add(cleanWord);
    }
  });

  // Add level-specific keywords
  const levelModifiers = DIFFICULTY_MODIFIERS[level as keyof typeof DIFFICULTY_MODIFIERS]?.modifiers || [];
  levelModifiers.forEach(modifier => keywords.add(modifier));

  // Add category keywords
  if (interviewType === 'technical') {
    keywords.add('technical');
    keywords.add('skills');
    keywords.add('knowledge');
  } else if (interviewType === 'behavioral') {
    keywords.add('behavioral');
    keywords.add('soft skills');
    keywords.add('interpersonal');
  } else {
    keywords.add('mixed');
    keywords.add('comprehensive');
  }

  return Array.from(keywords);
}

// Utility function for generating questions without caching
export async function generateQuestionsDirect(
  role: string,
  level: string = 'mid',
  interviewType: string = 'technical',
  questionCount: number = 5
) {
  return generateQuestions(role, level, interviewType, questionCount);
}

// FIXED: Made these async
export async function getAvailableRoles(): Promise<string[]> {
  return Object.keys(ROLE_CATEGORIES);
}

export async function suggestRoles(input: string): Promise<string[]> {
  if (!input || input.length < 2) return [];

  const normalizedInput = input.toLowerCase();
  return Object.keys(ROLE_CATEGORIES)
    .filter(role => role.toLowerCase().includes(normalizedInput))
    .slice(0, 10);
}

// Test function (for development only)
export async function testQuestionGenerator() {
  const testRoles = ['Software Developer', 'Cook', 'Project Manager'];
  const testLevels = ['junior', 'mid', 'senior'];
  const testTypes = ['technical', 'behavioral', 'mixed'];

  const results = [];

  for (const role of testRoles) {
    for (const level of testLevels) {
      for (const type of testTypes) {
        console.log(`\n=== Testing: ${role} (${level}, ${type}) ===`);
        try {
          const questions = await generateQuestions(role, level, type, 3);
          results.push({
            role,
            level,
            type,
            success: true,
            count: questions.length
          });
        } catch (error: any) {
          results.push({
            role,
            level,
            type,
            success: false,
            error: error.message
          });
        }
      }
    }
  }

  return results;
}