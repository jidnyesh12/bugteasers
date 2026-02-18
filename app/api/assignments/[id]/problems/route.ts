import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // Assignment ID
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { problem_id } = body;

    if (!problem_id) {
      return NextResponse.json({ error: 'Problem ID is required' }, { status: 400 });
    }

    // Verify assignment exists and belongs to instructor
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('id, created_by')
      .eq('id', id)
      .single();

    if (assignmentError || !assignment) {
        return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (assignment.created_by !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get current max order_index to append to the end
    const { data: existingProblems } = await supabase
      .from('assignment_problems')
      .select('order_index')
      .eq('assignment_id', id)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrderIndex = (existingProblems && existingProblems.length > 0) 
        ? (existingProblems[0].order_index + 1) 
        : 0;

    // Insert the problem
    const { error } = await supabase
      .from('assignment_problems')
      .upsert({
        assignment_id: id,
        problem_id: problem_id,
        order_index: nextOrderIndex
      }, { onConflict: 'assignment_id,problem_id' });

    if (error) {
        console.error('Error adding problem to assignment:', error);
        return NextResponse.json({ error: 'Failed to add problem' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in add problem API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
