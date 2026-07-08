import { useState, useCallback } from 'react';
import type { CreateBufferParams, InterviewBuffer, BufferMessage, BufferResponse } from '@/lib/memory/types/buffer';

export function useBufferMemory() {
  const [bufferState, setBufferState] = useState<InterviewBuffer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiRequest = useCallback(async <T>(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data: BufferResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Request failed');
      }

      return data as T;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new buffer
  const createBuffer = useCallback(async (params: CreateBufferParams): Promise<InterviewBuffer> => {
    const response = await apiRequest<{ buffer: InterviewBuffer }>(
      `/api/interview/buffer?action=create`,
      'POST',
      params
    );

    setBufferState(response.buffer);
    return response.buffer;
  }, [apiRequest]);

  // Add message to buffer
  const addMessage = useCallback(async (
    sessionId: string,
    message: Omit<BufferMessage, 'id' | 'timestamp'>
  ): Promise<InterviewBuffer> => {
    const response = await apiRequest<{ buffer: InterviewBuffer }>(
      `/api/interview/buffer?action=addMessage&sessionId=${sessionId}`,
      'PUT',
      message
    );

    setBufferState(response.buffer);
    return response.buffer;
  }, [apiRequest]);

  // Get buffer context
  const getBufferContext = useCallback(async (sessionId: string): Promise<InterviewBuffer> => {
    const response = await apiRequest<{ buffer: InterviewBuffer }>(
      `/api/interview/buffer?action=context&sessionId=${sessionId}`,
      'GET'
    );

    setBufferState(response.buffer);
    return response.buffer;
  }, [apiRequest]);

  // Pause buffer
  const pauseBuffer = useCallback(async (
    sessionId: string,
    resumeData?: any
  ): Promise<InterviewBuffer> => {
    const response = await apiRequest<{ buffer: InterviewBuffer }>(
      `/api/interview/buffer?action=pause&sessionId=${sessionId}`,
      'PUT',
      { resumeData }
    );

    setBufferState(response.buffer);
    return response.buffer;
  }, [apiRequest]);

  // Resume buffer
  const resumeBuffer = useCallback(async (sessionId: string): Promise<InterviewBuffer> => {
    const response = await apiRequest<{ buffer: InterviewBuffer }>(
      `/api/interview/buffer?action=resume&sessionId=${sessionId}`,
      'PUT'
    );

    setBufferState(response.buffer);
    return response.buffer;
  }, [apiRequest]);

  // List user buffers
  const listUserBuffers = useCallback(async (userId: string): Promise<any[]> => {
    const response = await apiRequest<{ summary: any[] }>(
      `/api/interview/buffer?action=list&userId=${userId}`,
      'GET'
    );

    return response.summary;
  }, [apiRequest]);

  // Delete buffer
  const deleteBuffer = useCallback(async (sessionId: string): Promise<boolean> => {
    const response = await apiRequest<{ success: boolean }>(
      `/api/interview/buffer?action=delete&sessionId=${sessionId}`,
      'DELETE'
    );

    if (response.success) {
      setBufferState(null);
    }

    return response.success;
  }, [apiRequest]);

  return {
    // State
    bufferState,
    isLoading,
    error,

    // Actions
    createBuffer,
    addMessage,
    getBufferContext,
    pauseBuffer,
    resumeBuffer,
    listUserBuffers,
    deleteBuffer,

    // Helpers
    clearError: () => setError(null),
    clearBuffer: () => setBufferState(null),
  };
}