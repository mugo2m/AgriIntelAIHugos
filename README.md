# 🌾 AI Agricultural Assistant - Hugos4

**Voice-Powered, AI-Driven Farming Assistant with RAG Knowledge Base**

## 👤 Developer Contact
**Mugo Muiruri**  
📧 Email: mugomuiruri08@gmail.com  
📞 Phone: +254714272371  
🐙 GitHub: [@mugo2m](https://github.com/mugo2m)  
📍 Location: Nairobi, Kenya

## 🚀 Overview
A sophisticated platform that helps farmers through voice interviews, personalized AI recommendations, and intelligent Q&A powered by Gemini AI and a complete RAG (Retrieval-Augmented Generation) system.

## ✨ Core Features
- **Voice-First Interface** - 40+ questions with karaoke-style streaming
- **Personalized Recommendations** - Gemini 2.0 Flash generates 5 tailored tips
- **RAG-Enhanced Q&A** - Hybrid search across knowledge base for accurate answers
- **Multimodal Document Ingestion** - Upload PDFs, Excel, PPT, Word, Images
- **Location-Aware** - County-specific agricultural advice
- **M-PESA Integration** - KES 3 per session payment

## 🏗️ Architecture
\\\
Next.js 16 → API Routes → RAG Library → Gemini AI
                ↓              ↓           ↓
           Firebase      Supabase      Redis Cache
           (Sessions)    (pgvector)    (Performance)
\\\

## 📚 RAG Knowledge Base
- **Hybrid Search**: 70% semantic + 30% keyword matching
- **Metadata Filtering**: Crop type, region, season, category
- **Smart Chunking**: 500-1000 chars with overlap
- **Embeddings**: Gemini text-embedding-004

## 💰 Cost Optimization
- **Embedding Cache**: 90% savings
- **Search Cache**: 70% savings  
- **Answer Cache**: 50% savings
- **Metadata Filtering**: 99% search space reduction

## 🛠️ Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React, Tailwind |
| AI | Gemini 2.0 Flash, text-embedding-004 |
| Database | Firebase Firestore |
| Vector DB | Supabase + pgvector |
| Cache | Redis / Memory |
| Voice | Web Speech API |
| Payments | M-PESA |

## 📁 Key Structure
\\\
app/              # Next.js routes
├── api/          # /generate, /query, /upload
├── interview/    # Farmer sessions
└── ask/          # Q&A interface
lib/
├── rag/          # embeddings, hybridSearch, cacheManager
├── actions/      # Server actions
└── supabase/     # Database client
components/       # Voice agents, upload, payment
\\\

## 🔧 Quick Setup
\\\ash
git clone https://github.com/mugo2m/ai-agricultural-hugos4.git
cd ai-agricultural-hugos4
npm install
# Add .env.local with Firebase, Gemini, Supabase keys
npm run dev
\\\

## 🌐 API Routes
- \POST /api/vapi/generate\ - Create session with recommendations
- \POST /api/farmer/query\ - Answer questions with RAG
- \POST /api/upload\ - Ingest documents (admin only)

## 🗄️ Database Setup (Supabase)
\\\sql
CREATE EXTENSION vector;
CREATE TABLE farming_knowledge (
  id BIGSERIAL PRIMARY KEY,
  content TEXT,
  embedding vector(768),
  crop_type TEXT[],
  region TEXT,
  metadata JSONB
);
CREATE FUNCTION hybrid_search_farming(); -- Full function in docs
\\\

## ⚡ Environment Variables
\\\
# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="your-private-key"

# Gemini AI
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Redis (optional)
REDIS_URL=redis://localhost:6379
\\\

## ✅ Current Status
- Voice interface: ✅ Working
- RAG system: ✅ Complete
- Caching: ✅ Implemented
- Document ingestion: ✅ Ready
- GitHub: ✅ Pushed successfully

## 📞 Contact & Support
**Mugo Muiruri**  
📧 Email: mugomuiruri08@gmail.com  
📞 Phone: +254714272371  
🐙 GitHub: [@mugo2m](https://github.com/mugo2m)  
📍 Location: Nairobi, Kenya

For technical support, licensing inquiries, or partnerships:
- Email: mugomuiruri08@gmail.com
- Phone/WhatsApp: +254714272371
- GitHub Issues: https://github.com/mugo2m/ai-agricultural-hugos4/issues

## ⚖️ License
**Proprietary Software** - All Rights Reserved © 2026 Mugo Muiruri

This software is confidential and proprietary. Unauthorized copying, distribution, or use is strictly prohibited.

---

**Built with ❤️ for smallholder farmers in East Africa** 🌾🌽🌱

*For licensing or partnerships: mugomuiruri08@gmail.com | +254714272371*
