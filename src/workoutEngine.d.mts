export type WorkoutInterval = {
  kind: 'work' | 'rest';
  exerciseIndex: number;
  round: number;
  durationSeconds: number;
};

export type TimerState = {
  status: 'ready' | 'running' | 'paused' | 'finished';
  intervals: WorkoutInterval[];
  intervalIndex: number;
  deadlineMs: number | null;
  remainingMs: number;
};

export function createWorkoutIntervals(
  exerciseCount: number,
  rounds: number,
  workSeconds: number,
  restSeconds: number,
): WorkoutInterval[];
export function createTimerState(intervals: WorkoutInterval[]): TimerState;
export function startTimer(state: TimerState, nowMs: number): TimerState;
export function syncTimer(state: TimerState, nowMs: number): TimerState;
export function pauseTimer(state: TimerState, nowMs: number): TimerState;
export function skipInterval(state: TimerState, nowMs: number): TimerState;
export function restartTimer(state: TimerState): TimerState;
