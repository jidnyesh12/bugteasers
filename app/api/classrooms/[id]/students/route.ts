// API route for classroom student management

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase/client';

// GET - List students in classroom
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

    const { data: students, error } = await supabase
      .from('classroom_students')
      .select(`
        id,
        joined_at,
        student:users!classroom_students_student_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq('classroom_id', id)
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('Error fetching students:', error);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    return NextResponse.json({ students: students || [] });
  } catch (error) {
    console.error('Error in get students API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove student from classroom
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

    const { searchParams } = new URL(request.url);
    const student_id = searchParams.get('student_id');

    if (!student_id) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const { data: classroom } = await supabase
      .from('classrooms')
      .select('instructor_id')
      .eq('id', id)
      .single();

    if (!classroom || classroom.instructor_id !== session.user.id) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('classroom_students')
      .delete()
      .eq('classroom_id', id)
      .eq('student_id', student_id);

    if (error) {
      console.error('Error removing student:', error);
      return NextResponse.json({ error: 'Failed to remove student' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in remove student API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
