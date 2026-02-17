'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProblemGeneratorForm from '@/components/problem-generator-form';
import GeneratedProblemPreview from '@/components/generated-problem-preview';
import { GeneratedProblem } from '@/lib/ai/types';

export default function NewProblemPage() {
  const router = useRouter();
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

      // Redirect to problems list
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
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Generate New Problem</h1>
          <p className="text-[var(--text-secondary)]">
            Use AI to generate coding problems with test cases, hints, and starter code
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                step === 'form'
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
              }`}
            >
              1
            </div>
            <span className={step === 'form' ? 'font-medium' : 'text-[var(--text-secondary)]'}>
              Configure
            </span>
          </div>
          <div className="flex-1 h-px bg-[var(--border-primary)]" />
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                step === 'preview'
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
              }`}
            >
              2
            </div>
            <span className={step === 'preview' ? 'font-medium' : 'text-[var(--text-secondary)]'}>
              Preview & Edit
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-[var(--bg-secondary)] rounded-lg p-6 border border-[var(--border-primary)]">
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

        {/* Back Button (only on form step) */}
        {step === 'form' && (
          <button
            onClick={() => router.back()}
            className="mt-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            ← Back to Problems
          </button>
        )}
      </div>
    </div>
  );
}
