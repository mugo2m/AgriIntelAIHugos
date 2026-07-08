// bufferMemoryAPI.ts - API-compatible version of bufferMemory (no "use server")
// This can be used in API routes

const bufferStore = new Map<string, any[]>();

export interface BufferEntry {
  id: string;
  userId: string;
  type: 'question' | 'answer' | 'feedback' | 'emotion' | 'system';
  content: string;
  metadata: any;
  timestamp: string;
}

export async function saveToBuffer(userId: string, entry: Omit<BufferEntry, 'id' | 'timestamp'>): Promise<string> {
  try {
    const id = `buffer_${Date.now()}_${userId}`;
    const timestamp = new Date().toISOString();

    const bufferEntry: BufferEntry = {
      id,
      userId,
      ...entry,
      timestamp
    };

    const userBuffer = bufferStore.get(userId) || [];
    userBuffer.push(bufferEntry);

    // Keep only last 100 entries
    if (userBuffer.length > 100) {
      userBuffer.splice(0, userBuffer.length - 100);
    }

    bufferStore.set(userId, userBuffer);

    console.log("💾 Buffer saved:", { id, userId, type: entry.type, contentLength: entry.content.length });
    return id;
  } catch (error) {
    console.error("❌ Error saving to buffer:", error);
    throw error;
  }
}

export async function getBufferEntries(userId: string, limit: number = 50): Promise<BufferEntry[]> {
  try {
    const userBuffer = bufferStore.get(userId) || [];

    return userBuffer
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error("❌ Error getting buffer entries:", error);
    return [];
  }
}

export async function clearBuffer(userId: string): Promise<void> {
  try {
    bufferStore.delete(userId);
    console.log("🧹 Buffer cleared for user:", userId);
  } catch (error) {
    console.error("❌ Error clearing buffer:", error);
    throw error;
  }
}

export async function getRecentBufferByType(userId: string, type: BufferEntry['type'], limit: number = 10): Promise<BufferEntry[]> {
  try {
    const userBuffer = bufferStore.get(userId) || [];
    
    return userBuffer
      .filter(entry => entry.type === type)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error("❌ Error getting recent buffer by type:", error);
    return [];
  }
}
