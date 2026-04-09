export const TEMPLATE_DSL_VERSION = 1;
export const AUTO_EXPECTED_OUTPUT_TOKEN = "__AUTO_EXPECTED_OUTPUT__";

export const DEFAULT_MAX_OUTPUT_BYTES = 8 * 1024 * 1024;
export const MAX_COLLECTION_SIZE = 200_000;

export type TemplateScalar = string | number;
export type TemplateVector = TemplateScalar[];
export type TemplateMatrix = TemplateScalar[][];
export type TemplateGeneratedValue =
  | TemplateScalar
  | TemplateVector
  | TemplateMatrix;

export interface TemplateRef {
  ref: string;
}

export type TemplateNumericRef = number | TemplateRef;

export type SortDirection = "asc" | "desc";
export type CharsetName = "lower" | "upper" | "alpha" | "alnum" | "digits";

export interface NumericRange {
  min: TemplateNumericRef;
  max: TemplateNumericRef;
}

export type TestCaseTemplateVariable =
  | {
      type: "const";
      value: TemplateGeneratedValue;
    }
  | {
      type: "int";
      min: TemplateNumericRef;
      max: TemplateNumericRef;
    }
  | {
      type: "choice";
      values: TemplateScalar[];
      weights?: number[];
    }
  | {
      type: "string";
      length: TemplateNumericRef;
      alphabet?: string;
      charset?: CharsetName;
    }
  | {
      type: "int_array";
      length: TemplateNumericRef;
      min: TemplateNumericRef;
      max: TemplateNumericRef;
      unique?: boolean;
      sorted?: SortDirection;
    }
  | {
      type: "matrix";
      rows: TemplateNumericRef;
      cols: TemplateNumericRef;
      min: TemplateNumericRef;
      max: TemplateNumericRef;
    }
  | {
      type: "permutation";
      n: TemplateNumericRef;
      start?: number;
    }
  | {
      type: "pairs";
      count: TemplateNumericRef;
      first: NumericRange;
      second: NumericRange;
      unique?: boolean;
    }
  | {
      type: "graph";
      nodes: TemplateNumericRef;
      edges: TemplateNumericRef;
      directed?: boolean;
      connected?: boolean;
      allowSelfLoops?: boolean;
      allowMultiEdges?: boolean;
      oneIndexed?: boolean;
      weighted?: boolean;
      minWeight?: TemplateNumericRef;
      maxWeight?: TemplateNumericRef;
    };

export type TemplateOutputValue =
  | {
      ref: string;
      join?: string;
    }
  | {
      literal: string | number;
    };

export type TestCaseTemplateOutputInstruction =
  | {
      type: "line";
      values: ReadonlyArray<TemplateOutputValue>;
      separator?: string;
    }
  | {
      type: "lines";
      from: string;
      separator?: string;
    }
  | {
      type: "raw";
      value: string;
    };

export interface TestCaseInputTemplate {
  version?: number;
  seed?: string;
  variables: Readonly<Record<string, TestCaseTemplateVariable>>;
  output: ReadonlyArray<TestCaseTemplateOutputInstruction>;
}

export interface MaterializeTemplateOptions {
  seedMaterial: string;
  maxOutputBytes?: number;
}

export interface MaterializedTemplateInput {
  inputData: string;
  resolvedSeed: string;
  variables: Record<string, TemplateGeneratedValue>;
}
