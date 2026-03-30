import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase/client';
import { mapExecutionErrorToHttp } from '@/lib/execution/error-mapping';
import { getAssignmentSubmissionOverview } from '@/lib/submissions/service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  void request;

  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Only instructors can view assignment submissions' }, { status: 403 });
    }

    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('id, created_by, closed_at')
      .eq('id', id)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (assignment.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const submissions = await getAssignmentSubmissionOverview({
      supabase,
      assignmentId: id,
    });

    return NextResponse.json(
      {
        submissions,
        assignment: {
          id: assignment.id,
          closed_at: assignment.closed_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const mapped = mapExecutionErrorToHttp(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
