import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  getProblemGenerationJobForUser,
  progressProblemGenerationJob,
  cancelProblemGenerationJob,
} from '@/lib/ai/generation-jobs';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ownedJob = await getProblemGenerationJobForUser(jobId, session.user.id);
    if (!ownedJob) {
      return NextResponse.json({ error: 'Generation job not found' }, { status: 404 });
    }

    const progressedJob = await progressProblemGenerationJob(jobId);
    const finalJob = progressedJob ?? ownedJob;

    return NextResponse.json(
      {
        jobId: finalJob.jobId,
        status: finalJob.status,
        progressMessage: finalJob.progressMessage,
        problems: finalJob.problems,
        error: finalJob.errorMessage,
        retryCount: finalJob.retryCount,
        maxRetries: finalJob.maxRetries,
        retryHistory: finalJob.retryHistory,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in generation job status API:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch generation job status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const action = typeof body.action === 'string' ? body.action : '';

    if (action !== 'cancel') {
      return NextResponse.json(
        { error: 'Invalid action. Supported actions: cancel' },
        { status: 400 }
      );
    }

    const result = await cancelProblemGenerationJob(jobId, session.user.id);

    if (!result) {
      return NextResponse.json(
        { error: 'Generation job not found or not owned by you' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        jobId: result.jobId,
        status: result.status,
        progressMessage: result.progressMessage,
        error: result.errorMessage,
        retryCount: result.retryCount,
        maxRetries: result.maxRetries,
        retryHistory: result.retryHistory,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error cancelling generation job:', error);
    return NextResponse.json(
      {
        error: 'Failed to cancel generation job',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
