import { createHash } from 'node:crypto';
import { supabase } from '@/lib/supabase/client';
import { PistonClientImpl } from '@/lib/execution/client';
import { TestCaseEvaluatorImpl } from '@/lib/execution/evaluator';
import {
  dedupeSupportedLanguages,
  SUPPORTED_EXECUTION_LANGUAGES,
} from '@/lib/execution/languages';
import type { SupportedLanguage } from '@/lib/execution/types';
import { generateProblems } from './problem-generator';
import type {
  GeneratedProblem,
  ProblemGenerationJobStatus,
  ProblemGenerationRequest,
} from './types';

const JOB_SELECT_FIELDS = [
  'id',
  'created_by',
  'status',
  'request_payload',
  'result_payload',
  'progress_message',
  'error_message',
  'created_at',
  'updated_at',
  'completed_at',
].join(', ');

const TERMINAL_JOB_STATUSES: ReadonlySet<ProblemGenerationJobStatus> = new Set([
  'completed',
  'discarded',
  'error',
]);

interface ProblemGenerationJobRow {
  id: string;
  created_by: string;
  status: ProblemGenerationJobStatus;
  request_payload: ProblemGenerationRequest;
  result_payload: { problems?: GeneratedProblem[] } | null;
  progress_message: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface ValidationOutcome {
  ok: boolean;
  message?: string;
}

export interface ProblemGenerationJobSummary {
  jobId: string;
  status: ProblemGenerationJobStatus;
  progressMessage: string | null;
  errorMessage: string | null;
  problems: GeneratedProblem[] | null;
}

function isJobStatus(value: unknown): value is ProblemGenerationJobStatus {
  return (
    value === 'queued' ||
    value === 'ai_generating' ||
    value === 'validating' ||
    value === 'completed' ||
    value === 'discarded' ||
    value === 'error'
  );
}

function normalizeLanguages(rawLanguages: unknown): SupportedLanguage[] {
  if (!Array.isArray(rawLanguages)) {
    return [...SUPPORTED_EXECUTION_LANGUAGES];
  }

  const values = rawLanguages.filter(
    (value): value is string => typeof value === 'string'
  );

  const deduped = dedupeSupportedLanguages(values);
  return deduped.length > 0 ? deduped : [...SUPPORTED_EXECUTION_LANGUAGES];
}

function normalizeJobRequest(request: ProblemGenerationRequest): ProblemGenerationRequest {
  return {
    topic: request.topic.trim(),
    difficulty: request.difficulty,
    tags: Array.isArray(request.tags)
      ? request.tags
        .map((tag) => tag.trim())
        .filter(Boolean)
      : [],
    constraints: request.constraints?.trim() || undefined,
    numProblems: Math.min(Math.max(request.numProblems ?? 1, 1), 5),
    languages: normalizeLanguages(request.languages),
  };
}

function mapJobRow(row: unknown): ProblemGenerationJobRow {
  if (!row || typeof row !== 'object') {
    throw new Error('Invalid job row received from database');
  }

  const raw = row as Record<string, unknown>;

  if (typeof raw.id !== 'string' || raw.id.length === 0) {
    throw new Error('Invalid generation job row: missing id');
  }

  if (typeof raw.created_by !== 'string' || raw.created_by.length === 0) {
    throw new Error('Invalid generation job row: missing created_by');
  }

  if (!isJobStatus(raw.status)) {
    throw new Error('Invalid generation job row: unsupported status');
  }

  const requestPayload = raw.request_payload;
  if (!requestPayload || typeof requestPayload !== 'object') {
    throw new Error('Invalid generation job row: request_payload missing');
  }

  const requestRecord = requestPayload as Record<string, unknown>;
  const topic = typeof requestRecord.topic === 'string' ? requestRecord.topic : '';
  const difficulty = requestRecord.difficulty;

  if (!topic || (difficulty !== 'easy' && difficulty !== 'medium' && difficulty !== 'hard')) {
    throw new Error('Invalid generation job row: malformed request payload');
  }

  return {
    id: raw.id,
    created_by: raw.created_by,
    status: raw.status,
    request_payload: {
      topic,
      difficulty,
      tags: Array.isArray(requestRecord.tags)
        ? requestRecord.tags.filter((tag): tag is string => typeof tag === 'string')
        : [],
      constraints:
        typeof requestRecord.constraints === 'string'
          ? requestRecord.constraints
          : undefined,
      numProblems:
        typeof requestRecord.numProblems === 'number'
          ? requestRecord.numProblems
          : undefined,
      languages: normalizeLanguages(requestRecord.languages),
    },
    result_payload:
      raw.result_payload && typeof raw.result_payload === 'object'
        ? (raw.result_payload as { problems?: GeneratedProblem[] })
        : null,
    progress_message: typeof raw.progress_message === 'string' ? raw.progress_message : null,
    error_message: typeof raw.error_message === 'string' ? raw.error_message : null,
    created_at: typeof raw.created_at === 'string' ? raw.created_at : new Date().toISOString(),
    updated_at: typeof raw.updated_at === 'string' ? raw.updated_at : new Date().toISOString(),
    completed_at: typeof raw.completed_at === 'string' ? raw.completed_at : null,
  };
}

function toSummary(job: ProblemGenerationJobRow): ProblemGenerationJobSummary {
  return {
    jobId: job.id,
    status: job.status,
    progressMessage: job.progress_message,
    errorMessage: job.error_message,
    problems: job.result_payload?.problems ?? null,
  };
}

async function fetchJobById(jobId: string): Promise<ProblemGenerationJobRow | null> {
  const { data, error } = await supabase
    .from('problem_generation_jobs')
    .select(JOB_SELECT_FIELDS)
    .eq('id', jobId)
    .single();

  if (error) {
    const errorCode = (error as { code?: string }).code;
    if (errorCode === 'PGRST116') {
      return null;
    }

    throw new Error(`Failed to fetch generation job: ${error.message}`);
  }

  return mapJobRow(data);
}

async function transitionJob(
  jobId: string,
  fromStatuses: readonly ProblemGenerationJobStatus[],
  updates: Record<string, unknown>
): Promise<ProblemGenerationJobRow | null> {
  const { data, error } = await supabase
    .from('problem_generation_jobs')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .in('status', [...fromStatuses])
    .select(JOB_SELECT_FIELDS)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to transition generation job: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapJobRow(data);
}

function buildGenerationSeed(request: ProblemGenerationRequest): string {
  const payload = JSON.stringify({
    topic: request.topic,
    difficulty: request.difficulty,
    tags: request.tags ?? [],
    constraints: request.constraints ?? '',
    numProblems: request.numProblems ?? 1,
    languages: request.languages ?? [...SUPPORTED_EXECUTION_LANGUAGES],
  });

  return createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

function annotateGeneratedProblems(
  problems: GeneratedProblem[],
  model: string,
  seed: string
): GeneratedProblem[] {
  const generatedAt = new Date().toISOString();

  return problems.map((problem) => ({
    ...problem,
    test_cases: problem.test_cases.map((testCase) => ({
      ...testCase,
      generated_at: generatedAt,
      generation_model: model,
      generation_seed: seed,
      is_generated: true,
      input_hash: createHash('sha256').update(testCase.input_data).digest('hex'),
    })),
  }));
}

async function detectReferenceLanguage(
  solutionCode: string,
  candidateLanguages: readonly SupportedLanguage[],
  pistonClient: PistonClientImpl
): Promise<{ language: SupportedLanguage } | { error: string }> {
  const compileErrors: string[] = [];

  for (const language of candidateLanguages) {
    try {
      const response = await pistonClient.execute({
        language: pistonClient.mapLanguage(language),
        version: '*',
        files: [{ content: solutionCode }],
        stdin: '',
        compile_timeout: 10_000,
        run_timeout: 500,
      });

      if (!response.compile || response.compile.code === 0) {
        return { language };
      }

      compileErrors.push(`${language}: ${response.compile.stderr || 'Compilation failed'}`);
    } catch (error) {
      compileErrors.push(
        `${language}: ${error instanceof Error ? error.message : 'Unknown compile failure'}`
      );
    }
  }

  return {
    error: `Model solution failed to compile in all candidate languages (${candidateLanguages.join(', ')}). ${compileErrors.join(' | ')}`,
  };
}

async function validateProblemsAgainstModel(
  problems: readonly GeneratedProblem[],
  languages: readonly SupportedLanguage[]
): Promise<ValidationOutcome> {
  const pistonClient = new PistonClientImpl();
  const evaluator = new TestCaseEvaluatorImpl();

  for (let problemIndex = 0; problemIndex < problems.length; problemIndex += 1) {
    const problem = problems[problemIndex];
    const referenceLanguage = await detectReferenceLanguage(
      problem.solution_code,
      languages,
      pistonClient
    );

    if ('error' in referenceLanguage) {
      return {
        ok: false,
        message: `Problem ${problemIndex + 1}: ${referenceLanguage.error}`,
      };
    }

    const runTimeout = Math.min(Math.max(problem.time_limit || 2000, 500), 10_000);
    const runMemoryLimit = Math.min(Math.max(problem.memory_limit || 256, 64), 1024) * 1024 * 1024;

    for (let testCaseIndex = 0; testCaseIndex < problem.test_cases.length; testCaseIndex += 1) {
      const testCase = problem.test_cases[testCaseIndex];

      try {
        const response = await pistonClient.execute({
          language: pistonClient.mapLanguage(referenceLanguage.language),
          version: '*',
          files: [{ content: problem.solution_code }],
          stdin: testCase.input_data,
          compile_timeout: 10_000,
          run_timeout: runTimeout,
          run_memory_limit: runMemoryLimit,
        });

        if (response.compile && response.compile.code !== 0) {
          return {
            ok: false,
            message: `Problem ${problemIndex + 1}, test case ${testCaseIndex + 1}: compile error - ${response.compile.stderr || 'Compilation failed'}`,
          };
        }

        if (response.run.code !== 0) {
          return {
            ok: false,
            message: `Problem ${problemIndex + 1}, test case ${testCaseIndex + 1}: runtime error - ${response.run.stderr || 'Runtime error'}`,
          };
        }

        const normalizedActual = evaluator.normalizeOutput(
          response.run.stdout || response.run.output || ''
        );
        const normalizedExpected = evaluator.normalizeOutput(testCase.expected_output);

        if (normalizedActual !== normalizedExpected) {
          return {
            ok: false,
            message:
              `Problem ${problemIndex + 1}, test case ${testCaseIndex + 1}: model solution output mismatch. ` +
              `Expected "${normalizedExpected}" but received "${normalizedActual}".`,
          };
        }
      } catch (error) {
        return {
          ok: false,
          message:
            `Problem ${problemIndex + 1}, test case ${testCaseIndex + 1}: execution failed - ` +
            `${error instanceof Error ? error.message : 'Unknown execution failure'}`,
        };
      }
    }
  }

  return { ok: true };
}

async function runAiGenerationStage(job: ProblemGenerationJobRow): Promise<ProblemGenerationJobRow> {
  try {
    const generationResult = await generateProblems(job.request_payload);
    const seed = buildGenerationSeed(job.request_payload);
    const problems = annotateGeneratedProblems(
      generationResult.problems,
      generationResult.metadata.model,
      seed
    );

    const transitioned = await transitionJob(job.id, ['ai_generating'], {
      status: 'validating',
      progress_message: 'Model code is ready. Now testing model answer on generated testcases.',
      result_payload: { problems },
      error_message: null,
    });

    if (!transitioned) {
      const latestJob = await fetchJobById(job.id);
      if (!latestJob) {
        throw new Error('Generation job disappeared during transition');
      }
      return latestJob;
    }

    return transitioned;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'AI generation failed due to an unknown error';

    const transitioned = await transitionJob(job.id, ['ai_generating'], {
      status: 'discarded',
      progress_message: 'Generation discarded before validation.',
      error_message: message,
      completed_at: new Date().toISOString(),
    });

    if (!transitioned) {
      const latestJob = await fetchJobById(job.id);
      if (!latestJob) {
        throw new Error('Generation job disappeared after failure transition');
      }
      return latestJob;
    }

    return transitioned;
  }
}

async function runValidationStage(job: ProblemGenerationJobRow): Promise<ProblemGenerationJobRow> {
  try {
    const problems = job.result_payload?.problems;
    if (!problems || !Array.isArray(problems) || problems.length === 0) {
      const transitioned = await transitionJob(job.id, ['validating'], {
        status: 'discarded',
        progress_message: 'Generation discarded: missing generated problems payload.',
        error_message: 'Validation could not start because generated problems were missing.',
        completed_at: new Date().toISOString(),
      });

      if (!transitioned) {
        const latestJob = await fetchJobById(job.id);
        if (!latestJob) {
          throw new Error('Generation job disappeared after missing payload transition');
        }
        return latestJob;
      }

      return transitioned;
    }

    const requestLanguages = normalizeLanguages(job.request_payload.languages);
    const validationResult = await validateProblemsAgainstModel(problems, requestLanguages);

    if (!validationResult.ok) {
      const transitioned = await transitionJob(job.id, ['validating'], {
        status: 'discarded',
        progress_message: 'Generation discarded: model solution failed generated testcase validation.',
        error_message: validationResult.message,
        completed_at: new Date().toISOString(),
      });

      if (!transitioned) {
        const latestJob = await fetchJobById(job.id);
        if (!latestJob) {
          throw new Error('Generation job disappeared after validation failure transition');
        }
        return latestJob;
      }

      return transitioned;
    }

    const transitioned = await transitionJob(job.id, ['validating'], {
      status: 'completed',
      progress_message: 'Validation complete. Problems are ready for preview.',
      error_message: null,
      completed_at: new Date().toISOString(),
    });

    if (!transitioned) {
      const latestJob = await fetchJobById(job.id);
      if (!latestJob) {
        throw new Error('Generation job disappeared after completion transition');
      }
      return latestJob;
    }

    return transitioned;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Validation failed due to an unknown error';

    const transitioned = await transitionJob(job.id, ['validating'], {
      status: 'discarded',
      progress_message: 'Generation discarded during validation due to an unexpected error.',
      error_message: message,
      completed_at: new Date().toISOString(),
    });

    if (!transitioned) {
      const latestJob = await fetchJobById(job.id);
      if (!latestJob) {
        throw new Error('Generation job disappeared after validation error transition');
      }
      return latestJob;
    }

    return transitioned;
  }
}

export async function enqueueProblemGenerationJob(params: {
  createdBy: string;
  request: ProblemGenerationRequest;
}): Promise<ProblemGenerationJobSummary> {
  const normalizedRequest = normalizeJobRequest(params.request);

  const { data, error } = await supabase
    .from('problem_generation_jobs')
    .insert({
      created_by: params.createdBy,
      status: 'queued',
      request_payload: normalizedRequest,
      progress_message: 'Generation job queued. Preparing model draft.',
      error_message: null,
      started_at: null,
      completed_at: null,
    })
    .select(JOB_SELECT_FIELDS)
    .single();

  if (error) {
    throw new Error(`Failed to enqueue problem generation job: ${error.message}`);
  }

  return toSummary(mapJobRow(data));
}

export async function getProblemGenerationJobForUser(
  jobId: string,
  userId: string
): Promise<ProblemGenerationJobSummary | null> {
  const { data, error } = await supabase
    .from('problem_generation_jobs')
    .select(JOB_SELECT_FIELDS)
    .eq('id', jobId)
    .eq('created_by', userId)
    .single();

  if (error) {
    const errorCode = (error as { code?: string }).code;
    if (errorCode === 'PGRST116') {
      return null;
    }

    throw new Error(`Failed to fetch generation job for user: ${error.message}`);
  }

  return toSummary(mapJobRow(data));
}

export async function progressProblemGenerationJob(jobId: string): Promise<ProblemGenerationJobSummary | null> {
  const job = await fetchJobById(jobId);
  if (!job) {
    return null;
  }

  if (TERMINAL_JOB_STATUSES.has(job.status)) {
    return toSummary(job);
  }

  if (job.status === 'queued') {
    const transitioned = await transitionJob(job.id, ['queued'], {
      status: 'ai_generating',
      progress_message: 'Drafting problem statement, model code, and base testcases...',
      error_message: null,
      started_at: new Date().toISOString(),
    });

    if (!transitioned) {
      const latest = await fetchJobById(job.id);
      return latest ? toSummary(latest) : null;
    }

    return toSummary(transitioned);
  }

  if (job.status === 'ai_generating') {
    const transitioned = await runAiGenerationStage(job);
    return toSummary(transitioned);
  }

  if (job.status === 'validating') {
    const transitioned = await runValidationStage(job);
    return toSummary(transitioned);
  }

  return toSummary(job);
}
