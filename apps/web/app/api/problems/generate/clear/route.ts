import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { clearUserStuckJobs } from "@/lib/ai/generation-jobs";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "instructor" && session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Only instructors can modify jobs" },
        { status: 403 },
      );
    }

    await clearUserStuckJobs(session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing stuck jobs:", error);
    return NextResponse.json(
      { error: "Failed to clear stuck jobs. Please try again." },
      { status: 500 },
    );
  }
}
