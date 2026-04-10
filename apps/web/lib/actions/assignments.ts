"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSupabase } from "@/lib/supabase/client";
import { publishMessage } from "@bugteasers/mq-core";

interface CloseAssignmentResult {
  success: boolean;
  error?: string;
}

export async function closeAssignmentAndAnalyze(
  assignmentId: string,
): Promise<CloseAssignmentResult> {
  console.log("[closeAssignmentAndAnalyze] Starting for assignmentId:", assignmentId);
  
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    console.log("[closeAssignmentAndAnalyze] Session user:", session?.user?.id, "role:", session?.user?.role);

    if (!session?.user) {
      console.log("[closeAssignmentAndAnalyze] ❌ Unauthorized - no session");
      return { success: false, error: "Unauthorized" };
    }

    // Only instructors can close assignments
    if (session.user.role !== "instructor") {
      console.log("[closeAssignmentAndAnalyze] ❌ Access denied - user is not instructor");
      return { success: false, error: "Only instructors can close assignments" };
    }

    const supabase = getSupabase();

    // Verify the assignment exists and belongs to the instructor
    console.log("[closeAssignmentAndAnalyze] Fetching assignment from database...");
    const { data: existingAssignment, error: fetchError } = await supabase
      .from("assignments")
      .select("id, created_by, closed_at")
      .eq("id", assignmentId)
      .single();

    if (fetchError || !existingAssignment) {
      console.error("[closeAssignmentAndAnalyze] ❌ Assignment not found:", fetchError);
      return { success: false, error: "Assignment not found" };
    }

    console.log("[closeAssignmentAndAnalyze] Assignment found:", {
      id: existingAssignment.id,
      created_by: existingAssignment.created_by,
      closed_at: existingAssignment.closed_at,
    });

    // Verify ownership
    if (existingAssignment.created_by !== session.user.id) {
      console.log("[closeAssignmentAndAnalyze] ❌ Access denied - not owner");
      return { success: false, error: "Access denied" };
    }

    // Check if already closed
    if (existingAssignment.closed_at) {
      console.log("[closeAssignmentAndAnalyze] ❌ Assignment already closed at:", existingAssignment.closed_at);
      return { success: false, error: "Assignment is already closed" };
    }

    // Update the assignment's closed_at timestamp
    console.log("[closeAssignmentAndAnalyze] Updating closed_at in database...");
    const closedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("assignments")
      .update({ closed_at: closedAt })
      .eq("id", assignmentId);

    if (updateError) {
      console.error("[closeAssignmentAndAnalyze] ❌ Failed to update database:", updateError);
      return { success: false, error: "Failed to close assignment" };
    }

    console.log("[closeAssignmentAndAnalyze] ✅ Assignment closed successfully at:", closedAt);

    // Publish message to trigger analysis
    console.log("[closeAssignmentAndAnalyze] Publishing message to test_queue...");
    try {
      const payload = {
        action: "START_ANALYSIS",
        assignmentId,
      };
      console.log("[closeAssignmentAndAnalyze] Message payload:", payload);
      
      await publishMessage("test_queue", payload);
      
      console.log("[closeAssignmentAndAnalyze] ✅ Message published successfully to test_queue");
    } catch (mqError) {
      console.error("[closeAssignmentAndAnalyze] ⚠️ Failed to publish analysis message:", mqError);
      // Assignment is already closed, so we don't fail the entire operation
      // Just log the error
    }

    console.log("[closeAssignmentAndAnalyze] ✅ Operation completed successfully");
    return { success: true };
  } catch (error) {
    console.error("[closeAssignmentAndAnalyze] ❌ Unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}