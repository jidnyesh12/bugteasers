// Database operations for hint usage tracking

import { supabase } from "@/lib/supabase/client";
import type { HintUsage } from "./hint-types";
import { calculateResetTimestamp, HINT_CONFIG } from "./hint-config";

/**
 * Get hint usage for a student-problem-assignment combination
 */
export async function getHintUsage(
  studentId: string,
  problemId: string,
  assignmentId?: string,
): Promise<HintUsage | null> {
  const query = supabase
    .from("student_hint_usage")
    .select("*")
    .eq("student_id", studentId)
    .eq("problem_id", problemId);

  if (assignmentId) {
    query.eq("assignment_id", assignmentId);
  } else {
    query.is("assignment_id", null);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Error fetching hint usage:", error);
    throw new Error(`Failed to fetch hint usage: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    studentId: data.student_id,
    problemId: data.problem_id,
    assignmentId: data.assignment_id,
    hintsUsed: data.hints_used,
    lastHintAt: data.last_hint_at,
    resetAt: data.reset_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Create initial hint usage record
 */
export async function createHintUsage(
  studentId: string,
  problemId: string,
  assignmentId?: string,
): Promise<HintUsage> {
  const { data, error } = await supabase
    .from("student_hint_usage")
    .insert({
      student_id: studentId,
      problem_id: problemId,
      assignment_id: assignmentId || null,
      hints_used: 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating hint usage:", error);
    throw new Error(`Failed to create hint usage: ${error.message}`);
  }

  return {
    id: data.id,
    studentId: data.student_id,
    problemId: data.problem_id,
    assignmentId: data.assignment_id,
    hintsUsed: data.hints_used,
    lastHintAt: data.last_hint_at,
    resetAt: data.reset_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Get or create hint usage record
 */
export async function getOrCreateHintUsage(
  studentId: string,
  problemId: string,
  assignmentId?: string,
): Promise<HintUsage> {
  const existing = await getHintUsage(studentId, problemId, assignmentId);

  if (existing) {
    return existing;
  }

  return await createHintUsage(studentId, problemId, assignmentId);
}

/**
 * Increment hint usage counter
 */
export async function incrementHintUsage(
  studentId: string,
  problemId: string,
  assignmentId?: string,
): Promise<HintUsage> {
  const usage = await getOrCreateHintUsage(studentId, problemId, assignmentId);

  const newHintsUsed = usage.hintsUsed + 1;
  const now = new Date().toISOString();

  // If this is the 3rd hint (initial limit reached), set reset timestamp
  let resetAt = usage.resetAt;
  if (newHintsUsed === HINT_CONFIG.initialHints && !resetAt) {
    resetAt = calculateResetTimestamp().toISOString();
  }

  const { data, error } = await supabase
    .from("student_hint_usage")
    .update({
      hints_used: newHintsUsed,
      last_hint_at: now,
      reset_at: resetAt,
    })
    .eq("id", usage.id)
    .select()
    .single();

  if (error) {
    console.error("Error incrementing hint usage:", error);
    throw new Error(`Failed to increment hint usage: ${error.message}`);
  }

  return {
    id: data.id,
    studentId: data.student_id,
    problemId: data.problem_id,
    assignmentId: data.assignment_id,
    hintsUsed: data.hints_used,
    lastHintAt: data.last_hint_at,
    resetAt: data.reset_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Reset hint usage (after 24 hours)
 */
export async function resetHintUsage(
  studentId: string,
  problemId: string,
  assignmentId?: string,
): Promise<HintUsage> {
  const usage = await getOrCreateHintUsage(studentId, problemId, assignmentId);

  // Reset to initial hints count (3)
  // But keep track that we've reset (for lifetime limit)
  const { data, error } = await supabase
    .from("student_hint_usage")
    .update({
      hints_used: HINT_CONFIG.initialHints, // Start from 3 (already used initial 3)
      reset_at: null, // Clear reset timestamp
    })
    .eq("id", usage.id)
    .select()
    .single();

  if (error) {
    console.error("Error resetting hint usage:", error);
    throw new Error(`Failed to reset hint usage: ${error.message}`);
  }

  return {
    id: data.id,
    studentId: data.student_id,
    problemId: data.problem_id,
    assignmentId: data.assignment_id,
    hintsUsed: data.hints_used,
    lastHintAt: data.last_hint_at,
    resetAt: data.reset_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Check if student has reached hint limit
 */
export async function hasReachedHintLimit(
  studentId: string,
  problemId: string,
  assignmentId?: string,
): Promise<{
  hasReached: boolean;
  hintsUsed: number;
  hintsRemaining: number;
  canReset: boolean;
  resetAt?: string;
}> {
  const usage = await getOrCreateHintUsage(studentId, problemId, assignmentId);

  const hasReset = usage.hintsUsed >= HINT_CONFIG.initialHints;
  const maxHints = hasReset
    ? HINT_CONFIG.lifetimeMaxHints
    : HINT_CONFIG.initialHints;

  const hasReached = usage.hintsUsed >= maxHints;
  const hintsRemaining = Math.max(0, maxHints - usage.hintsUsed);

  // Can reset if:
  // 1. Used all initial hints (3)
  // 2. Haven't reached lifetime limit (5)
  // 3. Reset timestamp is set and has passed
  const canReset =
    usage.hintsUsed >= HINT_CONFIG.initialHints &&
    usage.hintsUsed < HINT_CONFIG.lifetimeMaxHints &&
    usage.resetAt !== null &&
    usage.resetAt !== undefined &&
    new Date() >= new Date(usage.resetAt);

  return {
    hasReached,
    hintsUsed: usage.hintsUsed,
    hintsRemaining,
    canReset,
    resetAt: usage.resetAt || undefined,
  };
}
