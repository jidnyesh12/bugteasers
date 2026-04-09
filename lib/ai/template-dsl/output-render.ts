import { TemplateDslError } from "./errors";
import { isScalar, isScalarVector } from "./guards";
import type {
  TemplateGeneratedValue,
  TemplateOutputValue,
  TestCaseTemplateOutputInstruction,
} from "./types";

export function renderOutputValue(
  value: TemplateOutputValue,
  context: Readonly<Record<string, TemplateGeneratedValue>>,
): string {
  if ("literal" in value) {
    return String(value.literal);
  }

  const resolvedValue = context[value.ref];
  if (resolvedValue === undefined) {
    throw new TemplateDslError(
      `Output references unknown variable "${value.ref}"`,
    );
  }

  if (typeof resolvedValue === "string" || typeof resolvedValue === "number") {
    return String(resolvedValue);
  }

  if (isScalarVector(resolvedValue)) {
    return resolvedValue.map((entry) => String(entry)).join(value.join ?? " ");
  }

  throw new TemplateDslError(
    `Output ref "${value.ref}" resolves to a matrix. Use an output instruction of type "lines" instead.`,
  );
}

export function renderLinesInstruction(
  instruction: Extract<TestCaseTemplateOutputInstruction, { type: "lines" }>,
  context: Readonly<Record<string, TemplateGeneratedValue>>,
): string[] {
  const resolved = context[instruction.from];
  if (!Array.isArray(resolved)) {
    throw new TemplateDslError(
      `lines.from="${instruction.from}" must resolve to an array`,
    );
  }

  const separator = instruction.separator ?? " ";
  const lines: string[] = [];

  for (const item of resolved) {
    if (typeof item === "string" || typeof item === "number") {
      lines.push(String(item));
      continue;
    }

    if (Array.isArray(item)) {
      if (!item.every((entry) => isScalar(entry))) {
        throw new TemplateDslError(
          `lines.from="${instruction.from}" produced nested non-scalar rows`,
        );
      }

      lines.push(item.map((entry) => String(entry)).join(separator));
      continue;
    }

    throw new TemplateDslError(
      `lines.from="${instruction.from}" must produce scalar or scalar-array values`,
    );
  }

  return lines;
}
