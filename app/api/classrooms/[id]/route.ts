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

    const { data: classroom, error } = await supabase
      .from('classrooms')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !classroom) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
    }

    if (session.user.role === 'instructor' && classroom.instructor_id !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (session.user.role === 'student') {
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

    return NextResponse.json({ classroom });
  } catch (error) {
    console.error('Error in get classroom API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
