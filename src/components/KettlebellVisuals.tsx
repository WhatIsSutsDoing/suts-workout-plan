import { useState } from 'react';
import exercisesData from '../data/kettlebellExercises.json';

const COLORS = {
  form: '#1B1B1B',
  reference: '#64748B',
};

const Joint = ({ x, y, emphasized }: { x: number; y: number; emphasized?: boolean }) => (
  <circle
    cx={x}
    cy={y}
    r={emphasized ? 6 : 4}
    fill={COLORS.form}
  />
);

const Bone = ({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) => (
  <line
    x1={x1}
    y1={y1}
    x2={x2}
    y2={y2}
    stroke={COLORS.form}
    strokeWidth={3}
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

const FigureBuilder = ({ phaseType }: { phaseType: string }) => {
  const head = { x: 150, y: 50 };
  const neck = { x: 150, y: 62 };
  const hip = { x: 150, y: 140 };
  const kneeL = { x: 150, y: 220 };
  const kneeR = { x: 150, y: 220 };
  const ankleL = { x: 150, y: 300 };
  const ankleR = { x: 150, y: 300 };
  const shoulder = { x: 150, y: 80 };
  const elbow = { x: 130, y: 120 };
  const hand = { x: 130, y: 140 };

  const isBottom = /bottom/i.test(phaseType);
  const isDescent = /descent/i.test(phaseType);
  const isSit = /sit/i.test(phaseType);

  if (/sumo/i.test(phaseType)) {
    kneeL.x = 120;
    kneeR.x = 180;
    ankleL.x = 110;
    ankleR.x = 190;
    if (isBottom || isDescent) {
      hip.y += 50;
      kneeL.y += 30;
      kneeR.y += 30;
      ankleL.y += 20;
      ankleR.y += 20;
    }
  } else if (/lunge|split/i.test(phaseType)) {
    kneeL.x = 130;
    kneeR.x = 170;
    kneeR.y = 250;
    ankleR.y = 320;
    if (isBottom || isDescent) {
      hip.y += 40;
      kneeL.y += 20;
      kneeR.y += 30;
    }
  } else if (/hinge|deadlift|romanian/i.test(phaseType)) {
    hip.x += 30;
    hip.y += 20;
    shoulder.x += 15;
    kneeL.y += 10;
    kneeR.y += 10;
    if (/lockout|stand/i.test(phaseType)) {
      hip.x = 150;
      hip.y = 140;
      shoulder.x = 150;
    }
  } else if (isBottom || isDescent || isSit || /squat/i.test(phaseType)) {
    hip.y += 40;
    kneeL.x -= 15;
    kneeR.x += 15;
    ankleL.x -= 10;
    ankleR.x += 10;
  }

  return (
    <g>
      <Bone x1={hip.x} y1={hip.y} x2={kneeL.x} y2={kneeL.y} />
      <Joint x={kneeL.x} y={kneeL.y} emphasized />
      <Bone x1={kneeL.x} y1={kneeL.y} x2={ankleL.x} y2={ankleL.y} />
      <Joint x={ankleL.x} y={ankleL.y} />

      <Bone x1={hip.x} y1={hip.y} x2={kneeR.x} y2={kneeR.y} />
      <Joint x={kneeR.x} y={kneeR.y} emphasized />
      <Bone x1={kneeR.x} y1={kneeR.y} x2={ankleR.x} y2={ankleR.y} />
      <Joint x={ankleR.x} y={ankleR.y} />

      <Bone x1={neck.x} y1={neck.y} x2={hip.x} y2={hip.y} />
      <Joint x={hip.x} y={hip.y} emphasized />
      <Joint x={head.x} y={head.y} />
      <Bone x1={shoulder.x} y1={shoulder.y} x2={elbow.x} y2={elbow.y} />
      <Joint x={elbow.x} y={elbow.y} emphasized />
      <Bone x1={elbow.x} y1={elbow.y} x2={hand.x} y2={hand.y} />
    </g>
  );
};

interface Exercise {
  exercise_name: string;
  view_angle: string;
  key_phases: string[];
  visual_cues: string[];
  common_errors_to_visualize: string;
  svg_construction_notes: string;
}

const ExerciseVisualizer = ({ exercise }: { exercise: Exercise }) => {
  const frameWidth = 200;
  const diagramWidth = frameWidth * exercise.key_phases.length;

  return (
    <article className="exercise-card" aria-labelledby="current-exercise-title">
      <header className="exercise-header">
        <div>
          <p className="eyebrow">Exercise guide</p>
          <h2 id="current-exercise-title">{exercise.exercise_name}</h2>
        </div>
      </header>

      {exercise.key_phases.length > 0 && (
        <figure className="diagram-figure">
          <figcaption className="diagram-caption">
            <strong>Generic phase sketch.</strong> This illustration is a visual placeholder. It does not show
            exercise-specific technique or the suggested viewing angle.
          </figcaption>
          <div className="diagram-scroll">
            <svg
              viewBox={`0 0 ${diagramWidth} 400`}
              className="exercise-svg"
              role="img"
              aria-label={`Generic schematic illustration of ${exercise.exercise_name} phases`}
            >
              <title>{exercise.exercise_name} movement phases</title>
              <desc>
                Simplified, generic figure showing phase labels. It is illustrative only and does not depict
                exercise-specific anatomy or a verified movement.
              </desc>
              {exercise.key_phases.map((phase, index) => (
                <g key={`${phase}-${index}`} transform={`translate(${index * frameWidth}, 0)`}>
                  <text
                    x={frameWidth / 2}
                    y="40"
                    textAnchor="middle"
                    fill={COLORS.reference}
                    fontSize="14"
                    fontWeight="bold"
                  >
                    {index + 1}. {phase}
                  </text>
                  {/bottom/i.test(phase) && (
                    <line
                      x1={frameWidth / 2 - 50}
                      y1="250"
                      x2={frameWidth / 2 + 50}
                      y2="250"
                      stroke={COLORS.reference}
                      strokeDasharray="4"
                    />
                  )}
                  <FigureBuilder phaseType={`${exercise.exercise_name}-${phase}`} />
                </g>
              ))}
            </svg>
          </div>
        </figure>
      )}

      <div className="exercise-details">
        {exercise.visual_cues.length > 0 && (
          <section aria-labelledby="visual-cues-heading">
            <h3 id="visual-cues-heading">Form cues</h3>
            <ul>
              {exercise.visual_cues.map((cue, index) => <li key={`${cue}-${index}`}>{cue}</li>)}
            </ul>
          </section>
        )}
        {exercise.common_errors_to_visualize && (
          <section className="common-error" aria-labelledby="common-errors-heading">
            <h3 id="common-errors-heading">Common mistake to watch for</h3>
            <p>{exercise.common_errors_to_visualize}</p>
          </section>
        )}
      </div>
    </article>
  );
};

interface KettlebellVisualsAppProps {
  exercises?: Exercise[];
}

export default function KettlebellVisualsApp({ exercises = exercisesData }: KettlebellVisualsAppProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const currentExercise = exercises[currentExerciseIndex];
  const filteredExercises = exercises
    .map((exercise, index) => ({ exercise, index }))
    .filter(({ exercise }) => exercise.exercise_name.toLowerCase().includes(searchTerm.trim().toLowerCase()));

  const selectExercise = (index: number) => setCurrentExerciseIndex(index);
  const handlePrevious = () => {
    setCurrentExerciseIndex((index) => (index - 1 + exercises.length) % exercises.length);
  };
  const handleNext = () => {
    setCurrentExerciseIndex((index) => (index + 1) % exercises.length);
  };

  return (
    <main className="app-container">
      <header className="site-header">
        <p className="eyebrow">Movement reference</p>
        <h1>Kettlebell Exercise Library</h1>
        <p>Browse exercise phases, practical form cues, and common mistakes.</p>
      </header>

      <aside className="safety-note" aria-label="Important training note">
        <strong>Training note:</strong> These simplified diagrams and cues are general educational references,
        not personalized coaching or medical advice. Stop if you feel pain and seek guidance from a qualified
        professional when needed.
      </aside>

      {exercises.length === 0 ? (
        <p className="empty-state" role="status">No exercise guides are available right now.</p>
      ) : (
        <>
          <nav className="exercise-navigation" aria-label="Exercise navigation">
            <button type="button" onClick={handlePrevious} aria-label="Show previous exercise">
              Previous
            </button>
            <span className="exercise-count" aria-live="polite">
              Exercise {currentExerciseIndex + 1} of {exercises.length}
            </span>
            <button type="button" onClick={handleNext} aria-label="Show next exercise">
              Next
            </button>
          </nav>

          {currentExercise && <ExerciseVisualizer exercise={currentExercise} />}

          <section className="exercise-browser" aria-labelledby="exercise-browser-title">
            <div className="browser-heading">
              <div>
                <h2 id="exercise-browser-title">Browse exercises</h2>
                <p>{exercises.length} guides in the library</p>
              </div>
              <label className="search-field">
                <span>Search exercises</span>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="e.g. deadlift"
                />
              </label>
            </div>
            <div className="exercise-list">
              {filteredExercises.map(({ exercise, index }) => (
                <button
                  type="button"
                  key={`${exercise.exercise_name}-${index}`}
                  onClick={() => selectExercise(index)}
                  aria-current={index === currentExerciseIndex ? 'true' : undefined}
                >
                  {exercise.exercise_name}
                </button>
              ))}
              {filteredExercises.length === 0 && (
                <p className="empty-state" role="status">No exercises match “{searchTerm}”.</p>
              )}
            </div>
          </section>
        </>
      )}

      <footer className="site-footer">
        <p>Use these guides as a starting point, not a substitute for hands-on instruction.</p>
      </footer>
    </main>
  );
}
