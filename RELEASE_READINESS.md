# Release readiness

## Current assessment

The intended scope is a browser-based workout builder and interval timer, with general exercise guidance. The workout session now shows a simple looping 2D motion guide for each exercise, with a short caption and movement phases. These illustrations are basic visual references, not professionally reviewed coaching. The exercise content has not been professionally reviewed. The source was pushed to the public `WhatIsSutsDoing/suts-workout-plan` repository on the `main` branch. The site has not been deployed.

The workspace is connected to that GitHub repository. The GitHub Pages workflow started after the initial push but stopped at **Configure GitHub Pages** because Pages is not enabled for the repository yet.

## Release blockers

- [x] **Decide and state the product’s intended use.** The app is a workout builder and timer with general exercise guidance, not personalized coaching or medical advice.
- [ ] **Have exercise content reviewed by a qualified professional.** Review the form cues, common mistakes, phase names, and safety language across all exercises. Correct or remove advice that is ambiguous, unsafe, or not appropriate for the stated audience.
- [x] **Set expectations for the motion guides.** The workout flow labels each 2D animation as a motion guide and includes a caption and movement phases. Keep the qualified-professional review below as a release blocker.
- [ ] **Confirm rights and usage terms.** The repository is public. Confirm that exercise copy, artwork, fonts, names, and any future media may legally be distributed, and replace the README’s no-license notice with the intended license or usage terms.
- [ ] **Test the actual release path.** In repository settings, enable GitHub Pages with **GitHub Actions** as the source. Then confirm the workflow passes from `main` and verify the resulting URL, assets, and browser behavior. The `private: true` package setting does not make a GitHub Pages site private.

## Strongly recommended before launch

- [ ] **Expand automated tests.** Timer sequencing and pause/resume/skip/restart/deadline transitions now have tests. Add UI interaction coverage for building a workout and running a session.
- [ ] **Add accessibility checks.** Test keyboard-only use and a screen reader; check focus visibility, heading order, color contrast, zoom, and reduced-motion behavior. Consider an automated accessibility check in CI.
- [ ] **Test responsive behavior in real browsers.** Check narrow mobile, tablet, and desktop sizes, especially the exercise picker, workout list, and session timer controls.
- [ ] **Make CI reproducible.** The workflow uses `npm ci`, validates the exercise data, runs timer tests, and builds. After creating the GitHub repository, require the workflow to pass before deployment and add dependency audit checks.
- [ ] **Review deployment supply-chain controls.** The build and deploy jobs have separated permissions. Consider pinning third-party GitHub Actions to full commit SHAs and enabling dependency update/security alerts.
- [ ] **Document support and release operations.** The README now gives the supported Node version and local setup. After creating the GitHub repository, add its URL, a contact or issue-reporting route, and a brief process for updating content and publishing releases.

## Completed during this work

- [x] The dataset has 40 unique exercise names, each with four or fewer phases and populated required fields; `npm run check:data` now enforces this for future edits.
- [x] The workout session has a simple SVG motion guide mapped to all 40 exercises, with captions, movement phases, pause/resume behavior, and reduced-motion support.
- [x] The app supports exercise selection, ordering, work/rest settings, rounds, estimated duration, and a guided interval session.
- [x] The timer calculates from deadlines and catches up across elapsed intervals after delayed updates.
- [x] The Pages workflow uses `npm ci`, validates the data, runs timer tests, and limits write permissions to the deploy job.
- [x] The initial source commit was pushed to the public `WhatIsSutsDoing/suts-workout-plan` repository on `main` (`5fc7435`).
- [x] `npm run check:data`, `npm test`, and `npm run build` pass in this workspace.
- [ ] Run a clean lockfile install and dependency audit before publication.

## Release smoke-test checklist

Before each public release:

1. Install from the lockfile in a clean environment.
2. Run the production build, tests, and dependency audit.
3. Check the exercise dataset for missing/duplicate names and required content.
4. Test workout building, timer transitions and controls, keyboard use, and mobile layout.
5. Inspect the built app at the deployment URL, including asset loading and refresh behavior.
6. Confirm the published content and diagrams match the product’s stated limitations.
