/**
 * POST /api/dsl/validate
 *
 * Validates a raw TemplateDSL JSON object.
 *
 * Request body: { template: unknown }
 * Response:
 *   200  { valid: true, template: TemplateDSL, hash: string }
 *   400  { valid: false, error: string, kind: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { validateTemplate, hashTemplate, DslError } from "@/lib/dsl";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    if (!body.template) {
      return NextResponse.json(
        { error: "Request body must contain a 'template' field" },
        { status: 400 }
      );
    }

    const template = validateTemplate(body.template);
    const hash = hashTemplate(template);

    return NextResponse.json({ valid: true, template, hash }, { status: 200 });
  } catch (err) {
    const isDslError = err instanceof DslError;
    return NextResponse.json(
      {
        valid: false,
        error: err instanceof Error ? err.message : String(err),
        kind: isDslError ? (err as DslError).kind : "unknown",
      },
      { status: 400 }
    );
  }
}
