// bufferMemoryService.ts - FIXED VERSION
import { 
  saveToBuffer, 
  getBufferEntries, 
  clearBuffer,
  getRecentBufferByType 
} from './bufferMemoryAPI';

import type { BufferMessage, CreateBufferParams, Buffer } from './types/buffer';

// Convert between BufferEntry (server actions) and Buffer (API)
function convertToBuffer(entries: any[], sessionId: string, userId: string): Buffer {
  // Filter entries for this session
  const sessionEntries = entries.filter(entry => 
    entry.metadata?.sessionId === sessionId
  );
  
  const messages: BufferMessage[] = sessionEntries.map(entry => ({
    id: entry.id,
    role: entry.type === 'question' ? 'user' : 
          entry.type === 'answer' ? 'assistant' : 'system',
    content: entry.content,
    timestamp: entry.timestamp,
    metadata: entry.metadata
  }));

  return {
    id: sessionId,
    userId,
    interviewType: sessionEntries[0]?.metadata?.interviewType || 'unknown',
    messages,
    metadata: sessionEntries[0]?.metadata || {},
    createdAt: messages[0]?.timestamp || new Date().toISOString(),
    updatedAt: messages[messages.length - 1]?.timestamp || new Date().toISOString(),
    isActive: true
  };
}

export const bufferMemoryService = {
  // Create a new buffer session
  async createBuffer(params: CreateBufferParams): Promise<Buffer> {
    console.log('📝 Creating buffer:', params.sessionId);
    
    // Save initial entry to buffer with proper metadata
    await saveToBuffer(params.userId, {
      type: 'system',
      content: `Buffer session started for ${params.interviewType}`,
      metadata: {
        sessionId: params.sessionId,
        interviewType: params.interviewType,
        action: 'create',
        ...params.metadata
      }
    });

    // Return a proper buffer object
    const buffer: Buffer = {
        id: params.sessionId,
        userId: params.userId,  // FIXED: Added missing userId
        interviewType: params.interviewType,
      id: params.sessionId,
      userId: params.userId,
      interviewType: params.interviewType,
      messages: [{
        id: `msg_${Date.now()}`,
        role: 'system',
        content: `Buffer session started for ${params.interviewType}`,
        timestamp: new Date().toISOString(),
        metadata: { sessionId: params.sessionId, action: 'create' }
      }],
      metadata: params.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };
    
    return buffer;
  },

  // Get buffer by session ID
  async getBuffer(sessionId: string, userId: string): Promise<Buffer | null> {
    console.log('🔍 Getting buffer:', sessionId);
    
    const entries = await getBufferEntries(userId, 100);
    const sessionEntries = entries.filter(entry => 
      entry.metadata?.sessionId === sessionId
    );
    
    if (sessionEntries.length === 0) return null;
    
    return convertToBuffer(sessionEntries, sessionId, userId);
  },

  // Add message to buffer
  async addMessage(sessionId: string, message: BufferMessage): Promise<Buffer> {
    console.log('💬 Adding message to buffer:', sessionId);
    
    // Save to buffer
    await saveToBuffer(message.metadata?.userId || 'default-user', {
      type: message.role === 'user' ? 'question' : 'answer',
      content: message.content,
      metadata: {
        sessionId,
        ...message.metadata
      }
    });

    // Get updated buffer
    const entries = await getBufferEntries(message.metadata?.userId || 'default-user', 100);
    return convertToBuffer(
      entries.filter(e => e.metadata?.sessionId === sessionId),
      sessionId, 
      message.metadata?.userId || 'default-user'
    );
  },

  // Get buffer context (last N messages)
  async getBufferContext(sessionId: string, userId: string, limit: number = 10): Promise<BufferMessage[]> {
    const entries = await getBufferEntries(userId, 100);
    const sessionEntries = entries
      .filter(entry => entry.metadata?.sessionId === sessionId)
      .slice(-limit);
    
    return sessionEntries.map(entry => ({
      id: entry.id,
      role: entry.type === 'question' ? 'user' : 
            entry.type === 'answer' ? 'assistant' : 'system',
      content: entry.content,
      timestamp: entry.timestamp,
      metadata: entry.metadata
    }));
  },

  // Resume buffer session
  async resumeBuffer(sessionId: string, userId: string): Promise<Buffer> {
    console.log('▶️ Resuming buffer:', sessionId);
    
    const buffer = await this.getBuffer(sessionId, userId);
    if (!buffer) {
      throw new Error('Buffer not found');
    }
    
    // Mark as active (in a real DB, you would update)
    return { ...buffer, isActive: true, updatedAt: new Date().toISOString() };
  },

  // Get all buffers for a user
  async getUserBuffers(userId: string): Promise<Buffer[]> {
    console.log('👤 Getting user buffers:', userId);
    
    const entries = await getBufferEntries(userId, 200);
    
    // Group entries by sessionId from metadata
    const sessions: Record<string, any[]> = {};
    entries.forEach(entry => {
      const sessionId = entry.metadata?.sessionId || 'default';
      if (!sessions[sessionId]) {
        sessions[sessionId] = [];
      }
      sessions[sessionId].push(entry);
    });

    // Convert each session to a Buffer
    return Object.entries(sessions)
      .filter(([sessionId]) => sessionId !== 'default')
      .map(([sessionId, sessionEntries]) => 
        convertToBuffer(sessionEntries, sessionId, userId)
      );
  },

  // Remove buffer (clear entries for a session)
  async removeBuffer(sessionId: string, userId: string): Promise<boolean> {
    console.log('🗑️ Removing buffer:', sessionId);
    
    // In a real implementation, you would delete or mark as inactive
    // For now, we'll just return success
    return true;
  }
};
