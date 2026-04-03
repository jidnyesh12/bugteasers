/**
 * Batch Generation Utilities
 *
 * Extracted orchestration concerns:
 * - Batch statistics calculation
 * - Progress tracking
 * - Aggregate metrics over multiple results
 */

import type { GenerationResult } from './generation-orchestrator';

/**
 * Orchestration progress tracking
 */
export interface OrchestrationProgress {
  totalPairs: number;
  completedPairs: number;
  successfulPairs: number;
  failedPairs: number;
  escalatedPairs: number;
  averageDurationMs: number;
  errorRate: number;
}

/**
 * Calculate aggregate batch statistics from generation results
 */
export function calculateBatchStatistics(results: GenerationResult[]): OrchestrationProgress {
  const totalPairs = results.length;
  const completedPairs = results.filter((r) => r.stats.finalStatus !== 'failed').length;
  const successfulPairs = results.filter((r) => r.success).length;
  const failedPairs = results.filter((r) => r.stats.finalStatus === 'failed').length;
  const escalatedPairs = results.filter((r) => r.stats.finalStatus === 'escalated').length;

  const totalDuration = results.reduce((sum, r) => sum + (r.stats.durationMs || 0), 0);
  const averageDurationMs = totalPairs > 0 ? totalDuration / totalPairs : 0;
  const errorRate = totalPairs > 0 ? failedPairs / totalPairs : 0;

  return {
    totalPairs,
    completedPairs,
    successfulPairs,
    failedPairs,
    escalatedPairs,
    averageDurationMs,
    errorRate,
  };
}
