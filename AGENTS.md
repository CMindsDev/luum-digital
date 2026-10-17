# Repository Guidelines

## Project Structure & Module Organization

Luum Digital is a React/TypeScript demonstration of unified municipal services for Mérida.

- `src/app/`: routing, providers, application shell, and UI stores.
- `src/features/`: feature screens; avoid importing another feature's internals.
- `src/design-system/` and `src/components/`: tokens, accessible primitives, and shared components.
- `src/domain/`: pure business rules. `src/services/`: repository contracts, adapters, and TanStack Query hooks; components access repositories through these hooks.
- `server/`: Hono backend and provider credentials. `shared/asistente/`: browser/server contracts.
- `src/data/` and `data/sources/`: demo seeds and catalog sources. `public/`: assets. `e2e/`: browser tests; unit tests sit alongside source files.

## Build, Test, and Development Commands

Use Node `24.21.0` from `.nvmrc`. Run commands from this directory:

- `npm ci`: install locked dependencies.
- `npm run dev`: start the backend and Vite together.
- `npm run build`: type-check and generate the production build.
- `npm run preview`: serve the built frontend locally.
- `npm run check`: run ESLint, type-checking, unit tests, and build.
- `npm run test:e2e`: run Playwright against an automatically built preview.
- `npm run catalogo:importar`: regenerate the service catalog after source changes.

## Coding Style & Naming Conventions

Follow existing two-space indentation, double quotes, and semicolons. Use strict TypeScript, type-only imports, and no `any` or `@ts-ignore`. Name components in PascalCase and hooks `useSomething`; use Spanish domain vocabulary and Mexican Spanish UI text. Use `@/` and `@shared/` aliases. Style with Tailwind design tokens and accessible controls. ESLint enforces TypeScript and React rules; no standalone formatter is configured.

## Testing Guidelines

Use Vitest and Testing Library for `*.test.ts`/`*.test.tsx`; run `npm test` or `npm run test:watch`. Cover domain rules, demo adapters, forms, dialogs, and focus behavior. Playwright uses `e2e/*.spec.ts` across responsive and reduced-motion configurations. Keep browser tests independent of external services. No numeric coverage threshold is configured. Report only checks actually executed.

## Commit & Pull Request Guidelines

History currently contains one descriptive Spanish commit; no prefix convention is established. Write concise, action-oriented subjects. PRs should explain behavior changes, link applicable issues, list validation results, and include screenshots for UI changes.

## Demo Safety & Configuration

Keep demonstration labels and simulated transactions explicit. Never collect real identity documents or payment details. Keep secrets server-side, outside `VITE_*` variables. Never persist or log wellbeing conversations. Assistant actions must use the shared allowlist and require user confirmation. Unsupported real integrations must fail explicitly.
