// API route for assignment management

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase/client';

// GET - List instructor's assignments
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Only instructors can view assignments' }, { status: 403 });
    }

    // Fetch assignments with problem count and classroom count
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select(`
        *,
        assignment_problems(count),
        classroom_assignments(count)
      `)
      .eq('created_by', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assignments:', error);
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
    }

    // Transform the data
    const transformedAssignments = assignments?.map(assignment => ({
      ...assignment,
      problem_count: assignment.assignment_problems?.[0]?.count || 0,
      classroom_count: assignment.classroom_assignments?.[0]?.count || 0,
    }));

    return NextResponse.json({ assignments: transformedAssignments || [] });
  } catch (error) {
    console.error('Error in assignments API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new assignment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'instructor') {
      return NextResponse.json({ error: 'Only instructors can create assignments' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, deadline, problem_ids } = body;

    // Validation
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!deadline) {
      return NextResponse.json({ error: 'Deadline is required' }, { status: 400 });
    }

    if (!problem_ids || !Array.isArray(problem_ids) || problem_ids.length === 0) {
      return NextResponse.json({ error: 'At least one problem is required' }, { status: 400 });
    }

    // Create assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        created_by: session.user.id,
        deadline: new Date(deadline).toISOString(),
      })
      .select()
      .single();

    if (assignmentError) {
      console.error('Error creating assignment:', assignmentError);
      return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
    }

    // Add problems to assignment
    const assignmentProblems = problem_ids.map((problem_id: string, index: number) => ({
      assignment_id: assignment.id,
      problem_id,
      order_index: index,
    }));

    const { error: problemsError } = await supabase
      .from('assignment_problems')
      .insert(assignmentProblems);

    if (problemsError) {
      console.error('Error adding problems to assignment:', problemsError);
      // Rollback: delete the assignment
      await supabase.from('assignments').delete().eq('id', assignment.id);
      return NextResponse.json({ error: 'Failed to add problems to assignment' }, { status: 500 });
    }

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error('Error in create assignment API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
