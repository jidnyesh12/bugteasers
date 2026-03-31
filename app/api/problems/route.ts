// API route for listing problems

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase/client';

interface ProblemListRow {
    id: string;
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
    tags: string[] | null;
    usage_count: number | null;
    created_at: string;
    assignment_problems?: { count: number }[];
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const mine = searchParams.get('mine') === 'true';

        let query = supabase
            .from('problems')
            .select('id, title, difficulty, tags, usage_count, created_at, assignment_problems(count)')
            .order('created_at', { ascending: false });

        if (mine) {
            query = query.eq('created_by', session.user.id);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching problems:', error);
            return NextResponse.json({ error: 'Failed to fetch problems' }, { status: 500 });
        }

        const problems = ((data as ProblemListRow[] | null) ?? []).map((problem) => ({
            id: problem.id,
            title: problem.title,
            difficulty: problem.difficulty,
            tags: problem.tags || [],
            usage_count: problem.assignment_problems?.[0]?.count ?? problem.usage_count ?? 0,
            created_at: problem.created_at,
        }));

        return NextResponse.json({ problems });
    } catch (error) {
        console.error('Error in problems API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
