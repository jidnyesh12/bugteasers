'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { FullPageLoader } from '@/components/ui/loading';
import ProblemGeneratorForm from '@/components/problem-generator-form';
import GeneratedProblemPreview from '@/components/generated-problem-preview';
import { GeneratedProblem } from '@/lib/ai/types';

export default function NewProblemPage() {
  const router = useRouter();
  const { profile, loading: authLoading, initialized } = useAuth();

  // CRITICAL: Protect route - only instructors can access
  useEffect(() => {
    if (!initialized || authLoading) return

    if (!profile) {
      router.replace('/login')
      return
    }

    if (profile.role !== 'instructor') {
      router.replace('/dashboard/student')
      return
    }
  }, [profile, authLoading, initialized, router])
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [generatedProblems, setGeneratedProblems] = useState<GeneratedProblem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = (problems: GeneratedProblem[]) => {
    setGeneratedProblems(problems);
    setStep('preview');
    setIsGenerating(false);
  };

  const handleSave = async (problems: GeneratedProblem[]) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/problems/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problems }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      router.push('/dashboard/instructor/problems');
    } catch (error) {
      console.error('Error saving problems:', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to save problems: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (step === 'preview') {
      setStep('form');
      setGeneratedProblems([]);
    } else {
      router.back();
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-extrabold text-[var(--text-primary)] mb-1">Generate New Problem</h1>
        <p className="text-[var(--text-secondary)]">
          Use AI to generate coding problems with test cases, hints, and starter code
        </p>
      </div>

      {/* Progress Indicator — flat circles */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center gap-2">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
              step === 'form'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
            }`}
          >
            1
          </div>
          <span className={`font-semibold ${step === 'form' ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
            Configure
          </span>
        </div>
        <div className="flex-1 h-0.5 bg-[var(--border-primary)]" />
        <div className="flex items-center gap-2">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
              step === 'preview'
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
            }`}
          >
            2
          </div>
          <span className={`font-semibold ${step === 'preview' ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
            Preview & Edit
          </span>
        </div>
      </div>

      {/* Content — flat card */}
      <div className="flat-card p-6">
        {step === 'form' ? (
          <ProblemGeneratorForm
            onGenerate={handleGenerate}
            isLoading={isGenerating}
          />
        ) : (
          <GeneratedProblemPreview
            problems={generatedProblems}
            onSave={handleSave}
            onCancel={handleCancel}
            isSaving={isSaving}
          />
        )}
      </div>

      {/* Back Button */}
      {step === 'form' && (
        <button
          onClick={() => router.back()}
          className="mt-4 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] font-medium transition-colors"
        >
          ← Back to Problems
        </button>
      )}
    </div>
  );
}
