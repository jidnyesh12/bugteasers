// API route for saving generated problems

import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase/client';

const PLACEHOLDER_PATTERNS = [
    /\{\{\s*PLACEHOLDER(?::|_)[^}]+\}\}/i,
    /\$\{\s*PLACEHOLDER(?::|_)[^}]+\}/i,
    /__PLACEHOLDER_[A-Z0-9_]+__/,
    /\[PLACEHOLDER:[^\]]+\]/i,
];

function hasUnresolvedPlaceholder(value: string): boolean {
    return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value));
}

type SaveTestCase = {
    input_data: string;
    expected_output: string;
    is_sample?: boolean;
    points?: number;
    generated_at?: string;
    generation_model?: string;
    generation_seed?: string;
    is_generated?: boolean;
    input_hash?: string;
};

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
            if (!problem.test_cases || !Array.isArray(problem.test_cases) || problem.test_cases.length === 0) {
                return NextResponse.json(
                    { error: 'Each problem must include at least one fully materialized test case' },
                    { status: 400 }
                );
            }

            const unresolvedCase = (problem.test_cases as SaveTestCase[]).find((tc) => {
                if (!tc || typeof tc.input_data !== 'string' || typeof tc.expected_output !== 'string') {
                    return true;
                }

                if (tc.input_data.trim().length === 0 || tc.expected_output.trim().length === 0) {
                    return true;
                }

                return (
                    hasUnresolvedPlaceholder(tc.input_data) ||
                    hasUnresolvedPlaceholder(tc.expected_output)
                );
            });

            if (unresolvedCase) {
                return NextResponse.json(
                    {
                        error:
                            'Problem contains unresolved or invalid test case data. Please complete validation before saving.',
                    },
                    { status: 400 }
                );
            }

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
                    (tc: SaveTestCase) => ({
                        problem_id: insertedProblem.id,
                        input_data: tc.input_data,
                        expected_output: tc.expected_output,
                        is_sample: tc.is_sample ?? false,
                        points: tc.points ?? 1,
                        generated_at: tc.generated_at ?? null,
                        generation_model: tc.generation_model ?? null,
                        generation_seed: tc.generation_seed ?? null,
                        is_generated: tc.is_generated ?? false,
                        input_hash:
                            tc.input_hash ??
                            createHash('sha256').update(tc.input_data).digest('hex'),
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
