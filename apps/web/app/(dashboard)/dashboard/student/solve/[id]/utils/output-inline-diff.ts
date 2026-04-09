export interface OutputInlineDiffPart {
  value: string;
  kind: "common" | "added" | "removed";
}

export function buildInlineOutputDiff(
  expected: string,
  actual: string,
): OutputInlineDiffPart[] {
  const left = (expected || "").replace(/\r\n/g, "\n");
  const right = (actual || "").replace(/\r\n/g, "\n");

  const leftLength = left.length;
  const rightLength = right.length;

  if (leftLength === 0 && rightLength === 0) {
    return [];
  }

  // LCS table keeps inline diffs stable and avoids bringing extra runtime deps.
  const lcs = Array.from({ length: leftLength + 1 }, () =>
    Array<number>(rightLength + 1).fill(0),
  );

  for (let i = leftLength - 1; i >= 0; i -= 1) {
    for (let j = rightLength - 1; j >= 0; j -= 1) {
      lcs[i][j] =
        left[i] === right[j]
          ? lcs[i + 1][j + 1] + 1
          : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const parts: OutputInlineDiffPart[] = [];
  const pushPart = (kind: OutputInlineDiffPart["kind"], value: string) => {
    if (!value) {
      return;
    }

    const previous = parts[parts.length - 1];
    if (previous && previous.kind === kind) {
      previous.value += value;
      return;
    }

    parts.push({ kind, value });
  };

  let i = 0;
  let j = 0;

  while (i < leftLength && j < rightLength) {
    if (left[i] === right[j]) {
      pushPart("common", left[i]);
      i += 1;
      j += 1;
      continue;
    }

    if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      pushPart("removed", left[i]);
      i += 1;
      continue;
    }

    pushPart("added", right[j]);
    j += 1;
  }

  while (i < leftLength) {
    pushPart("removed", left[i]);
    i += 1;
  }

  while (j < rightLength) {
    pushPart("added", right[j]);
    j += 1;
  }

  return parts;
}
