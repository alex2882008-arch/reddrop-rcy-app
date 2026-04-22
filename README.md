# RedDrop RCY App

<p align="center">
  <img src="docs/readme/banner.svg" alt="RedDrop RCY banner" width="100%" />
</p>

<p align="center">
  A minimal, modern blood donor management platform for Red Crescent youth teams.
</p>

<p align="center">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square" />
  <img alt="React" src="https://img.shields.io/badge/React-19.x-149ECA?style=flat-square" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Edge%20Functions-3FCF8E?style=flat-square" />
  <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-111111?style=flat-square" />
</p>

## Why this project

RedDrop RCY helps teams manage:
- donor profiles and verification
- emergency blood requests
- donation camps and campaign activity
- admin alerts and lightweight analytics

The goal is speed and clarity: quick actions, low friction, and reliable updates.

## Core features

- Auth with role-aware flows
- Donor directory with filtering and visibility controls
- Emergency request lifecycle management
- Camp create/update/delete with notifications
- Activity tracking and admin console actions
- Supabase Edge Function backend with KV-style storage helpers

## Screens & branding

- Share graphic: `public/redcrescent-share.svg`
- Project banner: `docs/readme/banner.svg`

## Quick start

```bash
pnpm install
pnpm dev
```

Production build:

```bash
pnpm build
```

## Project structure

```text
src/
  app/
    components/
    context/
    pages/
    utils/
supabase/
  functions/server/
  migrations/
```

## Roadmap

See the full plan in `ROADMAP.md`.

Highlights:
- stronger notification delivery guarantees
- improved dashboard performance and chunk splitting
- richer role permissions and audit tools
- deployment + ops playbook

## Design notes

Minimalistic by design:
- clean spacing and low-noise hierarchy
- limited color accents with high readability
- clear action states over heavy decoration

More details: `docs/DESIGN.md`.

## License

This project is licensed under the MIT License. See `LICENSE`.
