# Suts Workout Plan

A browser-based kettlebell workout builder and interval timer, with an exercise guide for general cues and common mistakes. Built with React, TypeScript, and Vite.

## Features

- Search and add exercises from a 40-exercise library
- Arrange, reorder, and remove exercises in a workout circuit
- Choose a 40/20 or 45/15 work/rest preset and set 5–50 rounds
- See an estimated workout duration before starting
- Follow a guided session with lightweight motion guides for all exercises
- Hear the same tone at 3, 2, and 1 seconds before each interval ends, with a higher tone at workout and interval boundaries
- See the movement first, then the timer and exercise guidance during the session
- Pause, resume, skip an interval, restart, or end the session
- Mute or enable the bell during a session
- Keep the timer on schedule after delayed browser updates by calculating from interval deadlines

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Build tool and dev server
- **React DOM** - Rendering engine

## Getting Started

### Prerequisites

- Node.js 22.12 or newer (the GitHub Actions workflow uses Node.js 24)
- npm or yarn

### Installation

1. From the project directory, install the locked dependencies:
```bash
npm ci
```

2. Start the development server:
```bash
npm run dev
```

3. Open the local URL shown in your terminal (usually `http://localhost:5173`).

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build production-ready bundle |
| `npm run preview` | Preview production build locally |
| `npm run check:data` | Validate the exercise data structure and required content |
| `npm test` | Test workout interval sequencing and timer transitions |

## Project Structure

```
kettlebell-app/
├── src/
│   ├── components/
│   │   ├── KettlebellWorkoutApp.tsx # Workout builder and guided session UI
│   │   └── ExerciseMotionGuide.tsx  # Lightweight exercise motion guides
│   ├── data/
│   │   └── kettlebellExercises.json # Exercise database
│   ├── workoutEngine.mjs            # Interval sequence and timer logic
│   ├── workoutEngine.test.mjs       # Timer logic tests
│   ├── main.tsx                     # Application entry point
│   └── styles.css                   # Responsive app styling
├── index.html                       # HTML template
├── package.json                     # Dependencies & scripts
├── tsconfig.json                    # TypeScript configuration
├── tsconfig.node.json               # Node TypeScript config
└── vite.config.ts                   # Vite configuration
```

## Exercise Data Format

Each exercise in the database includes:

```json
{
  "exercise_name": "Exercise Name",
  "view_angle": "Recommended viewing angle",
  "key_phases": ["Phase 1", "Phase 2", "Phase 3"],
  "visual_cues": ["Cue 1", "Cue 2", "Cue 3"],
  "common_errors_to_visualize": "Description of common mistake",
  "svg_construction_notes": "Notes for creating visual diagrams"
}
```

## Usage

Build a circuit by adding exercises, arranging their order, and setting work time, rest time, and rounds. One round is one pass through the selected exercise list. The session begins on a ready screen; start the timer when you are set. A rest interval follows each work interval except the final one. The timer uses clock deadlines so it can catch up if the browser pauses screen updates in the background.

Exercise cues and simple 2D motion guides are general educational references, not personalized coaching or medical advice. Stop if you feel pain and seek guidance from a qualified professional when needed. The content and motion guides have not yet been reviewed by a qualified kettlebell professional.

## Building for Production

```bash
npm run build
```

This creates an optimized production bundle in the `dist/` directory.

To preview the production build:

```bash
npm run preview
```

## GitHub Pages

The workflow in `.github/workflows/deploy.yml` validates the exercise data, runs the timer tests, builds the app, and deploys the `dist/` output when changes are pushed to `main`. In the repository settings, choose **Settings → Pages → Build and deployment → Source → GitHub Actions**. The site is publicly accessible once deployed.

## License and redistribution

No license has been selected yet. Before making this project public or distributing it, confirm that you have the right to share the code and all exercise content, choose a license, and replace this notice with the final terms.

## Version

1.0.0
