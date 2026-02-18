// API route for classroom assignments

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase/client';

// GET - List assignments in classroom
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

    if (session.user.role === 'instructor') {
      const { data: classroom } = await supabase
        .from('classrooms')
        .select('instructor_id')
        .eq('id', id)
        .single();

      if (!classroom || classroom.instructor_id !== session.user.id) {
        return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
      }
    } else {
      const { data: enrollment } = await supabase
        .from('classroom_students')
        .select('id')
        .eq('classroom_id', id)
        .eq('student_id', session.user.id)
        .single();

      if (!enrollment) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const { data: classroomAssignments, error } = await supabase
      .from('classroom_assignments')
      .select(`
        id,
        assigned_at,
        assignment:assignments (
          id,
          title,
          description,
          deadline,
          created_at,
          assignment_problems (count)
        )
      `)
      .eq('classroom_id', id)
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('Error fetching classroom assignments:', error);
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
    }

    // Transform data
    const assignments = classroomAssignments?.map(ca => ({
      ...ca.assignment,
      problem_count: (ca.assignment as unknown as { assignment_problems: { count: number }[] }).assignment_problems?.[0]?.count || 0,
      assigned_at: ca.assigned_at,
    })) || [];

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Error in get classroom assignments API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
