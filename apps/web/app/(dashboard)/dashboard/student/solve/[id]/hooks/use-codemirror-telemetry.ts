/**
 * Telemetry hook for CodeMirror - tracks student behavior for plagiarism detection
 */

import { useCallback, useEffect, useRef } from "react";
import { EditorView } from "@codemirror/view";
import { Transaction } from "@codemirror/state";
import { supabase } from "@/lib/supabase/client";

export interface TelemetrySummary {
  paste_count: number;
  total_pasted_chars: number;
  tab_switch_count: number;
  backspace_count: number;
  delete_count: number;
  total_active_time_ms: number;
  total_idle_time_ms: number;
  run_count: number;
  cpm_samples: CpmSample[];
}

export interface CpmSample {
  timestamp: string;
  cpm: number;
  char_count: number;
  window_ms: number;
}

export interface TelemetryInterval {
  start: string;
  end: string;
  active_ms: number;
  idle_ms: number;
}

export interface TelemetryHistoryEvent {
  timestamp: string;
  type: 'paste' | 'focus' | 'blur' | 'run' | 'submit' | 'reset';
  data?: Record<string, unknown>;
}

export interface TelemetryEvents {
  summary: TelemetrySummary;
  intervals: TelemetryInterval[];
  history: TelemetryHistoryEvent[];
}

export interface TelemetryRow {
  id: string;
  student_id: string;
  problem_id: string;
  assignment_id: string | null;
  events: TelemetryEvents;
  updated_at: string;
}

// Session buffer held in memory (never persisted to localStorage)
export interface SessionBuffer {
  summary: TelemetrySummary;
  intervals: TelemetryInterval[];
  history: TelemetryHistoryEvent[];
  currentIntervalStart: number;
  lastActivityTime: number;
  isWindowFocused: boolean;
  charsInCpmWindow: number;
  cpmWindowStart: number;
}

export interface UseCodeMirrorTelemetryOptions {
  studentId: string;
  problemId: string;
  assignmentId?: string | null;
  isAssignmentClosed?: boolean;
  syncIntervalMs?: number;
  cpmWindowMs?: number;
  idleThresholdMs?: number;
}

const DEFAULT_SYNC_INTERVAL_MS = 20000;
const DEFAULT_CPM_WINDOW_MS = 30000;
const DEFAULT_IDLE_THRESHOLD_MS = 30000;

const createEmptyBuffer = (): SessionBuffer => ({
  summary: {
    paste_count: 0,
    total_pasted_chars: 0,
    tab_switch_count: 0,
    backspace_count: 0,
    delete_count: 0,
    total_active_time_ms: 0,
    total_idle_time_ms: 0,
    run_count: 0,
    cpm_samples: [],
  },
  intervals: [],
  history: [],
  currentIntervalStart: Date.now(),
  lastActivityTime: Date.now(),
  isWindowFocused: true,
  charsInCpmWindow: 0,
  cpmWindowStart: Date.now(),
});

export function useCodeMirrorTelemetry(options: UseCodeMirrorTelemetryOptions) {
  const {
    studentId,
    problemId,
    assignmentId = null,
    isAssignmentClosed = false,
    syncIntervalMs = DEFAULT_SYNC_INTERVAL_MS,
    cpmWindowMs = DEFAULT_CPM_WINDOW_MS,
    idleThresholdMs = DEFAULT_IDLE_THRESHOLD_MS,
  } = options;

  // Create a unique key for this session to track problem switches
  const sessionKey = `${studentId}:${problemId}:${assignmentId}`;
  
  const bufferRef = useRef<SessionBuffer>(createEmptyBuffer());
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cpmIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentSessionKeyRef = useRef<string | null>(null);
  const isLockedDownRef = useRef(false);
  const dbEventsRef = useRef<TelemetryEvents | null>(null);
  const isSyncingRef = useRef(false); // Prevent concurrent syncs

  // Record history event (no re-renders)
  const recordHistory = useCallback((type: TelemetryHistoryEvent['type'], data?: Record<string, unknown>) => {
    if (isLockedDownRef.current) return;
    bufferRef.current.history.push({
      timestamp: new Date().toISOString(),
      type,
      data,
    });
  }, []);

  // Update activity time for idle tracking
  const touchActivity = useCallback(() => {
    if (isLockedDownRef.current) return;
    const now = Date.now();
    const buffer = bufferRef.current;
    
    if (!buffer.isWindowFocused) return;
    
    const idleTime = now - buffer.lastActivityTime;
    if (idleTime > idleThresholdMs) {
      buffer.summary.total_idle_time_ms += idleTime;
    } else {
      buffer.summary.total_active_time_ms += idleTime;
    }
    buffer.lastActivityTime = now;
  }, [idleThresholdMs]);

  // Finalize current interval and start new one
  const finalizeInterval = useCallback(() => {
    const buffer = bufferRef.current;
    const now = Date.now();
    
    const interval: TelemetryInterval = {
      start: new Date(buffer.currentIntervalStart).toISOString(),
      end: new Date(now).toISOString(),
      active_ms: buffer.summary.total_active_time_ms,
      idle_ms: buffer.summary.total_idle_time_ms,
    };
    
    buffer.intervals.push(interval);
    buffer.currentIntervalStart = now;
    buffer.summary.total_active_time_ms = 0;
    buffer.summary.total_idle_time_ms = 0;
  }, []);

  // Calculate and record CPM sample
  const recordCpmSample = useCallback(() => {
    if (isLockedDownRef.current) return;
    
    const buffer = bufferRef.current;
    const now = Date.now();
    const windowMs = now - buffer.cpmWindowStart;
    
    if (windowMs >= cpmWindowMs && buffer.charsInCpmWindow > 0) {
      const cpm = Math.round((buffer.charsInCpmWindow / windowMs) * 60000);
      buffer.summary.cpm_samples.push({
        timestamp: new Date().toISOString(),
        cpm,
        char_count: buffer.charsInCpmWindow,
        window_ms: windowMs,
      });
      buffer.charsInCpmWindow = 0;
      buffer.cpmWindowStart = now;
    }
  }, [cpmWindowMs]);

  // Merge session buffer with DB data
  const mergeEvents = useCallback((dbEvents: TelemetryEvents, sessionBuffer: SessionBuffer): TelemetryEvents => ({
    summary: {
      paste_count: dbEvents.summary.paste_count + sessionBuffer.summary.paste_count,
      total_pasted_chars: dbEvents.summary.total_pasted_chars + sessionBuffer.summary.total_pasted_chars,
      tab_switch_count: dbEvents.summary.tab_switch_count + sessionBuffer.summary.tab_switch_count,
      backspace_count: dbEvents.summary.backspace_count + sessionBuffer.summary.backspace_count,
      delete_count: dbEvents.summary.delete_count + sessionBuffer.summary.delete_count,
      total_active_time_ms: dbEvents.summary.total_active_time_ms + sessionBuffer.summary.total_active_time_ms,
      total_idle_time_ms: dbEvents.summary.total_idle_time_ms + sessionBuffer.summary.total_idle_time_ms,
      run_count: dbEvents.summary.run_count + sessionBuffer.summary.run_count,
      cpm_samples: [...dbEvents.summary.cpm_samples, ...sessionBuffer.summary.cpm_samples],
    },
    intervals: [...dbEvents.intervals, ...sessionBuffer.intervals],
    history: [...dbEvents.history, ...sessionBuffer.history],
  }), []);

  // Sync to database (with race condition protection)
  const syncToDatabase = useCallback(async (reason: string = 'interval') => {
    if (isLockedDownRef.current) {
      console.log('[telemetry] 🔒 Skipping sync - lockdown active');
      return;
    }
    
    // Prevent concurrent syncs
    if (isSyncingRef.current) {
      console.log('[telemetry] ⏳ Sync already in progress, skipping');
      return;
    }
    
    isSyncingRef.current = true;
    
    try {
      const buffer = bufferRef.current;
      
      // Capture current buffer state atomically
      const sessionSnapshot: SessionBuffer = {
        summary: { ...buffer.summary },
        intervals: [...buffer.intervals],
        history: [...buffer.history],
        currentIntervalStart: buffer.currentIntervalStart,
        lastActivityTime: buffer.lastActivityTime,
        isWindowFocused: buffer.isWindowFocused,
        charsInCpmWindow: buffer.charsInCpmWindow,
        cpmWindowStart: buffer.cpmWindowStart,
      };
      
      // Check if there's anything to sync (include all counters + history + intervals)
      const hasData = sessionSnapshot.summary.paste_count > 0 ||
        sessionSnapshot.summary.tab_switch_count > 0 ||
        sessionSnapshot.summary.backspace_count > 0 ||
        sessionSnapshot.summary.delete_count > 0 ||
        sessionSnapshot.summary.run_count > 0 ||
        sessionSnapshot.history.length > 0 ||
        sessionSnapshot.intervals.length > 0;
      
      if (!hasData) {
        console.log('[telemetry] 📭 No new data to sync');
        return;
      }
      
      const baseEvents: TelemetryEvents = dbEventsRef.current || {
        summary: { paste_count: 0, total_pasted_chars: 0, tab_switch_count: 0, backspace_count: 0, delete_count: 0, total_active_time_ms: 0, total_idle_time_ms: 0, run_count: 0, cpm_samples: [] },
        intervals: [],
        history: [],
      };
      
      const mergedEvents = mergeEvents(baseEvents, sessionSnapshot);
      
      console.log(`[telemetry] 📤 Syncing to DB (${reason}):`, {
        sessionKey,
        summary: mergedEvents.summary,
        historyCount: mergedEvents.history.length,
      });
      
      const { error, data, status } = await supabase.from('telemetry').upsert(
        {
          student_id: studentId,
          problem_id: problemId,
          assignment_id: assignmentId,
          events: mergedEvents,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'student_id,problem_id,assignment_id' }
      ).select();
      
      if (error) {
        console.error('[telemetry] ❌ Upsert error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          status,
        });
        throw error;
      }
      
      console.log('[telemetry] ✅ Sync successful');
      
      // Update dbEventsRef with merged data
      dbEventsRef.current = mergedEvents;
      
      // Clear ONLY the synced data from buffer (keep timing state)
      buffer.summary = {
        paste_count: 0,
        total_pasted_chars: 0,
        tab_switch_count: 0,
        backspace_count: 0,
        delete_count: 0,
        total_active_time_ms: 0,
        total_idle_time_ms: 0,
        run_count: 0,
        cpm_samples: [],
      };
      buffer.intervals = [];
      buffer.history = [];
    } catch (err) {
      console.error('[telemetry] ❌ Sync failed:', err instanceof Error ? err.message : JSON.stringify(err));
    } finally {
      isSyncingRef.current = false;
    }
  }, [studentId, problemId, assignmentId, sessionKey, mergeEvents]);

  // Handle problem/session switch - reset all state
  useEffect(() => {
    // Check if session changed
    if (currentSessionKeyRef.current !== sessionKey) {
      // Session changed - sync old data first (if any)
      if (currentSessionKeyRef.current !== null) {
        console.log('[telemetry] 🔄 Session changed, syncing old data...');
        // Note: Can't await here in cleanup, but we fire-and-forget
        syncToDatabase('session-switch');
      }
      
      // Reset all state for new session
      console.log('[telemetry] 🚀 New session:', { sessionKey });
      bufferRef.current = createEmptyBuffer();
      dbEventsRef.current = null;
      currentSessionKeyRef.current = sessionKey;
      
      // Fetch existing data for new session
      if (!isAssignmentClosed && studentId && problemId) {
        const fetchExisting = async () => {
          try {
            const { data, error } = await supabase
              .from('telemetry')
              .select('events')
              .eq('student_id', studentId)
              .eq('problem_id', problemId)
              .eq('assignment_id', assignmentId)
              .maybeSingle();
            
            if (error) {
              console.error('[telemetry] ❌ Fetch error:', error);
              return;
            }
            if (data?.events) {
              dbEventsRef.current = data.events as TelemetryEvents;
              console.log('[telemetry] 📥 Loaded existing data');
            } else {
              console.log('[telemetry] 📝 No existing data, starting fresh');
            }
          } catch (err) {
            console.error('[telemetry] ❌ Fetch failed:', err);
          }
        };
        
        fetchExisting();
      }
    }
  }, [sessionKey, studentId, problemId, assignmentId, isAssignmentClosed, syncToDatabase]);

  // Lockdown effect
  useEffect(() => {
    if (isAssignmentClosed) {
      isLockedDownRef.current = true;
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
      if (cpmIntervalRef.current) clearInterval(cpmIntervalRef.current);
      syncIntervalRef.current = null;
      cpmIntervalRef.current = null;
    }
  }, [isAssignmentClosed]);

  // Start sync interval
  useEffect(() => {
    if (isAssignmentClosed) return;
    
    syncIntervalRef.current = setInterval(() => syncToDatabase('interval'), syncIntervalMs);
    cpmIntervalRef.current = setInterval(recordCpmSample, cpmWindowMs);
    
    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
      if (cpmIntervalRef.current) clearInterval(cpmIntervalRef.current);
    };
  }, [isAssignmentClosed, syncIntervalMs, cpmWindowMs, syncToDatabase, recordCpmSample]);

  // Focus/blur tracking
  useEffect(() => {
    if (isAssignmentClosed) return;
    
    const handleVisibilityChange = () => {
      const buffer = bufferRef.current;
      const nowHidden = document.hidden;
      
      if (nowHidden && buffer.isWindowFocused) {
        buffer.isWindowFocused = false;
        buffer.summary.tab_switch_count++;
        recordHistory('blur');
        finalizeInterval();
      } else if (!nowHidden && !buffer.isWindowFocused) {
        buffer.isWindowFocused = true;
        buffer.currentIntervalStart = Date.now();
        buffer.lastActivityTime = Date.now();
        recordHistory('focus');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAssignmentClosed, recordHistory, finalizeInterval]);

  // CodeMirror extension factory
  const createTelemetryExtension = useCallback(() => {
    return EditorView.updateListener.of((update) => {
      if (isLockedDownRef.current) return;
      
      const buffer = bufferRef.current;
      
      if (update.docChanged) {
        touchActivity();
        console.log('[telemetry] ⌨️ Document changed, transactions:', update.transactions.length);
        
        update.changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
          const deletedChars = toA - fromA;
          const insertedChars = inserted.length;
          
          // Detect paste (large insert without typed input)
          if (insertedChars > 50 && !update.transactions.some(t => t.isUserEvent('input.type'))) {
            buffer.summary.paste_count++;
            buffer.summary.total_pasted_chars += insertedChars;
            recordHistory('paste', { chars: insertedChars });
            console.log('[telemetry] 📋 Paste detected:', { chars: insertedChars });
          }
          
          // Track backspace/delete via transaction annotations
          for (const tr of update.transactions) {
            const userEvent = tr.annotation(Transaction.userEvent) as string | undefined;
            
            // Handle various delete event types
            if (typeof userEvent === 'string') {
              if (userEvent === 'delete.backward') {
                // Backspace key
                buffer.summary.backspace_count++;
                buffer.charsInCpmWindow = Math.max(0, buffer.charsInCpmWindow - 1);
              } else if (
                userEvent === 'delete.forward' || 
                userEvent === 'delete.selection' ||
                userEvent === 'delete.line' ||
                userEvent.startsWith('delete.')
              ) {
                // Delete key, selection delete, or other delete operations
                buffer.summary.delete_count++;
                buffer.charsInCpmWindow = Math.max(0, buffer.charsInCpmWindow - deletedChars);
              } else if (userEvent.startsWith('input.type')) {
                buffer.charsInCpmWindow += insertedChars;
              }
            }
          }
        });
      }
    });
  }, [touchActivity, recordHistory]);

  // External action: record run
  const recordRun = useCallback(() => {
    if (isLockedDownRef.current) {
      console.log('[telemetry] 🔒 Run blocked - lockdown');
      return;
    }
    bufferRef.current.summary.run_count++;
    recordHistory('run');
    console.log('[telemetry] ▶️ Run recorded, count:', bufferRef.current.summary.run_count);
  }, [recordHistory]);

  // External action: record submit
  const recordSubmit = useCallback(() => {
    if (isLockedDownRef.current) return;
    recordHistory('submit');
    syncToDatabase('submit');
  }, [recordHistory, syncToDatabase]);

  // External action: record reset
  const recordReset = useCallback(() => {
    if (isLockedDownRef.current) return;
    recordHistory('reset');
  }, [recordHistory]);

  // Force sync (e.g., on unmount)
  const forceSync = useCallback(() => {
    if (!isLockedDownRef.current) {
      syncToDatabase('force');
    }
  }, [syncToDatabase]);

  // Sync on unmount
  useEffect(() => {
    return () => {
      // Use navigator.sendBeacon for reliable unmount sync (fire-and-forget)
      if (!isLockedDownRef.current && bufferRef.current) {
        console.log('[telemetry] 🏃 Unmount sync triggered');
        syncToDatabase('unmount');
      }
    };
  }, [syncToDatabase]);

  return {
    telemetryExtension: createTelemetryExtension,
    recordRun,
    recordSubmit,
    recordReset,
    forceSync,
    isLockedDown: isLockedDownRef.current,
  };
}
