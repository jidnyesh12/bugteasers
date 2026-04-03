/**
 * Differential Tester: Multi-oracle consensus for ambiguous failures
 *
 * When test case output ≠ model answer output, run multiple implementations
 * to reach consensus on which is correct.
 *
 * Approach:
 * - Execute reference implementations (if available)
 * - Execute alternative model answer generations
 * - Vote on correct output (majority wins)
 * - Score confidence based on voting strength
 */

import type { ModelAnswer } from './types';
import { executeAndCompare } from './executor';

/**
 * Consensus result from multiple oracle executions
 */
export interface OracleVote {
  implementation: string; // Name of implementation
  output: string;
  passed: boolean; // Did it pass test expectations?
  error?: string;
}

/**
 * Consensus decision from voting
 */
export interface ConsensusDecision {
  consensusOutput: string;
  votingWeights: Record<string, number>; // Implementation → confidence
  majorityWin: boolean;
  confidenceScore: number; // 0-1: how strong is the consensus?
  votingDetails: Array<{
    output: string;
    count: number;
    tiebreaker: boolean;
  }>;
  attribution: 'test_case_error' | 'model_answer_error' | 'unknown';
}

/**
 * Run multiple implementations and collect votes
 */
export async function runDifferentialOracle(
  testInput: string,
  expectedOutput: string,
  implementations: Array<{
    name: string;
    answer: ModelAnswer;
    weight?: number; // Default 1.0
  }>,
  config: {
    timeout: number;
    outputNormalization: boolean;
  } = { timeout: 5000, outputNormalization: true }
): Promise<OracleVote[]> {
  const votes: OracleVote[] = [];

  for (const impl of implementations) {
    try {
      // Execute model answer and capture output
      const result = await executeAndCompare(impl.answer, testInput, expectedOutput);

      const actualOutput = config.outputNormalization ? normalizeOutput(result.actual || '') : result.actual || '';
      const expectedNorm = config.outputNormalization ? normalizeOutput(expectedOutput) : expectedOutput;

      votes.push({
        implementation: impl.name,
        output: result.actual || '',
        passed: actualOutput === expectedNorm,
        error: result.executionStatus.status === 'error' ? result.executionStatus.stderr : undefined,
      });
    } catch (error) {
      votes.push({
        implementation: impl.name,
        output: '',
        passed: false,
        error: error instanceof Error ? error.message : 'Execution failed',
      });
    }
  }

  return votes;
}

/**
 * Normalize output for comparison
 */
export function normalizeOutput(output: string): string {
  return output
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

/**
 * Reach consensus from votes
 */
export function reachConsensus(
  votes: OracleVote[],
  expectedOutput: string,
  implementations: Array<{ name: string; weight?: number }>
): ConsensusDecision {
  // Build vote counts by output
  const outputVotes: Record<string, Array<{ impl: string; weight: number }>> = {};

  votes.forEach((vote) => {
    const impl = implementations.find((i) => i.name === vote.implementation);
    const weight = impl?.weight ?? 1.0;

    if (!outputVotes[vote.output]) {
      outputVotes[vote.output] = [];
    }
    outputVotes[vote.output].push({ impl: vote.implementation, weight });
  });

  // Find winning output
  let maxVotes = 0;
  let consensusOutput = '';
  const voteCounts: Array<{ output: string; count: number }> = [];

  for (const [output, votersArray] of Object.entries(outputVotes)) {
    const totalWeight = votersArray.reduce((sum, v) => sum + v.weight, 0);
    voteCounts.push({ output, count: totalWeight });

    if (totalWeight > maxVotes) {
      maxVotes = totalWeight;
      consensusOutput = output;
    }
  }

  // Calculate confidence score
  // Strong consensus = high confidence, close vote = low confidence
  const totalWeight = votes.reduce((sum) => sum + 1, 0); // Simplified
  const majorityPercentage = maxVotes / Math.max(1, totalWeight);
  const confidenceScore = majorityPercentage >= 0.5 ? majorityPercentage : 1 - majorityPercentage;

  // Determine if test case or model answer is wrong
  const normalizedConsensus = normalizeOutput(consensusOutput);
  const normalizedExpected = normalizeOutput(expectedOutput);

  let attribution: 'test_case_error' | 'model_answer_error' | 'unknown' = 'unknown';

  if (normalizedConsensus === normalizedExpected) {
    // Consensus matches expected → model answer was wrong
    attribution = 'model_answer_error';
  } else {
    // Consensus doesn't match expected → test case was wrong
    attribution = 'test_case_error';
  }

  return {
    consensusOutput,
    votingWeights: {},
    majorityWin: majorityPercentage >= 0.5,
    confidenceScore,
    votingDetails: voteCounts.map((vc, i) => ({ ...vc, tiebreaker: i > 0 && voteCounts[0].count === vc.count })),
    attribution,
  };
}

/**
 * Matrix: Test case error vs model answer error detection
 *
 * Helps determine root cause from differential testing results
 */
export function analyzeFailureMode(
  expectedOutput: string,
  actualOutput: string,
  consensusOutput: string
): {
  likelyError: 'test_case' | 'model_answer' | 'both' | 'unknown';
  confidence: number;
  reasoning: string[];
} {
  const reasons: string[] = [];

  const actualNorm = normalizeOutput(actualOutput);
  const expectedNorm = normalizeOutput(expectedOutput);
  const consensusNorm = normalizeOutput(consensusOutput);

  // If consensus matches expected
  if (consensusNorm === expectedNorm) {
    reasons.push('Consensus matches expected output');
    reasons.push('Model answer produces different output than consensus');
    return {
      likelyError: 'model_answer',
      confidence: 0.85,
      reasoning: reasons,
    };
  }

  // If consensus differs from expected
  if (consensusNorm !== expectedNorm) {
    reasons.push('Consensus differs from expected output');
    reasons.push('Multiple implementations agree on different output');

    // If actual matches consensus, then test case is wrong
    if (actualNorm === consensusNorm) {
      reasons.push('Model answer output matches consensus');
      return {
        likelyError: 'test_case',
        confidence: 0.8,
        reasoning: reasons,
      };
    }

    // If actual differs from both, both may be wrong
    reasons.push('Model answer differs from both expected and consensus');
    return {
      likelyError: 'both',
      confidence: 0.6,
      reasoning: reasons,
    };
  }

  // Unclear
  return {
    likelyError: 'unknown',
    confidence: 0.3,
    reasoning: ['Unable to determine failure mode from consensus'],
  };
}

/**
 * Comprehensive differential testing pipeline
 */
export async function runFullDifferentialTest(
  testInput: string,
  expectedOutput: string,
  implementations: Array<{
    name: string;
    answer: ModelAnswer;
    weight?: number;
  }>,
  config?: {
    timeout: number;
    outputNormalization: boolean;
  }
): Promise<{
  votes: OracleVote[];
  consensus: ConsensusDecision;
  analysis: ReturnType<typeof analyzeFailureMode>;
}> {
  // Get votes from all implementations
  const votes = await runDifferentialOracle(testInput, expectedOutput, implementations, config);

  // Reach consensus
  const consensus = reachConsensus(votes, expectedOutput, implementations);

  // Analyze failure mode
  const consensusOutput = votes.find((v) => v.output === consensus.consensusOutput)?.output || '';
  const actualOutput = votes[0]?.output || '';
  const analysis = analyzeFailureMode(expectedOutput, actualOutput, consensusOutput);

  return {
    votes,
    consensus,
    analysis,
  };
}

/**
 * Utility: Select representative implementations for consensus
 *
 * Chooses diverse implementations (different models, algorithms)
 */
export function selectDiverseImplementations(
  allAnswers: ModelAnswer[],
  count: number = 3
): Array<{ name: string; answer: ModelAnswer; weight: number }> {
  // STUB: Would use metadata to select diverse implementations
  // For now, just return first N

  return allAnswers.slice(0, count).map((ans, i) => ({
    name: `implementation_${i}`,
    answer: ans,
    weight: 1.0,
  }));
}

/**
 * Confidence scoring from consensus results
 */
export function scoreConsensusConfidence(
  consensus: ConsensusDecision,
  voteCounts: { passed: number; failed: number }
): number {
  // Strong consensus = high confidence
  const consensusStrength = consensus.confidenceScore;

  // High pass rate = high confidence
  const passRate = voteCounts.passed / Math.max(1, voteCounts.passed + voteCounts.failed);

  // Combine scores
  return (consensusStrength + passRate) / 2;
}
