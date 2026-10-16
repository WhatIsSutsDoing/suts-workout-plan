import { readFile } from 'node:fs/promises';

const dataUrl = new URL('../src/data/kettlebellExercises.json', import.meta.url);
const rawData = await readFile(dataUrl, 'utf8');
let exercises;

try {
  exercises = JSON.parse(rawData);
} catch (error) {
  console.error(`Exercise data is not valid JSON: ${error.message}`);
  process.exit(1);
}

const errors = [];
const requiredTextFields = [
  'exercise_name',
  'view_angle',
  'common_errors_to_visualize',
  'svg_construction_notes',
];

if (!Array.isArray(exercises) || exercises.length === 0) {
  console.error('Exercise data must be a non-empty JSON array.');
  process.exit(1);
}

const seenNames = new Set();

exercises.forEach((exercise, index) => {
  const record = index + 1;
  if (!exercise || typeof exercise !== 'object' || Array.isArray(exercise)) {
    errors.push(`Record ${record} must be an object.`);
    return;
  }

  for (const field of requiredTextFields) {
    if (typeof exercise[field] !== 'string' || exercise[field].trim() === '') {
      errors.push(`Record ${record} (${exercise.exercise_name || 'unnamed'}) needs a non-empty ${field}.`);
    }
  }

  if (typeof exercise.exercise_name === 'string' && exercise.exercise_name.trim()) {
    const normalizedName = exercise.exercise_name.trim().toLocaleLowerCase();
    if (seenNames.has(normalizedName)) {
      errors.push(`Record ${record} repeats exercise name “${exercise.exercise_name.trim()}”.`);
    }
    seenNames.add(normalizedName);
  }

  for (const field of ['key_phases', 'visual_cues']) {
    if (!Array.isArray(exercise[field]) || exercise[field].length === 0) {
      errors.push(`Record ${record} (${exercise.exercise_name || 'unnamed'}) needs at least one ${field} entry.`);
      continue;
    }

    exercise[field].forEach((value, valueIndex) => {
      if (typeof value !== 'string' || value.trim() === '') {
        errors.push(`Record ${record} (${exercise.exercise_name || 'unnamed'}) has an empty or invalid ${field} entry at position ${valueIndex + 1}.`);
      }
    });
  }

  if (Array.isArray(exercise.key_phases) && exercise.key_phases.length > 4) {
    errors.push(`Record ${record} (${exercise.exercise_name || 'unnamed'}) has more than four key phases.`);
  }
});

if (errors.length > 0) {
  console.error(`Exercise data validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Exercise data is valid (${exercises.length} unique records).`);
