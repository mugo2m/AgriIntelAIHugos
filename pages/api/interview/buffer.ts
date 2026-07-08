import type { NextApiRequest, NextApiResponse } from 'next';
import { bufferMemoryService } from '@/lib/memory/bufferMemoryService';
import type { CreateBufferParams, BufferResponse } from '@/lib/memory/types/buffer';

export default async function handler(req: NextApiRequest, res: NextApiResponse<BufferResponse>) {
  const { action, sessionId } = req.query;
  const userId = req.headers['x-user-id'] as string;

  try {
    switch (action) {
      case 'create': {
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }

        const params: CreateBufferParams = {
          ...req.body,
          userId: req.body.userId || userId
        };

        // Create buffer using the service
        const buffer = await bufferMemoryService.createBuffer(params);
        
        // Return the actual buffer object
        return res.status(200).json({ 
          success: true, 
          buffer: buffer  // Make sure this includes the buffer
        });
      }

      case 'get': {
        if (!sessionId || typeof sessionId !== 'string') {
          return res.status(400).json({ success: false, error: 'sessionId is required' });
        }

        const buffer = await bufferMemoryService.getBuffer(sessionId, userId);
        if (!buffer) {
          return res.status(404).json({ success: false, error: 'Buffer not found' });
        }

        return res.status(200).json({ success: true, buffer });
      }

      case 'addMessage': {
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Method not allowed' });
        }

        const { message } = req.body;
        if (!message) {
          return res.status(400).json({ success: false, error: 'Message is required' });
        }

        const buffer = await bufferMemoryService.addMessage(sessionId as string, message);
        return res.status(200).json({ success: true, buffer });
      }

      case 'getBufferContext': {
        const buffer = await bufferMemoryService.getBufferContext(sessionId as string, userId);
        return res.status(200).json({ success: true, buffer });
      }

      case 'resume': {
        const buffer = await bufferMemoryService.resumeBuffer(sessionId as string, userId);
        return res.status(200).json({ success: true, buffer });
      }

      case 'getUserBuffers': {
        const buffers = await bufferMemoryService.getUserBuffers(userId);
        return res.status(200).json({ success: true, buffers });
      }

      case 'remove': {
        const deleted = await bufferMemoryService.removeBuffer(sessionId as string, userId);
        return res.status(200).json({ success: true, deleted });
      }

      default:
        return res.status(400).json({ success: false, error: 'Invalid action' });
    }
  } catch (error) {
    console.error('❌ Buffer API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}
