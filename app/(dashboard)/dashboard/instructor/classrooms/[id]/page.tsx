'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { FullPageLoader } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import type { Classroom, Assignment } from '@/lib/types';

interface Student {
  id: string;
  joined_at: string;
  student: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface ClassroomAssignment extends Assignment {
  assigned_at: string;
  problem_count: number;
}

export default function ClassroomDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { profile, loading: authLoading, initialized } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'students' | 'assignments'>('students');
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<ClassroomAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!initialized || authLoading) return;
    if (!profile) { router.replace('/login'); return; }
    if (profile.role !== 'instructor') { router.replace('/dashboard/student'); return; }
  }, [profile, authLoading, initialized, router]);

  useEffect(() => {
    if (profile?.role === 'instructor') {
      loadClassroomData();
    }
  }, [profile?.role, params.id]);

  const loadClassroomData = async () => {
    try {
      setIsLoading(true);
      
      // Load classroom details
      const classroomRes = await fetch(`/api/classrooms/${params.id}`);
      if (!classroomRes.ok) throw new Error('Failed to load classroom');
      const classroomData = await classroomRes.json();
      setClassroom(classroomData.classroom);

      // Load students and assignments in parallel
      const [studentsRes, assignmentsRes] = await Promise.all([
        fetch(`/api/classrooms/${params.id}/students`),
        fetch(`/api/classrooms/${params.id}/assignments`)
      ]);

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData.students || []);
      }

      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json();
        setAssignments(assignmentsData.assignments || []);
      }

    } catch (error) {
      console.error('Error loading classroom data:', error);
      toast('Failed to load classroom details', 'error');
      router.push('/dashboard/instructor/classrooms');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (classroom?.join_code) {
      navigator.clipboard.writeText(classroom.join_code);
      toast('Join code copied!', 'success');
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to remove this student?')) return;

    try {
      const res = await fetch(`/api/classrooms/${params.id}/students?student_id=${studentId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to remove student');

      setStudents(prev => prev.filter(s => s.student.id !== studentId));
      toast('Student removed', 'success');
    } catch (error) {
      console.error('Error removing student:', error);
      toast('Failed to remove student', 'error');
    }
  };

  const handleUnassign = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this assignment from the classroom?')) return;

    try {
      const res = await fetch(`/api/assignments/${assignmentId}/assign?classroom_id=${params.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to remove assignment');

      setAssignments(prev => prev.filter(a => a.id !== assignmentId));
      toast('Assignment removed', 'success');
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast('Failed to remove assignment', 'error');
    }
  };

  if (!initialized || authLoading || !profile || isLoading) return <FullPageLoader />;
  if (!classroom) return null;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard/instructor/classrooms')}
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors mb-4 group cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Classrooms
        </button>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] mb-2">
              {classroom.name}
            </h1>
            <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
              <span className="flex items-center gap-1.5 font-mono bg-[var(--bg-secondary)] px-2 py-1 rounded border border-[var(--border-primary)]">
                <span className="text-[var(--text-muted)]">Code:</span>
                <span className="font-bold text-[var(--text-primary)]">{classroom.join_code}</span>
                <button onClick={handleCopyCode} className="ml-1 hover:text-[var(--accent-primary)]" title="Copy code">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </span>
              <span>•</span>
              <span>{students.length} Student{students.length !== 1 ? 's' : ''}</span>
              <span>•</span>
              <span>{assignments.length} Assignment{assignments.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-[var(--border-primary)] mb-6">
        <button
          onClick={() => setActiveTab('students')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'students' 
              ? 'text-[var(--accent-primary)]' 
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Students ({students.length})
          {activeTab === 'students' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)] rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'assignments' 
              ? 'text-[var(--accent-primary)]' 
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Assignments ({assignments.length})
          {activeTab === 'assignments' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)] rounded-t-full" />
          )}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'students' ? (
        <div className="space-y-4">
          {students.length === 0 ? (
            <div className="text-center py-12 bg-white border border-[var(--border-primary)] rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center mx-auto mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              </div>
              <p className="text-sm font-bold text-[var(--text-primary)]">No students yet</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Share the join code <span className="font-mono bg-[var(--bg-secondary)] px-1 py-0.5 rounded">{classroom.join_code}</span> with your students
              </p>
            </div>
          ) : (
            <div className="bg-white border border-[var(--border-primary)] rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]">
                  <tr>
                    <th className="px-6 py-3 font-bold text-[var(--text-secondary)]">Name</th>
                    <th className="px-6 py-3 font-bold text-[var(--text-secondary)]">Email</th>
                    <th className="px-6 py-3 font-bold text-[var(--text-secondary)]">Joined</th>
                    <th className="px-6 py-3 font-bold text-[var(--text-secondary)] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-primary)]">
                  {students.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">
                        {enrollment.student.full_name}
                      </td>
                      <td className="px-6 py-4 text-[var(--text-secondary)]">
                        {enrollment.student.email}
                      </td>
                      <td className="px-6 py-4 text-[var(--text-muted)]">
                        {new Date(enrollment.joined_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRemoveStudent(enrollment.student.id)}
                          className="text-red-600 hover:text-red-700 font-semibold text-xs hover:underline"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => router.push('/dashboard/instructor/assignments/new')}>
              + Assign New
            </Button>
          </div>
          
          {assignments.length === 0 ? (
            <div className="text-center py-12 bg-white border border-[var(--border-primary)] rounded-2xl">
              <p className="text-sm font-bold text-[var(--text-primary)]">No assignments assigned</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Assignments you create and assign to this classroom will appear here
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="bg-white border border-[var(--border-primary)] rounded-xl p-4 flex items-center justify-between group">
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                      {assignment.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mt-1">
                      <span>{assignment.problem_count} {assignment.problem_count === 1 ? 'problem' : 'problems'}</span>
                      <span>•</span>
                      <span>Due {new Date(assignment.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => router.push(`/dashboard/instructor/assignments/${assignment.id}`)}
                      className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      View Details
                    </button>
                    <button 
                      onClick={() => handleUnassign(assignment.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-[var(--text-muted)] hover:text-red-600 transition-colors"
                      title="Remove assignment from classroom"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
