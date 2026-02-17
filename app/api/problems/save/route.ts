// API route for saving generated problems

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.user.role !== 'instructor' && session.user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Only instructors can save problems' },
                { status: 403 }
            );
        }

        const { problems } = await request.json();

        if (!problems || !Array.isArray(problems) || problems.length === 0) {
            return NextResponse.json({ error: 'No problems provided' }, { status: 400 });
        }

        const savedProblems = [];

        for (const problem of problems) {
            // Insert problem
            const { data: insertedProblem, error: problemError } = await supabase
                .from('problems')
                .insert({
                    created_by: session.user.id,
                    title: problem.title,
                    description: problem.description,
                    difficulty: problem.difficulty,
                    tags: problem.tags,
                    constraints: problem.constraints,
                    examples: problem.examples,
                    hints: problem.hints,
                    time_limit: problem.time_limit,
                    memory_limit: problem.memory_limit,
                    starter_code: typeof problem.starter_code === 'string'
                        ? problem.starter_code
                        : JSON.stringify(problem.starter_code),
                    solution_code: problem.solution_code,
                })
                .select()
                .single();

            if (problemError) {
                console.error('Error inserting problem:', problemError);
                return NextResponse.json(
                    { error: `DB error: ${problemError.message}`, details: problemError },
                    { status: 500 }
                );
            }

            // Insert test cases
            if (problem.test_cases && problem.test_cases.length > 0) {
                const testCasesToInsert = problem.test_cases.map(
                    (tc: { input_data: string; expected_output: string; is_sample: boolean; points: number }) => ({
                        problem_id: insertedProblem.id,
                        input_data: tc.input_data,
                        expected_output: tc.expected_output,
                        is_sample: tc.is_sample ?? false,
                        points: tc.points ?? 1,
                    })
                );

                const { error: testCasesError } = await supabase
                    .from('test_cases')
                    .insert(testCasesToInsert);

                if (testCasesError) {
                    console.error('Error inserting test cases:', testCasesError);
                    return NextResponse.json(
                        { error: `Test case error: ${testCasesError.message}`, details: testCasesError },
                        { status: 500 }
                    );
                }
            }

            savedProblems.push(insertedProblem);
        }

        return NextResponse.json({ problems: savedProblems }, { status: 201 });
    } catch (error) {
        console.error('Error saving problems:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: `Failed to save problems: ${message}` }, { status: 500 });
    }
}
