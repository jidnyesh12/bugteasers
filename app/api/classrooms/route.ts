// API route for listing classrooms

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase/client';

const JOIN_CODE_LENGTH = 6;
const MAX_JOIN_CODE_ATTEMPTS = 8;

interface ClassroomSummary {
  id: string;
  name: string;
  instructor_id: string;
}

interface StudentEnrollmentRow {
  id: string;
  joined_at: string;
  classroom: ClassroomSummary | ClassroomSummary[] | null;
}

function firstRelationRecord<TRow>(value: TRow | TRow[] | null | undefined): TRow | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function generateJoinCodeCandidate(): string {
  return Math.random().toString(36).substring(2, 2 + JOIN_CODE_LENGTH).toUpperCase();
}

async function generateUniqueJoinCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_JOIN_CODE_ATTEMPTS; attempt += 1) {
    const joinCode = generateJoinCodeCandidate();

    const { data, error } = await supabase
      .from('classrooms')
      .select('id')
      .eq('join_code', joinCode)
      .limit(1);

    if (error) {
      throw new Error(`Failed to validate join code uniqueness: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return joinCode;
    }
  }

  throw new Error('Failed to generate unique join code');
}

// GET - List classrooms
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role === 'instructor') {
      // List instructor's created classrooms
      const { data: classrooms, error } = await supabase
        .from('classrooms')
        .select(`
            *,
            classroom_students(count),
            classroom_assignments(count)
        `)
        .eq('instructor_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching classrooms:', error);
        return NextResponse.json({ error: 'Failed to fetch classrooms' }, { status: 500 });
      }

      return NextResponse.json({ classrooms: classrooms || [] });
    } else {
      // List student's enrolled classrooms
      const { data: enrollments, error } = await supabase
        .from('classroom_students')
        .select(`
          id,
          joined_at,
          classroom:classrooms (
            id,
            name,
            instructor_id
          )
        `)
        .eq('student_id', session.user.id)
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error fetching enrolled classrooms:', error);
        return NextResponse.json({ error: 'Failed to fetch classrooms' }, { status: 500 });
      }

      const normalizedEnrollments = ((enrollments as StudentEnrollmentRow[] | null) ?? [])
        .map((enrollment) => ({
          id: enrollment.id,
          joined_at: enrollment.joined_at,
          classroom: firstRelationRecord(enrollment.classroom),
        }))
        .filter(
          (
            enrollment
          ): enrollment is {
            id: string;
            joined_at: string;
            classroom: ClassroomSummary;
          } => Boolean(enrollment.classroom?.id && enrollment.classroom?.name)
        );

      return NextResponse.json({ classrooms: normalizedEnrollments });
    }
  } catch (error) {
    console.error('Error in list classrooms API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create classroom (Instructor only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Only instructors can create classrooms' }, { status: 403 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Classroom name is required' }, { status: 400 });
    }

    // Generate a unique 6-character join code
    const joinCode = await generateUniqueJoinCode();

    const { data: classroom, error } = await supabase
      .from('classrooms')
      .insert({
        name: name.trim(),
        instructor_id: session.user.id,
        join_code: joinCode,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating classroom:', error);
      return NextResponse.json({ error: 'Failed to create classroom' }, { status: 500 });
    }

    return NextResponse.json({ classroom }, { status: 201 });
  } catch (error) {
    console.error('Error in create classroom API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
