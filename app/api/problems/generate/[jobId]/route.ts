import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  getProblemGenerationJobForUser,
  progressProblemGenerationJob,
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
