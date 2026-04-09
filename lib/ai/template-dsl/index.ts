export {
  AUTO_EXPECTED_OUTPUT_TOKEN,
  TEMPLATE_DSL_VERSION,
  type CharsetName,
  type MaterializeTemplateOptions,
  type MaterializedTemplateInput,
  type NumericRange,
  type SortDirection,
  type TemplateGeneratedValue,
  type TemplateMatrix,
  type TemplateNumericRef,
  type TemplateOutputValue,
  type TemplateRef,
  type TemplateScalar,
  type TemplateVector,
  type TestCaseInputTemplate,
  type TestCaseTemplateOutputInstruction,
  type TestCaseTemplateVariable,
} from "./types";
export { TemplateDslError } from "./errors";
export {
  buildTemplateStoragePlaceholder,
  hasUnresolvedPlaceholder,
  isAutoExpectedOutput,
} from "./placeholders";
export { validateTestCaseInputTemplate } from "./validation";
export { materializeTestCaseInputTemplate } from "./materialization";
export { hashTemplateSpec } from "./hashing";
