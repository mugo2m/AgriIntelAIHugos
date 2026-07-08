'use client';

import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import InterviewCard from "@/components/InterviewCard"; // Changed from "@/components/interview-card"
import { Interview } from "@/lib/actions/general.action";

interface HomeClientProps {
  user: {
    id: string;
    name?: string;
    email?: string;
  };
  userInterviews: Interview[];
  allInterviews: Interview[];
  feedbackMap: Record<string, any>;
}

// Simple badge component if the UI one is missing
const SimpleBadge = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
    {children}
  </span>
);

const HomeClient = ({ user, userInterviews, allInterviews, feedbackMap }: HomeClientProps) => {
  const [activeTab, setActiveTab] = useState<'past' | 'all'>('past');
  const hasPastInterviews = userInterviews.length > 0;

  return (
    <section className="section">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-bold">
            Welcome back, <span className="text-primary-200">{user?.name || user?.email?.split('@')[0] || 'User'}</span>!
          </h1>
          <p className="text-gray-600">
            Practice makes perfect. Continue your interview preparation journey.
          </p>
        </div>

        <Button className="btn-primary px-6">
          <Link href="/interview/create" className="flex items-center gap-2">
            <Image src="/plus.svg" width={18} height={18} alt="plus" />
            Start New Interview
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Image src="/calendar.svg" width={24} height={24} alt="calendar" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Interviews</p>
              <p className="text-2xl font-bold">{userInterviews.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <Image src="/star.svg" width={24} height={24} alt="star" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Score</p>
              <p className="text-2xl font-bold">
                {Object.keys(feedbackMap).length > 0
                  ? Math.round(
                      Object.values(feedbackMap)
                        .map((f: any) => f.totalScore || 0)
                        .reduce((a: number, b: number) => a + b, 0) / Object.keys(feedbackMap).length
                    )
                  : 0}
                /100
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Image src="/trending-up.svg" width={24} height={24} alt="trending" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed with Feedback</p>
              <p className="text-2xl font-bold">{Object.keys(feedbackMap).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b mt-8">
        <button
          className={`px-4 py-3 font-medium text-sm ${activeTab === 'past' ? 'border-b-2 border-primary-200 text-primary-200' : 'text-gray-500'}`}
          onClick={() => setActiveTab('past')}
        >
          Your Past Interviews
          {hasPastInterviews && (
            <SimpleBadge className="ml-2 bg-primary-100 text-primary-200">
              {userInterviews.length}
            </SimpleBadge>
          )}
        </button>
        <button
          className={`px-4 py-3 font-medium text-sm ${activeTab === 'all' ? 'border-b-2 border-primary-200 text-primary-200' : 'text-gray-500'}`}
          onClick={() => setActiveTab('all')}
        >
          Community Interviews
          {allInterviews.length > 0 && (
            <SimpleBadge className="ml-2 bg-primary-100 text-primary-200">
              {allInterviews.length}
            </SimpleBadge>
          )}
        </button>
      </div>

      {/* Interviews List */}
      <div className="mt-6">
        {activeTab === 'past' ? (
          <>
            {hasPastInterviews ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userInterviews.map((interview) => {
                  const feedback = feedbackMap[interview.id];
                  return (
                    <InterviewCard
                      key={interview.id}
                      id={interview.id}
                      role={interview.role}
                      type={interview.type}
                      techstack={interview.techstack}
                      createdAt={interview.createdAt}
                      feedback={feedback}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Image src="/empty.svg" width={200} height={200} alt="empty" className="mx-auto opacity-50" />
                <h3 className="text-xl font-semibold mt-4">No interviews yet</h3>
                <p className="text-gray-600 mt-2 mb-6">Start your first interview to get personalized feedback</p>
                <Button className="btn-primary">
                  <Link href="/interview/create">Start First Interview</Link>
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            {allInterviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allInterviews.slice(0, 9).map((interview) => (
                  <InterviewCard
                    key={interview.id}
                    id={interview.id}
                    role={interview.role}
                    type={interview.type}
                    techstack={interview.techstack}
                    createdAt={interview.createdAt}
                    feedback={null}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Image src="/community.svg" width={200} height={200} alt="community" className="mx-auto opacity-50" />
                <h3 className="text-xl font-semibold mt-4">No community interviews yet</h3>
                <p className="text-gray-600 mt-2">Check back later to see interviews from other users</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Tips */}
      <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
        <h3 className="text-xl font-semibold mb-4">💡 Interview Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Prepare Thoroughly</h4>
            <p className="text-sm text-gray-600">
              Research the company and role. Practice common questions related to your field.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Use STAR Method</h4>
            <p className="text-sm text-gray-600">
              Structure your answers using Situation, Task, Action, Result for behavioral questions.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Review Feedback</h4>
            <p className="text-sm text-gray-600">
              After each practice interview, review the AI feedback to identify areas for improvement.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeClient;