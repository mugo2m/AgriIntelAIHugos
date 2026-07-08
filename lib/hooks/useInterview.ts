"use client";

import { useState } from 'react';
import { InterviewConfig, InterviewQuestion, UserAnswer } from '@/lib/types';

interface InterviewResult {
  overallScore: number;
  summary: string;
  feedback: Array<{
    questionId: string;
    category: string;
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  }>;
  interviewId: string;
}

export const useInterview = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInterviewQuestions = async (
    config: Omit<InterviewConfig, 'voiceEnabled' | 'videoEnabled'>
  ): Promise<InterviewQuestion[]> => {
    setIsLoading(true);
    setError(null);

    try {
      // Mock data for now - replace with actual API call
      const mockQuestions: InterviewQuestion[] = [
        {
          id: 'react_1',
          question: 'Explain the Virtual DOM in React and its benefits.',
          category: 'React',
          difficulty: 'medium',
          type: 'technical',
          description: 'Describe how React uses Virtual DOM for performance optimization.',
          hints: ['Think about diffing algorithm', 'Consider re-rendering performance']
        },
        {
          id: 'react_2',
          question: 'What are React Hooks and when would you use them?',
          category: 'React',
          difficulty: 'medium',
          type: 'technical',
          description: 'Explain the concept of Hooks and their common use cases.'
        },
        {
          id: 'js_1',
          question: 'Explain event delegation in JavaScript.',
          category: 'JavaScript',
          difficulty: 'medium',
          type: 'technical',
          description: 'Describe how event delegation works and its advantages.'
        },
        {
          id: 'behavioral_1',
          question: 'Tell me about a time you faced a technical challenge.',
          category: 'Behavioral',
          difficulty: 'medium',
          type: 'behavioral',
          description: 'Use the STAR method to structure your answer.'
        },
        {
          id: 'coding_1',
          question: 'Write a function to reverse a linked list.',
          category: 'Algorithms',
          difficulty: 'hard',
          type: 'coding',
          description: 'Implement both iterative and recursive solutions.'
        }
      ];

      return mockQuestions.slice(0, config.count || 5);
    } catch (err: any) {
      setError(err.message || 'Failed to generate questions');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const submitInterviewAnswers = async (params: {
    sessionId: string;
    interviewConfig: InterviewConfig;
    questions: InterviewQuestion[];
    answers: UserAnswer[];
  }): Promise<InterviewResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // Mock evaluation - replace with actual API
      const mockResult: InterviewResult = {
        overallScore: 85,
        summary: 'Good performance overall with strong technical knowledge. Areas for improvement in system design.',
        feedback: params.questions.map((q, i) => ({
          questionId: q.id,
          category: q.category,
          score: Math.floor(Math.random() * 30) + 70,
          feedback: `Good answer on ${q.category}. ${q.difficulty === 'hard' ? 'Challenging question well handled.' : 'Solid understanding demonstrated.'}`,
          strengths: ['Clear explanation', 'Good examples'],
          improvements: ['Could provide more depth', 'Add practical examples']
        })),
        interviewId: `interview_${Date.now()}`
      };

      return mockResult;
    } catch (err: any) {
      setError(err.message || 'Failed to submit answers');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateInterviewQuestions,
    submitInterviewAnswers,
    isLoading,
    error
  };
};
