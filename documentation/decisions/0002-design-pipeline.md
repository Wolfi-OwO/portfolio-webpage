# 2. Design pipeline before code

Date: 2026-10-04 · Status: accepted

Every application with a frontend goes through four stages, in order:

1. `wireframes/`: plain colourless HTML, one file per page, structure only.
2. `mockups/`: working HTML with real CSS and a few animations, art direction applied.
3. `prototypes/`: the first working version with static example data, clickable flows.
4. `application/`: production, integrated with the real backend and database.

The folders sit next to each other at the repository root so each stage stays reviewable on its own. Each stage is also published as a Claude Artifact grouped by route.
