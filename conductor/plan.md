# Cross-Platform Monorepo Initialization Plan

## Background & Motivation
The objective is to initialize a unified multi-platform monorepo from scratch using Bun workspaces, targeting Mobile (Expo), Desktop Native, Web/Tauri, and Terminal (TUI) interfaces, all sharing a centralized core domain logic package.

## Scope & Impact
- **Root Workspace:** Configuration of Bun workspaces for `apps/*` and `packages/*`.
- **Shared Package:** `packages/shared` containing reusable UI components, layout views, services, store contexts, and utilities.
- **Apps Scaffolding:** Initializing placeholder configurations for `mobile`, `desktop-native`, `web-tauri`, and `tui`.
- **Core Interfaces:** Creating state mock interfaces (`audioContext.tsx`) and headless platform-agnostic service shells (`audioEngine.ts`).

## Proposed Solution
We will create the directory structure and specific files exactly as requested:

1. **Root Config:** Create `package.json` with the specified workspaces and scripts.
2. **Shared Package:** 
   - Create `packages/shared/package.json` with React, React Native, and Zustand dependencies.
   - Scaffold the `src/` directory (components, screens, services, store, utils).
   - Write mock state interfaces in `store/audioContext.tsx` handling Track data, PlaybackState, and AudioController actions.
   - Write the runtime controller class in `services/audioEngine.ts` that delegates audio commands based on `Platform.OS`.
3. **App Targets:** Scaffold `apps/mobile`, `apps/desktop-native`, `apps/web-tauri`, and `apps/tui` with their respective `package.json` and basic entry points.

## Implementation Steps
1. Create the root workspace `package.json` file.
2. Initialize `packages/shared` with its `package.json`, `index.tsx`, and the directory structure.
3. Implement `packages/shared/src/store/audioContext.tsx` with Zustand mock architecture.
4. Implement `packages/shared/src/services/audioEngine.ts` with the headless platform-routing class.
5. Create empty files/placeholders for other services (`configSync.ts`, `tidalApi.ts`, `database.ts`).
6. Scaffold the `apps/` directory with configurations for each of the 4 targets.
7. Run a workspace validation check to ensure directories are structured correctly.

## Verification
- Validate the directory tree creation.
- Ensure `bun install` can successfully link the workspaces based on the `package.json` structures.
- Verify `audioContext.tsx` and `audioEngine.ts` contain the correct typescript typings and logic shells.