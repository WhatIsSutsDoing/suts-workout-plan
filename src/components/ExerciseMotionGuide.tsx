import { useEffect, useRef, useState } from 'react';

type Exercise = { exercise_name: string; key_phases: string[] };

type Point = { x: number; y: number };
type Pose = {
  head: Point;
  shoulder: Point;
  hip: Point;
  elbowL: Point;
  elbowR: Point;
  wristL: Point;
  wristR: Point;
  kneeL: Point;
  kneeR: Point;
  ankleL: Point;
  ankleR: Point;
  bell: Point | null;
};

type Motion = { poses: Pose[]; durationMs: number; caption: string; mode?: 'loop' | 'hold'; floorY?: number };

const standing: Pose = {
  head: { x: 120, y: 31 },
  shoulder: { x: 120, y: 60 },
  hip: { x: 120, y: 112 },
  elbowL: { x: 100, y: 80 },
  elbowR: { x: 140, y: 80 },
  wristL: { x: 111, y: 88 },
  wristR: { x: 129, y: 88 },
  kneeL: { x: 105, y: 149 },
  kneeR: { x: 135, y: 149 },
  ankleL: { x: 101, y: 190 },
  ankleR: { x: 139, y: 190 },
  bell: { x: 120, y: 89 },
};

const squatBottom: Pose = {
  ...standing,
  head: { x: 120, y: 54 },
  shoulder: { x: 120, y: 82 },
  hip: { x: 120, y: 130 },
  kneeL: { x: 83, y: 153 },
  kneeR: { x: 157, y: 153 },
  ankleL: { x: 101, y: 190 },
  ankleR: { x: 139, y: 190 },
  elbowL: { x: 100, y: 102 },
  elbowR: { x: 140, y: 102 },
  wristL: { x: 111, y: 110 },
  wristR: { x: 129, y: 110 },
  bell: { x: 120, y: 111 },
};

const deadliftHinge: Pose = {
  head: { x: 169, y: 75 },
  shoulder: { x: 158, y: 103 },
  hip: { x: 111, y: 108 },
  elbowL: { x: 151, y: 130 },
  elbowR: { x: 147, y: 132 },
  wristL: { x: 145, y: 166 },
  wristR: { x: 139, y: 166 },
  kneeL: { x: 104, y: 150 },
  kneeR: { x: 132, y: 150 },
  ankleL: { x: 100, y: 190 },
  ankleR: { x: 140, y: 190 },
  bell: { x: 142, y: 177 },
};

const deadliftTop: Pose = {
  ...standing,
  elbowL: { x: 111, y: 90 },
  elbowR: { x: 129, y: 90 },
  wristL: { x: 114, y: 119 },
  wristR: { x: 126, y: 119 },
  bell: { x: 120, y: 133 },
};

const swingTop: Pose = {
  ...standing,
  elbowL: { x: 148, y: 60 },
  elbowR: { x: 149, y: 67 },
  wristL: { x: 177, y: 60 },
  wristR: { x: 178, y: 67 },
  bell: { x: 188, y: 65 },
};

const swingHinge: Pose = {
  head: { x: 155, y: 76 },
  shoulder: { x: 145, y: 103 },
  hip: { x: 111, y: 117 },
  elbowL: { x: 132, y: 132 },
  elbowR: { x: 129, y: 137 },
  wristL: { x: 151, y: 154 },
  wristR: { x: 147, y: 159 },
  kneeL: { x: 98, y: 151 },
  kneeR: { x: 130, y: 151 },
  ankleL: { x: 100, y: 190 },
  ankleR: { x: 140, y: 190 },
  bell: { x: 158, y: 169 },
};

const pose = (base: Pose, changes: Partial<Pose>): Pose => ({ ...base, ...changes });
const neutralStanding = pose(standing, {
  elbowL: { x: 105, y: 91 }, elbowR: { x: 135, y: 91 },
  wristL: { x: 105, y: 121 }, wristR: { x: 135, y: 121 }, bell: { x: 120, y: 131 },
});
const bodyweightStanding = pose(standing, { bell: null });
const bodyweightSquatBottom = pose(squatBottom, { bell: null });
const sumoSquatBottom = pose(squatBottom, {
  kneeL: { x: 66, y: 153 }, kneeR: { x: 174, y: 153 },
  ankleL: { x: 87, y: 190 }, ankleR: { x: 153, y: 190 },
});
const lungeBottom = pose(standing, {
  head: { x: 120, y: 48 }, shoulder: { x: 120, y: 76 }, hip: { x: 120, y: 126 },
  kneeL: { x: 91, y: 150 }, ankleL: { x: 88, y: 190 },
  kneeR: { x: 148, y: 139 }, ankleR: { x: 179, y: 183 },
  elbowL: { x: 100, y: 96 }, elbowR: { x: 140, y: 96 },
  wristL: { x: 111, y: 104 }, wristR: { x: 129, y: 104 }, bell: { x: 120, y: 105 },
});
const hingeLongLegs = pose(deadliftHinge, {
  kneeL: { x: 105, y: 137 }, kneeR: { x: 132, y: 137 },
  wristL: { x: 143, y: 154 }, wristR: { x: 138, y: 154 }, bell: { x: 141, y: 166 },
});
const suitcaseHinge = pose(deadliftHinge, {
  elbowL: { x: 116, y: 132 }, elbowR: { x: 120, y: 133 },
  wristL: { x: 108, y: 162 }, wristR: { x: 122, y: 162 }, bell: { x: 107, y: 174 },
});
const rowHinge = pose(deadliftHinge, {
  elbowL: { x: 126, y: 85 }, elbowR: { x: 122, y: 88 },
  wristL: { x: 136, y: 111 }, wristR: { x: 131, y: 115 }, bell: { x: 137, y: 119 },
});
const lyingPressDown: Pose = {
  head: { x: 48, y: 155 }, shoulder: { x: 78, y: 155 }, hip: { x: 145, y: 158 },
  elbowL: { x: 82, y: 137 }, elbowR: { x: 84, y: 143 },
  wristL: { x: 105, y: 132 }, wristR: { x: 107, y: 138 },
  kneeL: { x: 162, y: 139 }, kneeR: { x: 165, y: 151 },
  ankleL: { x: 199, y: 139 }, ankleR: { x: 201, y: 151 }, bell: { x: 107, y: 123 },
};
const lyingPressUp = pose(lyingPressDown, {
  elbowL: { x: 83, y: 117 }, elbowR: { x: 86, y: 122 },
  wristL: { x: 97, y: 85 }, wristR: { x: 101, y: 89 }, bell: { x: 99, y: 76 },
});
const pressOverhead = pose(standing, {
  elbowL: { x: 105, y: 45 }, elbowR: { x: 135, y: 45 },
  wristL: { x: 112, y: 20 }, wristR: { x: 128, y: 20 }, bell: { x: 120, y: 16 },
});
const highPull = pose(neutralStanding, {
  elbowL: { x: 91, y: 75 }, elbowR: { x: 149, y: 75 },
  wristL: { x: 108, y: 85 }, wristR: { x: 132, y: 85 }, bell: { x: 120, y: 94 },
});
const curlTop = pose(neutralStanding, {
  elbowL: { x: 105, y: 93 }, elbowR: { x: 135, y: 93 },
  wristL: { x: 111, y: 67 }, wristR: { x: 129, y: 67 }, bell: { x: 120, y: 60 },
});
const curlBottom = pose(neutralStanding, { bell: { x: 120, y: 137 } });
const suitcaseHold = pose(neutralStanding, {
  elbowL: { x: 105, y: 94 }, wristL: { x: 105, y: 124 }, bell: { x: 104, y: 137 },
  elbowR: { x: 135, y: 91 }, wristR: { x: 135, y: 121 },
});
const pushUpTop: Pose = {
  head: { x: 45, y: 110 }, shoulder: { x: 75, y: 116 }, hip: { x: 136, y: 133 },
  elbowL: { x: 84, y: 128 }, elbowR: { x: 87, y: 131 },
  wristL: { x: 106, y: 145 }, wristR: { x: 109, y: 148 },
  kneeL: { x: 163, y: 145 }, kneeR: { x: 165, y: 149 },
  ankleL: { x: 205, y: 151 }, ankleR: { x: 207, y: 155 }, bell: null,
};
const pushUpBottom = pose(pushUpTop, {
  head: { x: 47, y: 126 }, shoulder: { x: 77, y: 130 }, hip: { x: 137, y: 141 },
  elbowL: { x: 91, y: 140 }, elbowR: { x: 94, y: 143 },
  wristL: { x: 111, y: 149 }, wristR: { x: 113, y: 152 },
});
const kettlebellPushUpTop = pose(pushUpTop, { bell: { x: 105, y: 149 } });
const deadbug: Pose = {
  head: { x: 49, y: 158 }, shoulder: { x: 79, y: 158 }, hip: { x: 145, y: 158 },
  elbowL: { x: 79, y: 130 }, elbowR: { x: 89, y: 128 },
  wristL: { x: 83, y: 102 }, wristR: { x: 93, y: 100 },
  kneeL: { x: 148, y: 126 }, kneeR: { x: 169, y: 126 },
  ankleL: { x: 143, y: 92 }, ankleR: { x: 177, y: 92 }, bell: { x: 88, y: 91 },
};
const deadbugLeftExtended = pose(deadbug, { ankleL: { x: 207, y: 169 } });
const deadbugRightExtended = pose(deadbug, { ankleR: { x: 207, y: 169 } });
const haloLeft = pose(standing, { bell: { x: 91, y: 36 } });
const haloRight = pose(standing, { bell: { x: 149, y: 36 } });
const cleanRack = pose(standing, {
  elbowL: { x: 102, y: 87 }, elbowR: { x: 140, y: 87 },
  wristL: { x: 112, y: 70 }, wristR: { x: 130, y: 70 }, bell: { x: 121, y: 69 },
});
const tricepsBent = pose(pressOverhead, {
  elbowL: { x: 101, y: 52 }, elbowR: { x: 139, y: 52 },
  wristL: { x: 116, y: 64 }, wristR: { x: 124, y: 64 }, bell: { x: 120, y: 76 },
});
const MOTIONS: Record<string, Motion> = {};

function addMotion(names: string[], poses: Pose[], caption: string, durationMs = 3000, mode: 'loop' | 'hold' = 'loop') {
  for (const name of names) MOTIONS[name] = { poses, durationMs, caption, mode };
}

addMotion(['Bodyweight squat'], [bodyweightStanding, bodyweightSquatBottom, bodyweightSquatBottom, bodyweightStanding, bodyweightStanding], 'Sit between your hips with heels down, then stand tall.');
addMotion(['Kettlebell goblet squat'], [standing, squatBottom, squatBottom, standing, standing], 'Keep the bell at your chest, sit between your hips, then stand tall.');
addMotion(['Sumo squat'], [bodyweightStanding, sumoSquatBottom, sumoSquatBottom, bodyweightStanding, bodyweightStanding], 'Use a wide stance, bend your knees out, then stand tall.');
addMotion(['Kettlebell reverse lunge', 'Front-rack reverse lunge'], [standing, lungeBottom, lungeBottom, standing, standing], 'Step back into a controlled lunge, then drive through the front foot.');
addMotion(['Kettlebell deadlift'], [deadliftTop, deadliftHinge, deadliftHinge, deadliftTop, deadliftTop], 'Hinge at the hips with a long back, then drive the floor away to stand.');
addMotion(['Sumo deadlift'], [deadliftTop, pose(deadliftHinge, { kneeL: { x: 83, y: 151 }, kneeR: { x: 143, y: 151 }, ankleL: { x: 76, y: 190 }, ankleR: { x: 163, y: 190 } }), pose(deadliftHinge, { kneeL: { x: 83, y: 151 }, kneeR: { x: 143, y: 151 }, ankleL: { x: 76, y: 190 }, ankleR: { x: 163, y: 190 } }), deadliftTop], 'Hinge between a wide stance, keep the bell close, and stand by driving through the feet.');
addMotion(['Suitcase deadlift'], [suitcaseHold, suitcaseHinge, suitcaseHinge, suitcaseHold], 'Keep the bell beside one leg and resist leaning as you hinge and stand.');
addMotion(['Kettlebell Romanian deadlift'], [deadliftTop, hingeLongLegs, hingeLongLegs, deadliftTop], 'Push your hips back with soft knees, then stand by bringing the hips forward.');
addMotion(['Supported single-arm row', 'Bent-over single-arm row', 'Two-handed kettlebell row'], [deadliftHinge, rowHinge, rowHinge, deadliftHinge], 'Hold a steady hip hinge and draw the bell toward your hip, then lower it.');
addMotion(['Kettlebell floor press', 'Two-handed kettlebell floor press'], [lyingPressDown, lyingPressUp, lyingPressUp, lyingPressDown], 'Press the bell above your chest, then lower your upper arm under control.');
addMotion(['Standing single-arm overhead press', 'Two-handed overhead press'], [standing, pressOverhead, pressOverhead, standing], 'Press overhead while keeping your ribs stacked over your hips.');
addMotion(['Suitcase hold'], [suitcaseHold, suitcaseHold, suitcaseHold], 'Stand tall and keep your shoulders level while holding the bell at your side.', 2400, 'hold');
addMotion(['Suitcase march'], [suitcaseHold, pose(suitcaseHold, { kneeL: { x: 93, y: 126 }, ankleL: { x: 86, y: 163 } }), suitcaseHold, pose(suitcaseHold, { kneeR: { x: 157, y: 126 }, ankleR: { x: 164, y: 163 } }), suitcaseHold], 'March slowly in place and keep your trunk upright against the side load.');
addMotion(['Kettlebell halo'], [standing, haloLeft, pose(standing, { bell: { x: 120, y: 25 } }), haloRight, standing], 'Circle the bell around your head while keeping your ribs down.');
addMotion(['Dead bug with kettlebell hold'], [deadbug, deadbugLeftExtended, deadbug, deadbugRightExtended, deadbug], 'Keep the bell steady over your chest while slowly extending one leg at a time.');
addMotion(['Two-handed kettlebell swing', 'Dead-stop swing'], [swingTop, swingHinge, swingHinge, swingTop, swingTop], 'Hinge the bell back, then stand tall as it swings forward to chest height.', 2400);
addMotion(['Hand-to-hand swing'], [swingTop, pose(swingHinge, { bell: { x: 154, y: 169 } }), pose(swingTop, { bell: { x: 194, y: 65 } }), pose(swingHinge, { bell: { x: 154, y: 169 } }), swingTop], 'Hinge the bell back and guide it forward as you stand; switch hands smoothly.');
addMotion(['Single-arm swing'], [swingTop, pose(swingHinge, { wristL: { x: 150, y: 155 }, wristR: { x: 144, y: 161 } }), pose(swingTop, { wristL: { x: 187, y: 60 }, wristR: { x: 147, y: 77 } }), swingTop], 'Drive from the hips and let the working arm stay relaxed as the bell floats.');
addMotion(['Kettlebell clean', 'Clean to front-rack hold'], [deadliftHinge, cleanRack, cleanRack, deadliftHinge], 'Keep the bell close as you guide it from the hinge into a quiet rack.');
addMotion(['Kettlebell push press'], [cleanRack, pose(cleanRack, { kneeL: { x: 100, y: 158 }, kneeR: { x: 140, y: 158 }, hip: { x: 120, y: 119 } }), pressOverhead, cleanRack], 'Dip slightly, drive through your legs, and finish with the bell overhead.');
addMotion(['Goblet squat to press', 'Kettlebell thruster'], [cleanRack, squatBottom, pressOverhead, cleanRack], 'Squat with the bell racked, stand strongly, then press overhead.');
addMotion(['Clean and thruster'], [deadliftHinge, cleanRack, squatBottom, pressOverhead, cleanRack], 'Clean the bell to the rack, squat, then drive up into the overhead press.');
addMotion(['Plank kettlebell drag'], [kettlebellPushUpTop, pose(kettlebellPushUpTop, { bell: { x: 137, y: 135 }, hip: { x: 137, y: 133 } }), kettlebellPushUpTop], 'Hold a steady plank and drag the bell across without rotating your hips.');
addMotion(['Clean and press'], [deadliftHinge, cleanRack, pressOverhead, cleanRack], 'Clean the bell to your shoulder, press overhead, then return it to the rack.');
addMotion(['Clean and reverse lunge'], [deadliftHinge, cleanRack, lungeBottom, cleanRack], 'Clean to the rack, step back into a lunge, then return with control.');
addMotion(['Single-arm kettlebell snatch'], [deadliftHinge, swingHinge, pressOverhead, deadliftHinge], 'Drive from the hips and guide the bell close to a stable overhead lockout.');
addMotion(['Kettlebell high pull'], [swingHinge, highPull, highPull, swingHinge], 'Drive the hips and lead the close bell path with your elbow.');
addMotion(['Push-up'], [pushUpTop, pushUpBottom, pushUpBottom, pushUpTop], 'Keep your body in one line as you lower your chest and press back up.');
addMotion(['Kettlebell biceps curl'], [curlBottom, curlTop, curlTop, curlBottom], 'Keep your upper arms by your sides and curl without swinging your torso.');
addMotion(['Triceps extension'], [pressOverhead, tricepsBent, pressOverhead], 'Keep your upper arms steady and bend and straighten at the elbows.');
addMotion(['Kettlebell push-up'], [kettlebellPushUpTop, pose(pushUpBottom, { bell: { x: 105, y: 141 } }), pose(pushUpBottom, { bell: { x: 105, y: 141 } }), kettlebellPushUpTop], 'Use stable handles and keep your body in a straight line as you lower and press.');
addMotion(['Squat with arm curl'], [neutralStanding, pose(neutralStanding, { kneeL: { x: 83, y: 153 }, kneeR: { x: 157, y: 153 }, hip: { x: 120, y: 130 } }), curlTop, neutralStanding], 'Squat with the bells low; stand tall before curling them toward your shoulders.');

MOTIONS['Push-up'].floorY = 157;
MOTIONS['Kettlebell push-up'].floorY = 157;
MOTIONS['Plank kettlebell drag'].floorY = 157;
MOTIONS['Kettlebell floor press'].floorY = 183;
MOTIONS['Two-handed kettlebell floor press'].floorY = 183;
MOTIONS['Dead bug with kettlebell hold'].floorY = 183;

export function supportsExerciseMotion(exerciseName: string) {
  return exerciseName in MOTIONS;
}

function interpolatePoint(from: Point, to: Point, progress: number): Point {
  return {
    x: from.x + (to.x - from.x) * progress,
    y: from.y + (to.y - from.y) * progress,
  };
}

function interpolatePose(from: Pose, to: Pose, progress: number): Pose {
  const pointKeys = (Object.keys(from) as Array<keyof Pose>).filter((key) => key !== 'bell') as Array<Exclude<keyof Pose, 'bell'>>;
  const interpolatedPoints = Object.fromEntries(
    pointKeys.map((key) => [key, interpolatePoint(from[key], to[key], progress)]),
  );
  const bell = from.bell && to.bell
    ? interpolatePoint(from.bell, to.bell, progress)
    : progress < 0.5 ? from.bell : to.bell;
  return { ...from, ...interpolatedPoints, bell } as Pose;
}

function poseAt(motion: Motion, elapsedMs: number): Pose {
  const cycleProgress = (elapsedMs % motion.durationMs) / motion.durationMs;
  const scaledProgress = cycleProgress * (motion.poses.length - 1);
  const index = Math.min(motion.poses.length - 2, Math.floor(scaledProgress));
  const segmentProgress = scaledProgress - index;
  const easedProgress = segmentProgress * segmentProgress * (3 - 2 * segmentProgress);
  return interpolatePose(motion.poses[index], motion.poses[index + 1], easedProgress);
}

function Joint({ point, radius = 4 }: { point: Point; radius?: number }) {
  return <circle cx={point.x} cy={point.y} r={radius} className="motion-joint" />;
}

function Limb({ from, to }: { from: Point; to: Point }) {
  return <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} className="motion-limb" />;
}

export default function ExerciseMotionGuide({ exercise, isPlaying }: { exercise: Exercise; isPlaying: boolean }) {
  const motion = MOTIONS[exercise.exercise_name];
  const [elapsedMs, setElapsedMs] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const elapsedRef = useRef(0);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(preference.matches);
    updatePreference();
    preference.addEventListener('change', updatePreference);
    return () => preference.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    if (!isPlaying || reducedMotion || motion.mode === 'hold') return;

    let frameId = 0;
    let lastFrame = performance.now();
    let lastRender = lastFrame;
    const animate = (now: number) => {
      elapsedRef.current += Math.min(now - lastFrame, 100);
      lastFrame = now;
      if (now - lastRender >= 33) {
        setElapsedMs(elapsedRef.current);
        lastRender = now;
      }
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, motion.mode, reducedMotion]);

  const pose = poseAt(motion, reducedMotion ? 0 : elapsedMs);

  return (
    <figure className="exercise-motion-guide" aria-label={`Motion guide for ${exercise.exercise_name}`}>
      <svg viewBox="0 0 240 210" role="img" aria-labelledby="motion-guide-title motion-guide-description">
        <title id="motion-guide-title">{exercise.exercise_name} movement</title>
        <desc id="motion-guide-description">
          {reducedMotion ? 'Still illustration. ' : 'Looping movement illustration. '}{motion.caption}
        </desc>
        <path d={`M32 ${motion.floorY ?? 191} H208`} className="motion-floor" />
        {exercise.exercise_name.includes('swing') && (
          <path d="M153 162 Q205 119 190 70" className="motion-path" />
        )}
        <Limb from={pose.hip} to={pose.shoulder} />
        <Limb from={pose.shoulder} to={pose.elbowL} />
        <Limb from={pose.elbowL} to={pose.wristL} />
        <Limb from={pose.shoulder} to={pose.elbowR} />
        <Limb from={pose.elbowR} to={pose.wristR} />
        <Limb from={pose.hip} to={pose.kneeL} />
        <Limb from={pose.kneeL} to={pose.ankleL} />
        <Limb from={pose.hip} to={pose.kneeR} />
        <Limb from={pose.kneeR} to={pose.ankleR} />
        <Joint point={pose.head} radius={11} />
        <Joint point={pose.shoulder} />
        <Joint point={pose.hip} />
        <Joint point={pose.elbowL} />
        <Joint point={pose.elbowR} />
        <Joint point={pose.kneeL} />
        <Joint point={pose.kneeR} />
        {pose.bell && (
          <g transform={`translate(${pose.bell.x} ${pose.bell.y})`} className="motion-bell">
            <path d="M-5 -5 V-10 A5 5 0 0 1 5 -10 V-5" />
            <circle cy="1" r="8" />
          </g>
        )}
      </svg>
    </figure>
  );
}

export function ExerciseMotionInfo({ exercise }: { exercise: Exercise }) {
  const motion = MOTIONS[exercise.exercise_name];
  return (
    <div className="exercise-motion-info">
      <p>{motion.caption}</p>
      <p className="motion-phase-list">{exercise.key_phases.join(' → ')}</p>
      <small>{motion.mode === 'hold' ? 'Hold during the work interval' : 'Motion repeats during the work interval'}</small>
    </div>
  );
}
