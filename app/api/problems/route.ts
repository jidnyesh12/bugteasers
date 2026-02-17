// API route for listing problems

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase/client';

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
            .select('id, title, difficulty, tags, usage_count, created_at')
            .order('created_at', { ascending: false });

        if (mine) {
            query = query.eq('created_by', session.user.id);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching problems:', error);
            return NextResponse.json({ error: 'Failed to fetch problems' }, { status: 500 });
        }

        return NextResponse.json({ problems: data || [] });
    } catch (error) {
        console.error('Error in problems API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
