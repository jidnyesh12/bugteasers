import { createServer } from "node:http";

const PORT = Number(process.env.FAKE_GEMINI_PORT ?? 8790);

const includes = [
  "#include <iostream>",
  "#include <vector>",
  "#include <algorithm>",
];

const buggySolution = [
  ...includes,
  "int main() {",
  "  std::ios::sync_with_stdio(false);",
  "  std::cin.tie(nullptr);",
  "  int n;",
  "  std::cin >> n;",
  "  long long best = 0, current = 0;",
  "  for (int i = 0; i < n; i++) {",
  "    long long x;",
  "    std::cin >> x;",
  "    current = std::max(0LL, current + x);",
  "    best = std::max(best, current);",
  "  }",
  "  std::cout << best << std::endl;",
  "}",
].join("\n");

const correctSolution = [
  ...includes,
  "int main() {",
  "  std::ios::sync_with_stdio(false);",
  "  std::cin.tie(nullptr);",
  "  int n;",
  "  std::cin >> n;",
  "  long long x;",
  "  std::cin >> x;",
  "  long long best = x, current = x;",
  "  for (int i = 1; i < n; i++) {",
  "    std::cin >> x;",
  "    current = std::max(x, current + x);",
  "    best = std::max(best, current);",
  "  }",
  "  std::cout << best << std::endl;",
  "}",
].join("\n");

const layout = [
  { type: "line", values: [{ ref: "n" }] },
  { type: "line", values: [{ ref: "arr" }] },
];

function constCase(values, expected) {
  return {
    input_data: "",
    input_template: {
      version: 1,
      variables: {
        n: { type: "const", value: values.length },
        arr: { type: "const", value: values },
      },
      output: layout,
    },
    expected_output: expected,
    is_sample: true,
    points: 1,
  };
}

function hiddenCase(nMin, nMax, valueMin, valueMax, points) {
  return {
    input_data: "",
    input_template: {
      version: 1,
      variables: {
        n: { type: "int", min: nMin, max: nMax },
        arr: { type: "int_array", length: { ref: "n" }, min: valueMin, max: valueMax },
      },
      output: layout,
    },
    expected_output: "__AUTO_EXPECTED_OUTPUT__",
    is_sample: false,
    points,
  };
}

function draft() {
  return {
    problems: [
      {
        title: "Maximum Subarray Sum",
        description:
          "Given an array of $n$ integers, find the largest sum of a non-empty contiguous subarray.\n\n**Input**\n\nThe first line contains $n$. The second line contains $n$ integers.\n\n**Output**\n\nPrint the maximum subarray sum.",
        difficulty: "medium",
        tags: ["arrays", "dynamic-programming"],
        constraints: "$1 \\le n \\le 10^5$, $-10^9 \\le a_i \\le 10^9$",
        examples: [
          { input: "8\n-2 -3 4 -1 -2 1 5 -3", output: "7", explanation: "The subarray $[4, -1, -2, 1, 5]$ sums to $7$." },
          { input: "3\n-5 -2 -8", output: "-2", explanation: "Every element is negative, so the best subarray is $[-2]$." },
        ],
        hints: [
          "Think about the best subarray that ends at each position.",
          "Either extend the previous subarray or start fresh at the current element.",
        ],
        time_limit: 2000,
        memory_limit: 256,
        solution_code: buggySolution,
        test_cases: [
          constCase([-2, -3, 4, -1, -2, 1, 5, -3], "7"),
          constCase([-5, -2, -8], "-2"),
          hiddenCase(1, 20, -50, 50, 1),
          hiddenCase(1, 2000, -1000, 1000, 2),
          hiddenCase(1, 1000, -1000000, -1, 2),
          hiddenCase(90000, 100000, -1000000000, 1000000000, 3),
        ],
      },
    ],
  };
}

function reply(prompt) {
  if (prompt.includes("ORACLE REPAIR") || prompt.includes("SOLUTION REPAIR")) {
    return JSON.stringify({ solution_code: correctSolution });
  }
  if (prompt.includes("expert programming tutor")) {
    return "Look at what your program prints when every number in the array is negative. Which single element should the answer be in that case, and does your running total ever allow it?";
  }
  return JSON.stringify(draft());
}

const server = createServer((request, response) => {
  if (request.method !== "POST" || !request.url?.includes(":generateContent")) {
    response.writeHead(404).end();
    return;
  }

  let body = "";
  request.on("data", (chunk) => (body += chunk));
  request.on("end", () => {
    const payload = JSON.parse(body || "{}");
    const prompt = (payload.contents ?? [])
      .flatMap((content) => content.parts ?? [])
      .map((part) => part.text ?? "")
      .join("\n");
    const text = reply(prompt);
    console.log(`[fake-gemini] ${request.url} -> ${text.slice(0, 60)}`);
    response.writeHead(200, { "content-type": "application/json" });
    response.end(
      JSON.stringify({
        candidates: [
          { content: { role: "model", parts: [{ text }] }, finishReason: "STOP", index: 0 },
        ],
      }),
    );
  });
});

server.listen(PORT, () => {
  console.log(`[fake-gemini] listening on http://localhost:${PORT}`);
});
