export interface TestCase {
  id: string;
  input_data: string;
  expected_output: string;
  is_sample: boolean;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  hints: string[];
  test_cases: TestCase[];
  constraints: string;
  time_limit: number;
  memory_limit: number;
  examples?: {
    input: string;
    output: string;
    explanation?: string;
  }[];
}
