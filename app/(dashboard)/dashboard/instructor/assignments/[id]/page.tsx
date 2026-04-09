"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { FullPageLoader } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { Assignment, Classroom } from "@/lib/types";
import {
  assignAssignmentToClassrooms,
  closeAssignment,
  deleteAssignment,
  fetchAssignmentDetail,
  fetchAssignmentSubmissionOverview,
  reopenAssignment,
} from "@/lib/api/assignments-client";
import { fetchClassrooms } from "@/lib/api/classrooms-client";
import { queryKeys } from "@/lib/state/query";
import type {
  AssignmentSubmissionOverview,
  AssignmentSubmissionSummary,
  SubmissionStatus,
} from "@/lib/submissions/types";

import { MarkdownRenderer } from "@/components/markdown-renderer";

interface Problem {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  order_index: number;
}

interface AssignmentDetails extends Assignment {
  problems: Problem[];
}

const difficultyStyles = {
  easy: "flat-badge-green",
  medium: "flat-badge-amber",
  hard: "flat-badge-red",
};

const submissionStatusStyles: Record<SubmissionStatus, string> = {
  pending: "flat-badge-blue",
  passed: "flat-badge-green",
  partial: "flat-badge-amber",
  failed: "flat-badge-red",
  error: "flat-badge-red",
};

const submissionStatusLabels: Record<SubmissionStatus, string> = {
  pending: "Pending",
  passed: "Correct",
  partial: "Partial",
  failed: "Incorrect",
  error: "Error",
};

export default function AssignmentDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { profile, loading: authLoading, initialized } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Assign Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClassrooms, setSelectedClassrooms] = useState<string[]>([]);

  const { data: assignment, isFetching: isLoading } =
    useQuery<AssignmentDetails>({
      queryKey: queryKeys.assignments.detail(params.id),
      queryFn: () => fetchAssignmentDetail<AssignmentDetails>(params.id),
      enabled: profile?.role === "instructor",
    });

  const {
    data: classrooms = [],
    isFetching: loadingClassrooms,
    refetch: refetchClassrooms,
  } = useQuery<Classroom[]>({
    queryKey: queryKeys.classrooms.instructorMine,
    queryFn: () => fetchClassrooms<Classroom>(),
    enabled: profile?.role === "instructor" && showAssignModal,
  });

  const {
    data: submissionOverview,
    isFetching: isSubmissionsLoading,
    error: submissionsError,
  } = useQuery<AssignmentSubmissionOverview>({
    queryKey: queryKeys.submissions.assignmentSummary(params.id),
    queryFn: () =>
      fetchAssignmentSubmissionOverview<AssignmentSubmissionOverview>(
        params.id,
      ),
    enabled: profile?.role === "instructor",
  });

  const { mutateAsync: deleteAssignmentAsync, isPending: isDeleting } =
    useMutation({
      mutationFn: deleteAssignment,
    });

  const { mutateAsync: assignAssignmentAsync, isPending: isAssigning } =
    useMutation({
      mutationFn: ({
        assignmentId,
        classroomIds,
      }: {
        assignmentId: string;
        classroomIds: string[];
      }) => assignAssignmentToClassrooms(assignmentId, classroomIds),
    });

  const { mutateAsync: closeAssignmentAsync, isPending: isClosingAssignment } =
    useMutation({
      mutationFn: closeAssignment,
    });

  const {
    mutateAsync: reopenAssignmentAsync,
    isPending: isReopeningAssignment,
  } = useMutation({
    mutationFn: reopenAssignment,
  });

  useEffect(() => {
    if (!initialized || authLoading) return;
    if (!profile) {
      router.replace("/login");
      return;
    }
    if (profile.role !== "instructor") {
      router.replace("/dashboard/student");
      return;
    }
  }, [profile, authLoading, initialized, router]);

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this assignment? This cannot be undone.",
      )
    )
      return;

    try {
      await deleteAssignmentAsync(params.id);

      toast("Assignment deleted", "success");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.assignments.mine,
      });
      router.push("/dashboard/instructor/assignments");
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast("Failed to delete assignment", "error");
    }
  };

  const handleAssign = async () => {
    if (selectedClassrooms.length === 0) {
      toast("Select at least one classroom", "warning");
      return;
    }

    try {
      await assignAssignmentAsync({
        assignmentId: params.id,
        classroomIds: selectedClassrooms,
      });

      toast("Assignment assigned successfully!", "success");
      setShowAssignModal(false);
      setSelectedClassrooms([]);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.classrooms.instructorMine,
      });
      await Promise.all(
        selectedClassrooms.map((classroomId) =>
          queryClient.invalidateQueries({
            queryKey: queryKeys.classrooms.assignments(classroomId),
          }),
        ),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to assign";
      toast(message, "error");
    }
  };

  const handleCloseAssignment = async () => {
    if (assignment?.closed_at) {
      toast("Assignment is already closed", "warning");
      return;
    }

    if (
      !confirm(
        "Close this assignment? Students will no longer be able to submit for it.",
      )
    )
      return;

    try {
      await closeAssignmentAsync(params.id);
      toast("Assignment closed. New submissions are now blocked.", "success");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.assignments.detail(params.id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.submissions.assignmentSummary(params.id),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.assignments.mine }),
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to close assignment";
      toast(message, "error");
    }
  };

  const handleReopenAssignment = async () => {
    if (!assignment?.closed_at) {
      toast("Assignment is already open", "warning");
      return;
    }

    if (
      !confirm("Reopen this assignment? Students will be able to submit again.")
    )
      return;

    try {
      await reopenAssignmentAsync(params.id);
      toast("Assignment reopened. Students can submit again.", "success");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.assignments.detail(params.id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.submissions.assignmentSummary(params.id),
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.assignments.mine }),
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reopen assignment";
      toast(message, "error");
    }
  };

  const toggleClassroom = (id: string) => {
    setSelectedClassrooms((prev) =>
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id],
    );
  };

  const submissionSummaryLookup = useMemo(() => {
    const lookup = new Map<string, AssignmentSubmissionSummary>();
    for (const summary of submissionOverview?.summaries ?? []) {
      lookup.set(`${summary.studentId}:${summary.problemId}`, summary);
    }

    return lookup;
  }, [submissionOverview?.summaries]);

  const isAssignmentClosed = Boolean(assignment?.closed_at);
  const submissionStudents = useMemo(
    () => submissionOverview?.students ?? [],
    [submissionOverview?.students],
  );
  const submissionProblems = useMemo(
    () =>
      submissionOverview?.problems ??
      assignment?.problems?.map((problem) => ({
        id: problem.id,
        title: problem.title,
        orderIndex: problem.order_index,
      })) ??
      [],
    [assignment?.problems, submissionOverview?.problems],
  );

  const studentTotalScoreLookup = useMemo(() => {
    const totals = new Map<string, string>();

    for (const student of submissionStudents) {
      let earnedPoints = 0;
      let totalPoints = 0;
      let percentageTotal = 0;
      let percentageCount = 0;

      for (const problem of submissionProblems) {
        const summary = submissionSummaryLookup.get(
          `${student.id}:${problem.id}`,
        );
        const selectedSubmission = summary?.selectedSubmission;

        if (!selectedSubmission) {
          continue;
        }

        if (
          selectedSubmission.earnedPoints !== null &&
          selectedSubmission.totalPoints !== null &&
          Number.isFinite(selectedSubmission.earnedPoints) &&
          Number.isFinite(selectedSubmission.totalPoints) &&
          selectedSubmission.totalPoints > 0
        ) {
          earnedPoints += selectedSubmission.earnedPoints;
          totalPoints += selectedSubmission.totalPoints;
          continue;
        }

        if (
          selectedSubmission.score !== null &&
          Number.isFinite(selectedSubmission.score)
        ) {
          percentageTotal += selectedSubmission.score;
          percentageCount += 1;
        }
      }

      if (totalPoints > 0) {
        const percentage = Math.round((earnedPoints / totalPoints) * 100);
        totals.set(
          student.id,
          `${earnedPoints}/${totalPoints} (${percentage}%)`,
        );
        continue;
      }

      if (percentageCount > 0) {
        totals.set(
          student.id,
          `${Math.round(percentageTotal / percentageCount)}%`,
        );
        continue;
      }

      totals.set(student.id, "No score");
    }

    return totals;
  }, [submissionProblems, submissionStudents, submissionSummaryLookup]);

  const submissionsTableMinWidthPercent = useMemo(() => {
    const visibleProblemColumnsWithoutScroll = 2;
    if (submissionProblems.length <= visibleProblemColumnsWithoutScroll) {
      return 100;
    }

    return (
      100 +
      (submissionProblems.length - visibleProblemColumnsWithoutScroll) * 35
    );
  }, [submissionProblems.length]);

  if (!initialized || authLoading || !profile || isLoading)
    return <FullPageLoader />;
  if (!assignment) return null;

  const assignmentDeadline = new Date(assignment.deadline);
  const isAssignmentOverdue =
    !isAssignmentClosed && assignmentDeadline < new Date();

  const renderSubmissionCell = (
    summary: AssignmentSubmissionSummary | undefined,
  ) => {
    if (!summary || !summary.selectedSubmission) {
      return (
        <span className="text-[11px] text-[var(--text-muted)]">
          No submission
        </span>
      );
    }

    const selectedSubmission = summary.selectedSubmission;
    const scoreLabel =
      selectedSubmission.score !== null
        ? `${Math.round(selectedSubmission.score)}%`
        : selectedSubmission.earnedPoints !== null &&
            selectedSubmission.totalPoints !== null
          ? `${selectedSubmission.earnedPoints}/${selectedSubmission.totalPoints}`
          : "No score";

    return (
      <div className="space-y-1">
        <span
          className={`flat-badge ${submissionStatusStyles[selectedSubmission.status]}`}
        >
          {submissionStatusLabels[selectedSubmission.status]}
        </span>
        <p className="text-[11px] text-[var(--text-muted)]">
          {scoreLabel} · {summary.attemptsCount} attempt
          {summary.attemptsCount === 1 ? "" : "s"}
        </p>
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => router.push("/dashboard/instructor/assignments")}
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors mb-4 group cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="group-hover:-translate-x-0.5 transition-transform"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Assignments
        </button>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] mb-2">
              {assignment.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-secondary)]">
              <span className="flex items-center gap-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span
                  className={
                    isAssignmentOverdue ? "text-red-600 font-semibold" : ""
                  }
                >
                  Due {assignmentDeadline.toLocaleDateString()}
                </span>
              </span>
              <span>•</span>
              <span>{assignment.problems.length} problems</span>
              <span>•</span>
              {isAssignmentOverdue && (
                <>
                  <span className="flat-badge flat-badge-red">Overdue</span>
                  <span>•</span>
                </>
              )}
              <span
                className={`flat-badge ${isAssignmentClosed ? "flat-badge-red" : "flat-badge-green"}`}
              >
                {isAssignmentClosed ? "Closed" : "Open"}
              </span>
            </div>
          </div>
          <div className="flex w-full flex-wrap justify-start gap-2 xl:w-auto xl:justify-end">
            <Button
              className="whitespace-nowrap bg-[#1D4ED8] text-white hover:bg-[#1E40AF] focus-visible:ring-[#1D4ED8]"
              onClick={() => {
                setShowAssignModal(true);
                void refetchClassrooms();
              }}
            >
              Assign to Class
            </Button>
            <Button
              className="whitespace-nowrap bg-[#F59E0B] text-white hover:bg-[#D97706] focus-visible:ring-[#F59E0B]"
              onClick={handleCloseAssignment}
              disabled={
                isAssignmentClosed ||
                isClosingAssignment ||
                isReopeningAssignment
              }
            >
              {isClosingAssignment ? "Closing…" : "Close Assignment"}
            </Button>
            <Button
              className="whitespace-nowrap bg-[#059669] text-white hover:bg-[#047857] focus-visible:ring-[#059669]"
              onClick={handleReopenAssignment}
              disabled={
                !isAssignmentClosed ||
                isReopeningAssignment ||
                isClosingAssignment
              }
            >
              {isReopeningAssignment ? "Reopening…" : "Reopen Assignment"}
            </Button>
            <Button
              className="whitespace-nowrap bg-[#DC2626] text-white hover:bg-[#B91C1C] focus-visible:ring-[#DC2626]"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Description */}
        {assignment.description && (
          <div className="bg-white border border-[var(--border-primary)] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">
              Description
            </h3>
            <MarkdownRenderer
              content={assignment.description}
              className="text-sm"
            />
          </div>
        )}

        {/* Problems List */}
        <div className="bg-white border border-[var(--border-primary)] rounded-2xl p-6">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">
            Problems
          </h3>
          <div className="space-y-3">
            {assignment.problems.map((problem, index) => (
              <div
                key={problem.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-[var(--border-primary)] font-bold text-sm text-[var(--text-muted)]">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-[var(--text-primary)] truncate">
                    {problem.title}
                  </h4>
                  <div className="flex gap-2 mt-1">
                    {problem.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] bg-white px-1.5 py-0.5 rounded border border-[var(--border-primary)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <span
                  className={`flat-badge ${difficultyStyles[problem.difficulty]}`}
                >
                  {problem.difficulty}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[var(--border-primary)] rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Student Submissions
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Representative attempt per student and problem: latest correct,
                otherwise best partial, otherwise latest incorrect.
              </p>
            </div>
            <span className="text-xs text-[var(--text-muted)]">
              {isSubmissionsLoading
                ? "Refreshing..."
                : `${submissionStudents.length} student${submissionStudents.length === 1 ? "" : "s"}`}
            </span>
          </div>

          {submissionsError ? (
            <p className="text-sm text-red-600">
              Failed to load submission summary.
            </p>
          ) : submissionProblems.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              Add problems to this assignment to track submissions.
            </p>
          ) : submissionStudents.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              No students are enrolled in classrooms that received this
              assignment yet.
            </p>
          ) : (
            <div className="w-full max-w-full overflow-x-auto overscroll-x-contain border border-[var(--border-primary)] rounded-xl">
              <table
                className="w-full min-w-full table-auto text-left text-sm"
                style={{ minWidth: `${submissionsTableMinWidthPercent}%` }}
              >
                <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]">
                  <tr>
                    <th className="px-4 py-3 font-bold text-[var(--text-secondary)] whitespace-nowrap">
                      Student
                    </th>
                    <th className="px-4 py-3 font-bold text-[var(--text-secondary)] whitespace-nowrap">
                      Total Score
                    </th>
                    {submissionProblems.map((problem) => (
                      <th
                        key={problem.id}
                        className="px-4 py-3 font-bold text-[var(--text-secondary)] whitespace-nowrap"
                        title={problem.title}
                      >
                        {problem.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-primary)]">
                  {submissionStudents.map((student) => (
                    <tr key={student.id} className="align-top">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[var(--text-primary)]">
                          {student.fullName}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {student.email}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-semibold text-[var(--text-primary)]">
                          {studentTotalScoreLookup.get(student.id) ??
                            "No score"}
                        </span>
                      </td>
                      {submissionProblems.map((problem) => {
                        const summary = submissionSummaryLookup.get(
                          `${student.id}:${problem.id}`,
                        );

                        return (
                          <td
                            key={`${student.id}:${problem.id}`}
                            className="px-4 py-3"
                          >
                            {renderSubmissionCell(summary)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 animate-fade-in"
            onClick={() => setShowAssignModal(false)}
          />
          <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl border-2 border-[var(--border-primary)] animate-slide-up p-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">
              Assign to Classroom
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Select classrooms to assign this to.
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2 mb-6 pr-2">
              {loadingClassrooms ? (
                <div className="text-center py-4 text-sm text-[var(--text-muted)]">
                  Loading classrooms...
                </div>
              ) : classrooms.length === 0 ? (
                <div className="text-center py-4 text-sm text-[var(--text-muted)]">
                  No classrooms found.
                </div>
              ) : (
                classrooms.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-primary)] hover:bg-[var(--bg-secondary)] cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedClassrooms.includes(c.id)}
                      onChange={() => toggleClassroom(c.id)}
                      className="w-5 h-5 rounded border-gray-300 text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-sm text-[var(--text-primary)]">
                        {c.name}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {c.classroom_students?.[0]?.count || 0} students
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssign}
                loading={isAssigning}
                disabled={selectedClassrooms.length === 0}
              >
                Assign
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
