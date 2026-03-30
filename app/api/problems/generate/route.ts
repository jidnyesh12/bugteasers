// API route for problem generation

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { enqueueProblemGenerationJob } from '@/lib/ai/generation-jobs';
import { ProblemGenerationRequest } from '@/lib/ai/types';
import { GEMINI_API_KEY } from '@/lib/env';
import { dedupeSupportedLanguages, SUPPORTED_EXECUTION_LANGUAGES } from '@/lib/execution/languages';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication via NextAuth
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is instructor or admin
    if (session.user.role !== 'instructor' && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only instructors can generate problems' },
        { status: 403 }
      );
    }

    // Parse request body
    const body: ProblemGenerationRequest = await request.json();

    // Validate required fields
    if (typeof body.topic !== 'string' || body.topic.trim().length === 0 || !body.difficulty) {
      return NextResponse.json(
        { error: 'Topic and difficulty are required' },
        { status: 400 }
      );
    }

    if (!['easy', 'medium', 'hard'].includes(body.difficulty)) {
      return NextResponse.json(
        { error: 'Invalid difficulty level' },
        { status: 400 }
      );
    }

    const rawLanguages = Array.isArray((body as { languages?: unknown }).languages)
      ? (body as { languages: unknown[] }).languages.filter(
        (language): language is string => typeof language === 'string'
      )
      : [];

    const requestedLanguages = dedupeSupportedLanguages(rawLanguages);
    const languages = requestedLanguages.length > 0
      ? requestedLanguages
      : [...SUPPORTED_EXECUTION_LANGUAGES];

    // Check if Gemini API key is configured
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured. Please add GEMINI_API_KEY to environment variables.' },
        { status: 500 }
      );
    }

    const generationRequest: ProblemGenerationRequest = {
      topic: body.topic,
      difficulty: body.difficulty,
      tags: body.tags || [],
      constraints: body.constraints,
      numProblems: body.numProblems || 1,
      languages,
    };

    const job = await enqueueProblemGenerationJob({
      createdBy: session.user.id,
      request: generationRequest,
    });

    return NextResponse.json(
      {
        jobId: job.jobId,
        status: job.status,
        progressMessage: job.progressMessage,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error('Error in problem generation API:', error);
    return NextResponse.json(
      {
        error: 'Failed to enqueue problem generation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
