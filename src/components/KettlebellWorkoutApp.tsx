import { useEffect, useMemo, useRef, useState } from 'react';
import exercisesData from '../data/kettlebellExercises.json';
import ExerciseMotionGuide, { ExerciseMotionInfo, supportsExerciseMotion } from './ExerciseMotionGuide';
import {
  createTimerState,
  createWorkoutIntervals,
  pauseTimer,
  restartTimer,
  skipInterval,
  startTimer,
  syncTimer,
  type TimerState,
} from '../workoutEngine.mjs';

type Exercise = (typeof exercisesData)[number];
type IntervalPreset = '40/20' | '45/15';
type WorkoutSettings = { interval: IntervalPreset; rounds: string };
type ActiveSession = {
  exercises: Exercise[];
  timer: TimerState;
};

const DEFAULT_SETTINGS: WorkoutSettings = { interval: '40/20', rounds: '5' };
const COUNTDOWN_FREQUENCY = 520;
const BOUNDARY_FREQUENCY = 620;
const INTERVAL_PRESETS: Record<IntervalPreset, { work: number; rest: number }> = {
  '40/20': { work: 40, rest: 20 },
  '45/15': { work: 45, rest: 15 },
};

function playBell(context: AudioContext, frequencies: number[]) {
  const startedAt = context.currentTime;
  frequencies.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const noteStartsAt = startedAt + index * 0.15;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, noteStartsAt);
    envelope.gain.setValueAtTime(0.0001, noteStartsAt);
    envelope.gain.exponentialRampToValueAtTime(0.16, noteStartsAt + 0.025);
    envelope.gain.exponentialRampToValueAtTime(0.001, noteStartsAt + 0.45);
    oscillator.connect(envelope);
    envelope.connect(context.destination);
    oscillator.start(noteStartsAt);
    oscillator.stop(noteStartsAt + 0.46);
  });
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function describeDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} sec`;
  if (seconds === 0) return `${minutes} min`;
  return `${minutes} min ${seconds} sec`;
}

function GuideDetails({ exercise }: { exercise: Exercise }) {
  return (
    <div className="workout-guide">
      <p className="workout-guide-label">General cues</p>
      <ul>
        {exercise.visual_cues.map((cue, index) => <li key={`${cue}-${index}`}>{cue}</li>)}
      </ul>
      <p><strong>Common mistake:</strong> {exercise.common_errors_to_visualize}</p>
    </div>
  );
}

function ExercisePicker({
  exercises,
  selected,
  search,
  onSearch,
  onAdd,
}: {
  exercises: Exercise[];
  selected: Exercise[];
  search: string;
  onSearch: (value: string) => void;
  onAdd: (exercise: Exercise) => void;
}) {
  const selectedNames = new Set(selected.map(({ exercise_name }) => exercise_name));
  const filteredExercises = exercises.filter(({ exercise_name }) =>
    exercise_name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <section className="workout-panel" aria-labelledby="exercise-picker-title">
      <div className="workout-panel-heading">
        <div>
          <p className="section-kicker">03 / SELECT</p>
          <h2 id="exercise-picker-title">Choose exercises</h2>
          <p>Search the library and add exercises to your circuit.</p>
        </div>
        <label className="search-field">
          <span>Search exercises</span>
          <input
            type="search"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="e.g. deadlift"
          />
        </label>
      </div>

      <div className="exercise-picker-list">
        {filteredExercises.map((exercise) => {
          const alreadyAdded = selectedNames.has(exercise.exercise_name);
          return (
            <article className="picker-exercise" key={exercise.exercise_name}>
              <div className="picker-exercise-main">
                <h3>{exercise.exercise_name}</h3>
                <p>{exercise.key_phases.join(' · ')}</p>
                <details>
                  <summary>View exercise cues</summary>
                  <GuideDetails exercise={exercise} />
                </details>
              </div>
              <button
                type="button"
                className="secondary-button add-exercise-button"
                onClick={() => onAdd(exercise)}
                disabled={alreadyAdded}
                aria-label={alreadyAdded ? `${exercise.exercise_name} already added` : `Add ${exercise.exercise_name}`}
              >
                {alreadyAdded ? 'Added' : 'Add'}
              </button>
            </article>
          );
        })}
        {filteredExercises.length === 0 && (
          <p className="empty-state" role="status">No exercises match “{search}”.</p>
        )}
      </div>
    </section>
  );
}

export default function KettlebellWorkoutApp() {
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [search, setSearch] = useState('');
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const sessionHeadingRef = useRef<HTMLHeadingElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastIntervalCountdownRef = useRef<{ intervalIndex: number; second: number } | null>(null);
  const lastIntervalIndexRef = useRef<number | null>(null);
  const lastTimerStatusRef = useRef<TimerState['status'] | null>(null);

  const { work: selectedWork, rest: selectedRest } = INTERVAL_PRESETS[settings.interval];
  const selectedRounds = Number(settings.rounds);
  const totalWorkIntervals = selectedExercises.length * selectedRounds;
  const estimatedSeconds = totalWorkIntervals * selectedWork + Math.max(0, totalWorkIntervals - 1) * selectedRest;
  const validationMessage = useMemo(() => {
    if (selectedExercises.length === 0) return 'Add at least one exercise to build your workout.';
    if (!Number.isInteger(selectedRounds) || selectedRounds < 5 || selectedRounds > 50) return 'Choose between 5 and 50 rounds.';
    return '';
  }, [selectedExercises.length, selectedRounds]);

  useEffect(() => {
    if (activeSession) sessionHeadingRef.current?.focus();
  }, [activeSession !== null]);

  const updateInterval = (interval: IntervalPreset) => {
    setSettings((current) => ({ ...current, interval }));
  };

  const moveExercise = (index: number, direction: -1 | 1) => {
    setSelectedExercises((current) => {
      const destination = index + direction;
      if (destination < 0 || destination >= current.length) return current;
      const reordered = [...current];
      [reordered[index], reordered[destination]] = [reordered[destination], reordered[index]];
      return reordered;
    });
  };

  const startWorkout = () => {
    if (validationMessage) return;
    const intervals = createWorkoutIntervals(
      selectedExercises.length,
      selectedRounds,
      selectedWork,
      selectedRest,
    );
    setActiveSession({
      exercises: [...selectedExercises],
      timer: createTimerState(intervals),
    });
  };

  const prepareAudio = () => {
    if (typeof window === 'undefined' || !window.AudioContext) return;
    if (!audioContextRef.current) audioContextRef.current = new window.AudioContext();
    if (audioContextRef.current.state === 'suspended') void audioContextRef.current.resume();
  };

  const ring = (frequencies: number[]) => {
    if (!soundEnabled || !audioContextRef.current) return;
    const context = audioContextRef.current;
    if (context.state === 'suspended') {
      void context.resume().then(() => playBell(context, frequencies));
      return;
    }
    playBell(context, frequencies);
  };

  const beginWorkout = () => {
    if (soundEnabled) prepareAudio();
    setActiveSession((current) => current ? {
      ...current,
      timer: startTimer(current.timer, performance.now()),
    } : current);
  };

  useEffect(() => {
    if (!activeSession || activeSession.timer.status !== 'running') return;

    const updateTimer = () => {
      const now = performance.now();
      setActiveSession((current) => {
        if (!current) return current;
        return { ...current, timer: syncTimer(current.timer, now) };
      });
    };
    const intervalId = window.setInterval(updateTimer, 100);
    document.addEventListener('visibilitychange', updateTimer);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', updateTimer);
    };
  }, [activeSession?.timer.status]);

  useEffect(() => {
    if (!activeSession) {
      lastIntervalCountdownRef.current = null;
      return;
    }
    const { intervalIndex, remainingMs, status } = activeSession.timer;
    if (status !== 'running') return;

    const second = Math.ceil(remainingMs / 1000);
    const previous = lastIntervalCountdownRef.current;
    if (!previous || previous.intervalIndex !== intervalIndex) {
      lastIntervalCountdownRef.current = { intervalIndex, second };
      return;
    }
    if (second < previous.second && second >= 1 && second <= 3) {
      ring([COUNTDOWN_FREQUENCY]);
    }
    lastIntervalCountdownRef.current = { intervalIndex, second };
  }, [activeSession?.timer.intervalIndex, activeSession?.timer.remainingMs, activeSession?.timer.status, soundEnabled]);

  useEffect(() => {
    if (!activeSession) {
      lastIntervalIndexRef.current = null;
      lastTimerStatusRef.current = null;
      return;
    }
    const { intervalIndex, status } = activeSession.timer;
    if (lastIntervalIndexRef.current !== null && intervalIndex !== lastIntervalIndexRef.current && status !== 'ready') {
      ring([BOUNDARY_FREQUENCY]);
    }
    if (lastTimerStatusRef.current === 'ready' && status === 'running') ring([BOUNDARY_FREQUENCY]);
    if (status === 'finished' && lastTimerStatusRef.current !== 'finished') {
      ring([BOUNDARY_FREQUENCY, BOUNDARY_FREQUENCY]);
    }
    lastIntervalIndexRef.current = intervalIndex;
    lastTimerStatusRef.current = status;
  }, [activeSession?.timer.intervalIndex, activeSession?.timer.status, soundEnabled]);

  useEffect(() => {
    if (activeSession?.timer.status === 'finished') sessionHeadingRef.current?.focus();
  }, [activeSession?.timer.status]);

  if (activeSession) {
    const { timer, exercises } = activeSession;
    const interval = timer.intervals[timer.intervalIndex];
    const isFinished = timer.status === 'finished';
    const isRest = interval?.kind === 'rest';
    const exercise = interval ? exercises[interval.exerciseIndex] : undefined;
    const remainingSeconds = Math.ceil(timer.remainingMs / 1000);
    const progress = timer.intervals.length === 0
      ? 0
      : Math.min(100, Math.round(((timer.intervalIndex + 1) / timer.intervals.length) * 100));

    return (
      <main className="app-container">
        <header className="site-header session-banner">
          <p className="eyebrow">Guided workout</p>
          <h1>Suts Workout Plan</h1>
        </header>

        <aside className="safety-note" aria-label="Important training note">
          <strong>Training note:</strong> These guides are general educational references, not personalized coaching
          or medical advice. Stop if you feel pain and seek guidance from a qualified professional when needed.
        </aside>

        {isFinished ? (
          <section className="session-card session-finished" aria-labelledby="session-finished-title">
            <p className="eyebrow">Workout complete</p>
            <h2 id="session-finished-title" ref={sessionHeadingRef} tabIndex={-1}>Nice work</h2>
            <p>Your {selectedRounds}-round workout is complete.</p>
            <button type="button" className="primary-button" onClick={() => setActiveSession(null)}>
              Back to workout builder
            </button>
          </section>
        ) : (
          <section className={`session-card ${isRest ? 'session-rest' : ''}`} aria-labelledby="session-title">
            <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
              {timer.status === 'ready'
                ? `Ready to start ${exercise?.exercise_name ?? 'the workout'}, round ${interval?.round ?? 1} of ${selectedRounds}.`
                : isRest
                  ? `Rest interval. Next exercise: ${exercise?.exercise_name ?? ''}, round ${interval?.round ?? 1} of ${selectedRounds}.`
                  : `Work interval: ${exercise?.exercise_name ?? ''}, round ${interval?.round ?? 1} of ${selectedRounds}.`}
            </p>
            <div className="session-topline">
              <p className={`session-mode ${isRest ? 'rest-mode' : 'work-mode'}`}>
                {isRest ? 'REST' : timer.status === 'ready' ? 'READY' : 'WORK'}
              </p>
              <p className="session-round">Round {interval?.round ?? 1} of {selectedRounds}</p>
            </div>

            <h2 id="session-title" ref={sessionHeadingRef} tabIndex={-1}>{isRest ? 'Take a breather' : exercise?.exercise_name}</h2>
            {isRest && exercise && <p className="next-exercise">Next up: <strong>{exercise.exercise_name}</strong></p>}
            {exercise && !isRest && supportsExerciseMotion(exercise.exercise_name) && (
              <ExerciseMotionGuide
                key={`${exercise.exercise_name}-${timer.intervalIndex}`}
                exercise={exercise}
                isPlaying={timer.status === 'running'}
              />
            )}
            <div
              className="timer-clock"
              role="timer"
              aria-label={`${formatTime(remainingSeconds)} remaining`}
            >
              {formatTime(remainingSeconds)}
            </div>
            <p className="timer-phase-caption">
              {timer.status === 'ready' ? 'Start when you are ready' : isRest ? 'Rest interval' : 'Work interval'}
              {' · '}{interval ? `${interval.exerciseIndex + 1} of ${exercises.length}` : ''}
            </p>
            {exercise && !isRest && (
              supportsExerciseMotion(exercise.exercise_name)
                ? <ExerciseMotionInfo exercise={exercise} />
                : <GuideDetails exercise={exercise} />
            )}

            <div className="session-controls">
              {timer.status === 'ready' && (
                <button type="button" className="primary-button" onClick={beginWorkout}>
                  Start workout
                </button>
              )}
              {timer.status === 'running' && (
                <button type="button" className="primary-button" onClick={() => setActiveSession((current) => current ? {
                  ...current,
                  timer: pauseTimer(current.timer, performance.now()),
                } : current)}>
                  Pause
                </button>
              )}
              {timer.status === 'paused' && (
                <button type="button" className="primary-button" onClick={() => setActiveSession((current) => current ? {
                  ...current,
                  timer: startTimer(current.timer, performance.now()),
                } : current)}>
                  Resume
                </button>
              )}
              <button
                type="button"
                className="secondary-button"
                onClick={() => setActiveSession((current) => current ? {
                  ...current,
                  timer: skipInterval(current.timer, performance.now()),
                } : current)}
                disabled={timer.status === 'ready'}
              >
                Skip interval
              </button>
              <button
                type="button"
                className="secondary-button sound-toggle"
                aria-pressed={soundEnabled}
                onClick={() => {
                  if (!soundEnabled) prepareAudio();
                  setSoundEnabled((enabled) => !enabled);
                }}
              >
                {soundEnabled ? 'Bell on' : 'Bell off'}
              </button>
            </div>

            <div className="session-progress">
              <div className="progress-label">
                <span>Workout progress</span>
                <span>Interval {timer.intervalIndex + 1} of {timer.intervals.length}</span>
              </div>
              <progress value={progress} max="100" aria-label="Workout progress" />
            </div>

          </section>
        )}

        {!isFinished && (
          <div className="session-footer-controls">
            <button type="button" className="text-button" onClick={() => setActiveSession((current) => current ? {
              ...current,
              timer: restartTimer(current.timer),
            } : current)}>
              Restart workout
            </button>
            <button type="button" className="text-button" onClick={() => setActiveSession(null)}>
              End workout
            </button>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="app-container">
      <header className="site-header hero-banner">
        <div className="hero-content">
          <h1>Suts Workout Plan</h1>
          <p className="hero-description">Build your circuit</p>
        </div>
      </header>

      <section className="workout-panel" aria-labelledby="workout-settings-title">
        <div className="workout-panel-heading">
          <div>
            <p className="section-kicker">02 / SET YOUR PACE</p>
            <h2 id="workout-settings-title">Workout settings</h2>
            <p>Each round goes through your exercise list once, in order.</p>
          </div>
        </div>
        <div className="settings-grid">
          <fieldset className="interval-presets">
            <legend>Work / rest interval</legend>
            {(['40/20', '45/15'] as const).map((interval) => (
              <label className={`interval-preset ${settings.interval === interval ? 'selected-preset' : ''}`} key={interval}>
                <input
                  type="radio"
                  name="interval-preset"
                  value={interval}
                  checked={settings.interval === interval}
                  onChange={() => updateInterval(interval)}
                />
                <span><strong>{interval}</strong><span>seconds work / rest</span></span>
              </label>
            ))}
          </fieldset>
          <div className="setting-field rounds-field">
            <div className="rounds-label-row">
              <label htmlFor="rounds-slider">Rounds</label>
              <output htmlFor="rounds-slider">{settings.rounds}</output>
            </div>
            <input
              id="rounds-slider"
              className="rounds-slider"
              type="range"
              min="5"
              max="50"
              step="1"
              value={settings.rounds}
              onChange={(event) => setSettings((current) => ({ ...current, rounds: event.target.value }))}
            />
            <div className="range-boundaries" aria-hidden="true"><span>5</span><span>50</span></div>
          </div>
        </div>
        <p className="duration-estimate" aria-live="polite">
          Estimated duration: {Number.isFinite(estimatedSeconds) && estimatedSeconds >= 0 ? describeDuration(estimatedSeconds) : '—'}
        </p>
      </section>

      <ExercisePicker
        exercises={exercisesData}
        selected={selectedExercises}
        search={search}
        onSearch={setSearch}
        onAdd={(exercise) => setSelectedExercises((current) =>
          current.some(({ exercise_name }) => exercise_name === exercise.exercise_name)
            ? current
            : [...current, exercise],
        )}
      />

      <section className="workout-panel planned-workout" aria-labelledby="planned-workout-title">
        <div className="workout-panel-heading">
          <div>
            <p className="section-kicker">04 / YOUR SESSION</p>
            <h2 id="planned-workout-title">Your workout</h2>
            <p>{selectedExercises.length} {selectedExercises.length === 1 ? 'exercise' : 'exercises'} · {settings.rounds || '0'} rounds</p>
          </div>
        </div>

        {selectedExercises.length === 0 ? (
          <p className="empty-state">Add exercises from the library above to build your circuit.</p>
        ) : (
          <ol className="planned-exercise-list">
            {selectedExercises.map((exercise, index) => (
              <li key={exercise.exercise_name}>
                <span className="planned-exercise-number">{index + 1}</span>
                <span className="planned-exercise-name">{exercise.exercise_name}</span>
                <div className="planned-exercise-controls">
                  <button type="button" className="icon-button" onClick={() => moveExercise(index, -1)} disabled={index === 0} aria-label={`Move ${exercise.exercise_name} up`}>
                    ↑
                  </button>
                  <button type="button" className="icon-button" onClick={() => moveExercise(index, 1)} disabled={index === selectedExercises.length - 1} aria-label={`Move ${exercise.exercise_name} down`}>
                    ↓
                  </button>
                  <button type="button" className="remove-button" onClick={() => setSelectedExercises((current) => current.filter((item) => item.exercise_name !== exercise.exercise_name))}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}

        {validationMessage && <p className="validation-message" role="status">{validationMessage}</p>}
        <button type="button" className="primary-button start-workout-button" onClick={startWorkout} disabled={Boolean(validationMessage)}>
          Start workout
        </button>
      </section>
      <footer className="site-footer">
        <p>General exercise guidance, not personalized coaching or medical advice. Stop if you feel pain.</p>
      </footer>
    </main>
  );
}
