// API route for problem generation

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateProblems } from '@/lib/ai/problem-generator';
import { ProblemGenerationRequest } from '@/lib/ai/types';

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
    if (!body.topic || !body.difficulty) {
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

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured. Please add GEMINI_API_KEY to environment variables.' },
        { status: 500 }
      );
    }

    // Generate problems using AI
    const result = await generateProblems({
      topic: body.topic,
      difficulty: body.difficulty,
      tags: body.tags || [],
      constraints: body.constraints,
      numProblems: body.numProblems || 1,
      languages: body.languages || ['python', 'javascript', 'java', 'cpp'],
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error in problem generation API:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate problems',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
