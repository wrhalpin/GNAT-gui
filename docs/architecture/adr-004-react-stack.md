# ADR-004: React + TanStack + shadcn/ui frontend stack

**Status:** Accepted

## Context

We need a frontend stack for analyst-facing workflows: complex tables, a graph canvas, a code editor, and streaming job progress.

## Decision

React 18 + TypeScript 5, Vite, TanStack Router + Query + Table, shadcn/ui (Radix primitives + Tailwind), React Flow, Monaco Editor, Zustand.

## Rationale

**React 18**: Large ecosystem, concurrent features for responsive UI during streaming updates.

**TanStack Router**: Type-safe file-based routing with URL state — sharing a URL shares the analyst's exact view (investigation ID, graph position, active filters).

**TanStack Query**: Server state management with aggressive cache invalidation on mutations; removes the need for manual loading/error state.

**TanStack Table**: Virtualised rows handle the 500+ rule lists and investigation tables without performance tuning.

**shadcn/ui**: Radix UI primitives give accessibility (keyboard nav, screen reader support) out of the box. Tailwind means styles are colocated with components and easy to override.

**React Flow**: Best-in-class graph canvas with custom node types, edge styling, and layout integration (dagre/elkjs). Required for the investigations graph view.

**Monaco Editor**: The same editor as VS Code. Required for rule authoring with Hy/YAML/Prolog syntax highlighting and autocomplete.

**Zustand**: Lightweight client-only state (panel widths, collapsed sections, draft buffers). Avoids Redux boilerplate for UI-only concerns.

## Consequences

- Monaco is large (~10 MB); loaded lazily (dynamic import) so the initial bundle stays small
- React Flow requires careful memoisation at 1000+ nodes; addressed in M5 performance pass
- shadcn/ui components are copied into the repo (not a package dependency); update via `shadcn` CLI
