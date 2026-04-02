/**
 * Template DSL — Public Exports
 */

export * from "./types";
export * from "./errors";
export { validateTemplate } from "./validator";
export { hashTemplate } from "./hash";
export { materializeOne, materializeAll } from "./materializer";
export { normaliseOutput, runOracle, runOracleBatch } from "./oracle";
export type { OracleInvoker } from "./oracle";
export { repairTemplate, MAX_REPAIR_ATTEMPTS } from "./repair";
export {
  runPipeline,
  materializeTemplate,
  materializeSingleCase,
} from "./pipeline";
export type { PipelineOptions } from "./pipeline";
