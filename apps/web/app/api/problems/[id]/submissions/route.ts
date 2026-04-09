import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase/client";
import { assertExecutionAccess } from "@/lib/execution/access";
import { ExecutionAuthorizationError } from "@/lib/execution/errors";
import { mapExecutionErrorToHttp } from "@/lib/execution/error-mapping";
import { createExecutionLogger } from "@/lib/execution/logging";
import { listProblemSubmissions } from "@/lib/submissions/service";

const logger = createExecutionLogger();
const MAX_SUBMISSIONS = 50;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: problemId } = await params;
    const assignmentId =
      request.nextUrl.searchParams.get("assignmentId") || undefined;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new ExecutionAuthorizationError("Unauthorized");
    }

    await assertExecutionAccess({
      supabase,
      problemId,
      userId: session.user.id,
      userRole: session.user.role,
      assignmentId,
    });

    const submissions = await listProblemSubmissions({
      supabase,
      problemId,
      studentId: session.user.id,
      assignmentId,
      limit: MAX_SUBMISSIONS,
    });

    return NextResponse.json({ submissions }, { status: 200 });
  } catch (error) {
    logger.logExecutionFailed({ mode: "submit" }, error);
    const mapped = mapExecutionErrorToHttp(error);
    return NextResponse.json(
      { error: mapped.message },
      { status: mapped.status },
    );
  }
}
