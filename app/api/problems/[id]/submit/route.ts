import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase/client';
import { createExecutionService } from '@/lib/execution';
import { PistonClientImpl } from '@/lib/execution/client';
import { TestCaseEvaluatorImpl } from '@/lib/execution/evaluator';

const SUPPORTED_LANGUAGES = ['python', 'java', 'cpp', 'c'] as const;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: problemId } = await params;

    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request: body must be valid JSON' },
        { status: 400 }
      );
    }
    const { code, language, assignmentId } = body;

    // Validate inputs
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: code is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!language || typeof language !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: language is required and must be a string' },
        { status: 400 }
      );
    }

    if (!SUPPORTED_LANGUAGES.includes(language as typeof SUPPORTED_LANGUAGES[number])) {
      return NextResponse.json(
        { error: `Invalid request: language must be one of ${SUPPORTED_LANGUAGES.join(', ')}` },
        { status: 400 }
      );
    }

    if (assignmentId !== undefined && typeof assignmentId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: assignmentId must be a string' },
        { status: 400 }
      );
    }

    // Validate problem exists
    const { data: problem, error: problemError } = await supabase
      .from('problems')
      .select('id')
      .eq('id', problemId)
      .single();

    if (problemError || !problem) {
      return NextResponse.json(
        { error: 'Problem not found' },
        { status: 404 }
      );
    }

    // Create execution service
    const pistonClient = new PistonClientImpl();
    const evaluator = new TestCaseEvaluatorImpl();
    const executionService = createExecutionService({
      pistonClient,
      evaluator,
      supabase,
    });

    // Execute code in Submit mode
    const result = await executionService.submitCode(
      {
        code,
        language: language as typeof SUPPORTED_LANGUAGES[number],
        problemId,
        assignmentId,
      },
      session.user.id
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error in submit endpoint:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
