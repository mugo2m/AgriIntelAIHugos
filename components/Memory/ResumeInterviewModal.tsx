"use client";

import { useState } from 'react';
import { ResumeInterviewData } from '@/lib/memory/types';
import { X } from 'lucide-react';

interface ResumeInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResume: () => void;
  resumeData: ResumeInterviewData;
}

export function ResumeInterviewModal({
  isOpen,
  onClose,
  onResume,
  resumeData,
}: ResumeInterviewModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const handleResume = () => {
    onResume();
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className={`relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-full p-1 hover:bg-gray-100"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Continue Interview?</h3>
          </div>
          <p className="mt-2 text-gray-600">
            You have an interview in progress from {resumeData.timeElapsed} minutes ago.
          </p>
        </div>

        {/* Details */}
        <div className="mb-6 space-y-4 rounded-lg bg-gray-50 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Progress</p>
              <p className="font-medium">
                Question {resumeData.currentQuestion || 1} of ?
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Answers Completed</p>
              <p className="font-medium">
                {(resumeData.answerHistory?.length || 0)} answered
              </p>
            </div>
          </div>

          {resumeData.partialAnswer && (
            <div>
              <p className="text-sm text-gray-500">Unsaved Answer</p>
              <div className="mt-1 max-h-20 overflow-y-auto rounded bg-white p-2 text-sm">
                {resumeData.partialAnswer.substring(0, 150)}
                {resumeData.partialAnswer.length > 150 ? '...' : ''}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleResume}
            className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700"
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Resume Interview
            </div>
          </button>

          <button
            onClick={handleClose}
            className="w-full rounded-lg border border-gray-300 py-3 font-medium text-gray-700 hover:bg-gray-50"
          >
            Start New Interview
          </button>

          <div className="mt-2 text-center">
            <button
              onClick={handleClose}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              I don't want to resume
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}