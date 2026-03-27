import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase/client';
import { createExecutionService } from '@/lib/execution';
import { PistonClientImpl } from '@/lib/execution/client';
import { TestCaseEvaluatorImpl } from '@/lib/execution/evaluator';
import { ExecutionAuthorizationError } from '@/lib/execution/errors';
import { mapExecutionErrorToHttp } from '@/lib/execution/error-mapping';
import { createExecutionLogger } from '@/lib/execution/logging';
import { checkExecutionRateLimit } from '@/lib/execution/rate-limiter';
import { assertExecutionAccess } from '@/lib/execution/access';
import { parseJsonBody, validateSubmitPayload } from '@/lib/execution/request-validation';

const logger = createExecutionLogger();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: problemId } = await params;

    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new ExecutionAuthorizationError('Unauthorized');
    }

    const rateLimit = checkExecutionRateLimit({
      userId: session.user.id,
      mode: 'submit',
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too Many Requests' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    const payload = validateSubmitPayload(await parseJsonBody(request));

    await assertExecutionAccess({
      supabase,
      problemId,
      userId: session.user.id,
      userRole: session.user.role,
      assignmentId: payload.assignmentId,
    });

    // Create execution service
    const pistonClient = new PistonClientImpl();
    const evaluator = new TestCaseEvaluatorImpl();
    const executionService = createExecutionService({
      pistonClient,
      evaluator,
      supabase,
    });

    // Execute code in Submit mode
    const result = await executionService.submitCode(
      {
        code: payload.code,
        language: payload.language,
        problemId,
        assignmentId: payload.assignmentId,
      },
      session.user.id
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    logger.logExecutionFailed({ mode: 'submit' }, error);
    const mapped = mapExecutionErrorToHttp(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
