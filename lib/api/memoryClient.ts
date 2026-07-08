// lib/api/memoryClient.ts - SIMPLIFIED VERSION
export class MemoryClient {
  private baseUrl = '/api/memory';

  async savePerformance(userId: string, performanceData: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'savePerformance',
          ...performanceData
        })
      });

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error("Error saving performance:", error);
      return false;
    }
  }

  async getPerformanceHistory(userId: string, limit: number = 20): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'getPerformanceHistory',
          limit
        })
      });

      const result = await response.json();

      // Extract history from nested structure
      if (result.success && result.data) {
        return Array.isArray(result.data.history) ? result.data.history : [];
      }

      return [];
    } catch (error) {
      console.error("Error getting performance history:", error);
      return [];
    }
  }

  async getProgress(userId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'getProgress'
        })
      });

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error("Error getting progress:", error);
      return null;
    }
  }

  async recordEmotion(userId: string, emotionData: any): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'recordEmotion',
          ...emotionData
        })
      });

      const result = await response.json();
      return result.success && result.data ? result.data.emotionId : null;
    } catch (error) {
      console.error("Error recording emotion:", error);
      return null;
    }
  }

  async getResumeData(userId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'getResumeData'
        })
      });

      const result = await response.json();
      return result.success ? result.data : { canResume: false };
    } catch (error) {
      console.error("Error getting resume data:", error);
      return { canResume: false };
    }
  }
}

export const memoryClient = new MemoryClient();