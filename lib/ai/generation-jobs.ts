import { createHash, randomUUID } from 'node:crypto';
import { supabase } from '@/lib/supabase/client';
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
import {
  annotateGeneratedProblems,
  validateProblemsAgainstModel,
} from './generation-problem-processing';

const JOB_SELECT_FIELDS = [
  'id',
  'created_by',
  'status',
  'request_payload',
  'result_payload',
  'progress_message',
  'error_message',
  'processing_token',
  'processing_started_at',
  'created_at',
  'updated_at',
  'completed_at',
].join(', ');

const TERMINAL_JOB_STATUSES: ReadonlySet<ProblemGenerationJobStatus> = new Set([
  'completed',
  'discarded',
  'error',
]);

const ACTIVE_JOB_STATUSES: readonly ProblemGenerationJobStatus[] = [
  'queued',
  'ai_generating',
  'validating',
];

const MAX_ACTIVE_GENERATION_JOBS_PER_USER = 2;
const STALE_JOB_TIMEOUT_MS = 24 * 60 * 60 * 1000;
// Keep lock expiry far above normal generation time while still allowing timely crash recovery.
const PROCESSING_LOCK_TIMEOUT_MS = 20 * 60 * 1000;
const MAINTENANCE_INTERVAL_MS = 60 * 1000;

let lastMaintenanceAt = 0;

interface ProblemGenerationJobRow {
  id: string;
  created_by: string;
  status: ProblemGenerationJobStatus;
  request_payload: ProblemGenerationRequest;
  result_payload: { problems?: GeneratedProblem[] } | null;
  progress_message: string | null;
  error_message: string | null;
  processing_token: string | null;
  processing_started_at: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface ProblemGenerationJobSummary {
  jobId: string;
  status: ProblemGenerationJobStatus;
  progressMessage: string | null;
  errorMessage: string | null;
  problems: GeneratedProblem[] | null;
}

export class ProblemGenerationConcurrencyLimitError extends Error {
  constructor(message = 'Too many active generation jobs. Wait for one to finish before starting another.') {
    super(message);
    this.name = 'ProblemGenerationConcurrencyLimitError';
  }
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
    processing_token: typeof raw.processing_token === 'string' ? raw.processing_token : null,
    processing_started_at:
      typeof raw.processing_started_at === 'string' ? raw.processing_started_at : null,
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
  updates: Record<string, unknown>,
  options: { lockToken?: string } = {}
): Promise<ProblemGenerationJobRow | null> {
  let query = supabase
    .from('problem_generation_jobs')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .in('status', [...fromStatuses]);

  if (options.lockToken) {
    query = query.eq('processing_token', options.lockToken);
  }

  const { data, error } = await query.select(JOB_SELECT_FIELDS).maybeSingle();

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

  return createHash('sha256').update(payload).digest('hex');
}

async function discardStaleActiveJobs(): Promise<void> {
  const staleCutoffIso = new Date(Date.now() - STALE_JOB_TIMEOUT_MS).toISOString();
  const nowIso = new Date().toISOString();

  const { error } = await supabase
    .from('problem_generation_jobs')
    .update({
      status: 'discarded',
      progress_message: 'Generation discarded: job expired before completion.',
      error_message: 'Generation job expired due to inactivity. Please retry generation.',
      completed_at: nowIso,
      processing_token: null,
      processing_started_at: null,
      updated_at: nowIso,
    })
    .in('status', [...ACTIVE_JOB_STATUSES])
    .lt('updated_at', staleCutoffIso);

  if (error) {
    throw new Error(`Failed to discard stale generation jobs: ${error.message}`);
  }
}

async function releaseExpiredProcessingLocks(): Promise<void> {
  const staleLockCutoffIso = new Date(Date.now() - PROCESSING_LOCK_TIMEOUT_MS).toISOString();
  const nowIso = new Date().toISOString();

  const { error } = await supabase
    .from('problem_generation_jobs')
    .update({
      processing_token: null,
      processing_started_at: null,
      updated_at: nowIso,
    })
    .in('status', ['ai_generating', 'validating'])
    .not('processing_started_at', 'is', null)
    .lt('processing_started_at', staleLockCutoffIso);

  if (error) {
    throw new Error(`Failed to release stale generation locks: ${error.message}`);
  }
}

async function runMaintenanceIfDue(): Promise<void> {
  const now = Date.now();
  if (now - lastMaintenanceAt < MAINTENANCE_INTERVAL_MS) {
    return;
  }

  lastMaintenanceAt = now;

  try {
    await Promise.all([discardStaleActiveJobs(), releaseExpiredProcessingLocks()]);
  } catch (error) {
    console.error('Problem generation maintenance failed:', error);
  }
}

async function claimJobProcessingLock(
  jobId: string,
  status: 'ai_generating' | 'validating',
  lockToken: string
): Promise<ProblemGenerationJobRow | null> {
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from('problem_generation_jobs')
    .update({
      processing_token: lockToken,
      processing_started_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', jobId)
    .eq('status', status)
    .is('processing_token', null)
    .select(JOB_SELECT_FIELDS)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to claim generation job processing lock: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapJobRow(data);
}

async function runAiGenerationStage(
  job: ProblemGenerationJobRow,
  lockToken: string
): Promise<ProblemGenerationJobRow> {
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
      processing_token: null,
      processing_started_at: null,
    }, { lockToken });

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
      processing_token: null,
      processing_started_at: null,
    }, { lockToken });

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

async function runValidationStage(
  job: ProblemGenerationJobRow,
  lockToken: string
): Promise<ProblemGenerationJobRow> {
  try {
    const problems = job.result_payload?.problems;
    if (!problems || !Array.isArray(problems) || problems.length === 0) {
      const transitioned = await transitionJob(job.id, ['validating'], {
        status: 'discarded',
        progress_message: 'Generation discarded: missing generated problems payload.',
        error_message: 'Validation could not start because generated problems were missing.',
        completed_at: new Date().toISOString(),
        processing_token: null,
        processing_started_at: null,
      }, { lockToken });

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
    const requestSeed = buildGenerationSeed(job.request_payload);
    const validationResult = await validateProblemsAgainstModel(
      problems,
      requestLanguages,
      requestSeed
    );

    if (!validationResult.ok) {
      const transitioned = await transitionJob(job.id, ['validating'], {
        status: 'discarded',
        progress_message: 'Generation discarded: model solution failed generated testcase validation.',
        error_message: validationResult.message,
        completed_at: new Date().toISOString(),
        processing_token: null,
        processing_started_at: null,
      }, { lockToken });

      if (!transitioned) {
        const latestJob = await fetchJobById(job.id);
        if (!latestJob) {
          throw new Error('Generation job disappeared after validation failure transition');
        }
        return latestJob;
      }

      return transitioned;
    }

    if (!validationResult.problems || validationResult.problems.length === 0) {
      const transitioned = await transitionJob(job.id, ['validating'], {
        status: 'discarded',
        progress_message: 'Generation discarded: validation completed without finalized testcases.',
        error_message: 'Validation did not return finalized testcase payload.',
        completed_at: new Date().toISOString(),
        processing_token: null,
        processing_started_at: null,
      }, { lockToken });

      if (!transitioned) {
        const latestJob = await fetchJobById(job.id);
        if (!latestJob) {
          throw new Error('Generation job disappeared after empty validation payload transition');
        }
        return latestJob;
      }

      return transitioned;
    }

    const completionUpdate = {
      status: 'completed',
      progress_message: 'Validation complete. Problems are ready for preview.',
      result_payload: { problems: validationResult.problems },
      error_message: null,
      completed_at: new Date().toISOString(),
      processing_token: null,
      processing_started_at: null,
    };

    const transitioned = await transitionJob(job.id, ['validating'], completionUpdate, { lockToken });

    if (!transitioned) {
      const latestJob = await fetchJobById(job.id);
      if (!latestJob) {
        throw new Error('Generation job disappeared after completion transition');
      }

      if (latestJob.status === 'validating' && latestJob.processing_token === lockToken) {
        const retriedTransition = await transitionJob(
          job.id,
          ['validating'],
          completionUpdate,
          { lockToken }
        );

        if (retriedTransition) {
          return retriedTransition;
        }

        const retriedLatestJob = await fetchJobById(job.id);
        if (!retriedLatestJob) {
          throw new Error('Generation job disappeared after completion transition retry');
        }

        return retriedLatestJob;
      }

      if (
        latestJob.status === 'completed' &&
        (!latestJob.result_payload?.problems || latestJob.result_payload.problems.length === 0)
      ) {
        throw new Error('Generation job completed without validated result payload after transition race');
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
      processing_token: null,
      processing_started_at: null,
    }, { lockToken });

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
  await runMaintenanceIfDue();

  const normalizedRequest = normalizeJobRequest(params.request);

  const { data, error } = await supabase
    .from('problem_generation_jobs')
    .insert({
      created_by: params.createdBy,
      status: 'queued',
      request_payload: normalizedRequest,
      progress_message: 'Generation job queued. Preparing model draft.',
      error_message: null,
      processing_token: null,
      processing_started_at: null,
      started_at: null,
      completed_at: null,
    })
    .select(JOB_SELECT_FIELDS)
    .single();

  if (error) {
    const errorCode = (error as { code?: string }).code;
    const normalizedMessage = (error.message || '').trim();
    const loweredMessage = (error.message || '').toLowerCase();
    if (
      (errorCode === 'P0001' && normalizedMessage === 'TOO_MANY_ACTIVE_GENERATION_JOBS') ||
      (errorCode === 'P0001' && loweredMessage.includes('too many active generation jobs'))
    ) {
      const friendlyLimitMessage =
        `You already have ${MAX_ACTIVE_GENERATION_JOBS_PER_USER} active generation jobs. ` +
        'Wait for one to finish before starting another.';

      throw new ProblemGenerationConcurrencyLimitError(
        normalizedMessage === 'TOO_MANY_ACTIVE_GENERATION_JOBS'
          ? friendlyLimitMessage
          : error.message || friendlyLimitMessage
      );
    }

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
  await runMaintenanceIfDue();

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
      processing_token: null,
      processing_started_at: null,
      started_at: new Date().toISOString(),
    });

    if (!transitioned) {
      const latest = await fetchJobById(job.id);
      return latest ? toSummary(latest) : null;
    }

    return toSummary(transitioned);
  }

  if (job.status === 'ai_generating') {
    const lockToken = randomUUID();
    const claimed = await claimJobProcessingLock(job.id, 'ai_generating', lockToken);
    if (!claimed) {
      const latest = await fetchJobById(job.id);
      return latest ? toSummary(latest) : null;
    }

    const transitioned = await runAiGenerationStage(claimed, lockToken);
    return toSummary(transitioned);
  }

  if (job.status === 'validating') {
    const lockToken = randomUUID();
    const claimed = await claimJobProcessingLock(job.id, 'validating', lockToken);
    if (!claimed) {
      const latest = await fetchJobById(job.id);
      return latest ? toSummary(latest) : null;
    }

    const transitioned = await runValidationStage(claimed, lockToken);
    return toSummary(transitioned);
  }

  return toSummary(job);
}
