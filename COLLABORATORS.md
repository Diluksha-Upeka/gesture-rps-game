# Collaboration Guide

Welcome to the Gesture Recognition Rock Paper Scissors project! This guide documents how the team works together on code, assets, and planning.

## Team Onboarding Checklist
- [ ] Clone the repository and run through the Quick Start steps in `README.md`.
- [ ] Verify MediaPipe works in your browser (Chrome recommended) and confirm webcam permissions.
- [ ] Join the shared communication channel (Slack/Teams) and add your availability to the shared calendar.
- [ ] Review this guide and the open issues board before starting your first task.

## Branch & Commit Strategy
- Create feature branches from `main` using the pattern `feature/short-description`, `bugfix/short-description`, or `docs/short-description`.
- Keep commits focused and descriptive (e.g., `Add evil AI taunt sound` or `Fix thumb detection jitter`).
- Rebase or merge `main` before opening a pull request to minimize conflicts.

## Pull Request Expectations
- Include screenshots or short clips for UI/animation changes.
- List manual testing steps (webcam detection, countdown flow, audio playback) to help reviewers reproduce.
- Tag at least one teammate for review; aim for < 48 hour turnaround on reviews.
- Use draft PRs to collaborate early on larger features like new AI modes or UX overhauls.

## Asset Contributions
- Place new icons, sprites, or videos inside `assets/` and keep raw source files in `assets/source/` (create if needed).
- Document licensing info for third-party assets inside `assets/ATTRIBUTION.md`.
- Compress images and audio to maintain fast load times; share lossless masters via cloud storage when required.

## Coding Standards
- Vanilla JS only (ES modules allowed). Avoid introducing frameworks without team approval.
- Keep functions focused and add short comments only when logic is non-obvious.
- Prefer utility helpers for shared logic (e.g., new AI behaviours) and store them in `scripts/` if we expand beyond a single file.
- Run `npm run lint` once a lint config is added; until then, rely on editor ESLint/prettier if available.

## Testing & QA
- Smoke test webcam detection, countdown, and AI result after every major change.
- Use the debug panel output to confirm finger-state logic when tweaking thresholds.
- Record issues in GitHub Issues with reproduction steps, expected vs actual results, and device/browser details.

## Communication Rhythm
- Stand-up sync: 15 minutes twice a week to review blockers.
- Weekly playtest: gather as a group to demo new features and collect feedback.
- Retro notes: capture wins, challenges, and action items in the shared document at sprint boundaries.

## Ideas Backlog
Capture feature ideas, mood board references, and AI personality suggestions in the GitHub Discussions "Ideas" category so everyone can comment asynchronously.

---
Need changes to this guide? Open a PR against `docs/collaboration` or ping the team in chat for a quick alignment.
