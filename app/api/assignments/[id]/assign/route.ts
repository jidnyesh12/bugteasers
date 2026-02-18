// API route for assigning assignments to classrooms

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase/client';

// POST - Assign assignment to classrooms
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Only instructors can assign assignments' }, { status: 403 });
    }

    const body = await request.json();
    const { classroom_ids } = body;

    if (!classroom_ids || !Array.isArray(classroom_ids) || classroom_ids.length === 0) {
      return NextResponse.json({ error: 'At least one classroom is required' }, { status: 400 });
    }

    // Verify ownership of assignment
    const { data: assignment } = await supabase
      .from('assignments')
      .select('created_by')
      .eq('id', id)
      .single();

    if (!assignment || assignment.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const { data: classrooms } = await supabase
      .from('classrooms')
      .select('id')
      .in('id', classroom_ids)
      .eq('instructor_id', session.user.id);

    if (!classrooms || classrooms.length !== classroom_ids.length) {
      return NextResponse.json({ error: 'Invalid classroom IDs' }, { status: 400 });
    }

    const classroomAssignments = classroom_ids.map((classroom_id: string) => ({
      classroom_id,
      assignment_id: id,
    }));

    const { error } = await supabase
      .from('classroom_assignments')
      .upsert(classroomAssignments, {
        onConflict: 'classroom_id,assignment_id',
        ignoreDuplicates: true,
      });

    if (error) {
      console.error('Error assigning to classrooms:', error);
      return NextResponse.json({ error: 'Failed to assign to classrooms' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in assign assignment API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove assignment from classroom
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Only instructors can unassign assignments' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const classroom_id = searchParams.get('classroom_id');

    if (!classroom_id) {
      return NextResponse.json({ error: 'Classroom ID is required' }, { status: 400 });
    }

    // Verify ownership
    const { data: assignment } = await supabase
      .from('assignments')
      .select('created_by')
      .eq('id', id)
      .single();

    if (!assignment || assignment.created_by !== session.user.id) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('classroom_assignments')
      .delete()
      .eq('assignment_id', id)
      .eq('classroom_id', classroom_id);

    if (error) {
      console.error('Error removing assignment from classroom:', error);
      return NextResponse.json({ error: 'Failed to remove assignment' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in unassign assignment API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
