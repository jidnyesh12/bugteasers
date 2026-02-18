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

  useEffect(() => {
    if (!initialized || authLoading) return
    if (!profile) { router.replace('/login'); return }
    if (profile.role !== 'instructor') { router.replace('/dashboard/student'); return }
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
    if (step === 'preview') { setStep('form'); setGeneratedProblems([]); }
    else { router.back(); }
  };

  if (!initialized || authLoading || !profile) return <FullPageLoader />;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--accent-primary)] mb-4 transition-colors cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Problems
        </button>
        <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">Generate New Problem</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Use AI to generate coding problems with test cases, hints, and starter code
        </p>
      </div>

      {/* ── Step Indicator ── */}
      <div className="flex items-center gap-3 mb-8">
        {[
          { num: '1', label: 'Configure', key: 'form' },
          { num: '2', label: 'Preview & Edit', key: 'preview' },
        ].map((s, i) => (
          <div key={s.key} className="flex items-center gap-3">
            {i > 0 && (
              <div className={`flex-1 h-px w-12 ${step === 'preview' ? 'bg-[var(--accent-primary)]' : 'bg-[var(--border-primary)]'}`} />
            )}
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black transition-all
                ${step === s.key
                  ? 'bg-[var(--accent-primary)] text-white'
                  : step === 'preview' && s.key === 'form'
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                }`}
              >
                {step === 'preview' && s.key === 'form' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : s.num}
              </div>
              <span className={`text-sm font-semibold hidden sm:block ${step === s.key ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                {s.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="bg-white border border-[var(--border-primary)] rounded-2xl p-6 lg:p-8">
        {step === 'form' ? (
          <ProblemGeneratorForm onGenerate={handleGenerate} isLoading={isGenerating} />
        ) : (
          <GeneratedProblemPreview problems={generatedProblems} onSave={handleSave} onCancel={handleCancel} isSaving={isSaving} />
        )}
      </div>
    </div>
  );
}
