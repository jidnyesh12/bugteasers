import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: assignment, error } = await supabase
      .from('assignments')
      .select(`
        *,
        assignment_problems (
          id,
          problem_id,
          order_index,
          problems (
            id,
            title,
            difficulty,
            tags
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const isInstructor = session.user.role === 'instructor';
    const isOwner = assignment.created_by === session.user.id;

    if (!isInstructor && !isOwner) {
      // Student: check access via classroom
      const { data: access } = await supabase
        .from('classroom_assignments')
        .select('classroom_id')
        .eq('assignment_id', id)
        .limit(1);

      if (!access || access.length === 0) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      const { data: enrollment } = await supabase
        .from('classroom_students')
        .select('id')
        .eq('classroom_id', access[0].classroom_id)
        .eq('student_id', session.user.id)
        .limit(1);

      if (!enrollment || enrollment.length === 0) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else if (isInstructor && !isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const problems = assignment.assignment_problems
      ?.sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
      .map((ap: { problems: { id: string; title: string; difficulty: string; tags: string[] }; order_index: number }) => ({
        id: ap.problems.id,
        title: ap.problems.title,
        difficulty: ap.problems.difficulty,
        tags: ap.problems.tags,
        order_index: ap.order_index,
      })) || [];

    return NextResponse.json({ assignment: { ...assignment, problems } });
  } catch (error) {
    console.error('Error in get assignment API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role !== 'instructor') return NextResponse.json({ error: 'Only instructors can update assignments' }, { status: 403 });

    const body = await request.json();
    const { title, description, deadline, problem_ids } = body;

    const { data: existingAssignment } = await supabase
      .from('assignments').select('created_by').eq('id', id).single();

    if (!existingAssignment || existingAssignment.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (title) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (deadline) updateData.deadline = new Date(deadline).toISOString();

    const { error: updateError } = await supabase.from('assignments').update(updateData).eq('id', id);
    if (updateError) return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });

    if (problem_ids && Array.isArray(problem_ids)) {
      await supabase.from('assignment_problems').delete().eq('assignment_id', id);
      if (problem_ids.length > 0) {
        const { error: problemsError } = await supabase.from('assignment_problems').insert(
          problem_ids.map((problem_id: string, index: number) => ({ assignment_id: id, problem_id, order_index: index }))
        );
        if (problemsError) return NextResponse.json({ error: 'Failed to update problems' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in update assignment API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role !== 'instructor') return NextResponse.json({ error: 'Only instructors can delete assignments' }, { status: 403 });

    const { error } = await supabase.from('assignments').delete().eq('id', id).eq('created_by', session.user.id);
    if (error) return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in delete assignment API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
