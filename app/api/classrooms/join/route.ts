import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { join_code } = body;

    if (!join_code) {
      return NextResponse.json({ error: 'Join code is required' }, { status: 400 });
    }

    // Find classroom
    const { data: classroom, error: classroomError } = await supabase
      .from('classrooms')
      .select('id, name')
      .eq('join_code', join_code.toUpperCase().trim())
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
        return NextResponse.json({ error: 'Already enrolled in this classroom' }, { status: 400 });
    }

    // Enroll
    const { error: joinError } = await supabase
        .from('classroom_students')
        .insert({
            classroom_id: classroom.id,
            student_id: session.user.id,
            joined_at: new Date().toISOString()
        });

    if (joinError) {
        console.error('Error joining classroom:', joinError);
        return NextResponse.json({ error: 'Failed to join classroom' }, { status: 500 });
    }

    return NextResponse.json({ success: true, classroom });

  } catch (error) {
      console.error('Join classroom error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
