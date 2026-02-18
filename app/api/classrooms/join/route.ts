// API route for students to join classrooms

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase/client';

// POST - Student joins classroom with join code
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status:  401 });
    }

    if (session.user.role !== 'student') {
      return NextResponse.json({ error: 'Only students can join classrooms' }, { status: 403 });
    }

    const body = await request.json();
    const { join_code } = body;

    if (!join_code?.trim()) {
      return NextResponse.json({ error: 'Join code is required' }, { status: 400 });
    }

    // Find classroom by join code
    const { data: classroom, error: classroomError } = await supabase
      .from('classrooms')
      .select('id, name, instructor_id')
      .eq('join_code', join_code.trim().toUpperCase())
      .single();

    if (classroomError || !classroom) {
      return NextResponse.json({ error: 'Invalid join code' }, { status: 404 });
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('classroom_students')
      .select('id')
      .eq('classroom_id', classroom.id)
      .eq('student_id', session.user.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already enrolled in this classroom' }, { status: 409 });
    }

    // Enroll student
    const { error: enrollError } = await supabase
      .from('classroom_students')
      .insert({
        classroom_id: classroom.id,
        student_id: session.user.id,
      });

    if (enrollError) {
      console.error('Error enrolling student:', enrollError);
      return NextResponse.json({ error: 'Failed to join classroom' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      classroom: {
        id: classroom.id,
        name: classroom.name,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error in join classroom API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
