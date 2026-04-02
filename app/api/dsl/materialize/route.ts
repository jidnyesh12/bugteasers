/**
 * POST /api/dsl/materialize
 *
 * Validates and materialises a TemplateDSL template into concrete test-case
 * inputs (no oracle evaluation — structural inputs only).
 *
 * Request body: { template: unknown, base_seed?: number }
 * Response:
 *   200  { template_hash: string, cases: MaterializedTestCase[] }
 *   400  { error: string, kind: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { materializeTemplate, DslError } from "@/lib/dsl";

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

    const baseSeed = typeof body.base_seed === "number" ? body.base_seed : 42;
    const cases = materializeTemplate(body.template, baseSeed);

    return NextResponse.json(
      {
        template_hash: cases[0]?.template_hash ?? "",
        cases,
      },
      { status: 200 }
    );
  } catch (err) {
    const isDslError = err instanceof DslError;
    const status = isDslError ? 400 : 500;
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
        kind: isDslError ? (err as DslError).kind : "unknown",
      },
      { status }
    );
  }
}
