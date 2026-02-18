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

    const { data: problem, error } = await supabase
      .from('problems')
      .select(`
        *,
        test_cases (
          id,
          input_data,
          expected_output,
          is_sample,
          points,
          created_at
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching problem:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch problem' }, { status: 500 });
    }

    const isInstructor = session.user.role === 'instructor';

    if (isInstructor) {
      // Instructors get everything including solution_code
      return NextResponse.json({ problem });
    }

    // Students: strip solution_code, only show sample test cases
    const { solution_code, ...safeFields } = problem;
    const sampleTestCases = (problem.test_cases || []).filter(
      (tc: { is_sample: boolean }) => tc.is_sample
    );

    return NextResponse.json({
      problem: {
        ...safeFields,
        test_cases: sampleTestCases,
      },
    });
  } catch (error) {
    console.error('Error in problem detail API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
