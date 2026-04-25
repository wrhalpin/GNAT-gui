---
layout: default
title: Tutorials — GNAT-gui
---

# Tutorials

Step-by-step walkthroughs for newcomers. Each tutorial starts from scratch and ends with a working result. Estimated times are shown; most of the time is waiting on build steps, not typing.

If you are new to GNAT-gui, start at the top and work down.

---

## 1. [Getting started](getting-started.md) — ~20 min

Install Python and Node dependencies, configure environment variables, run database migrations, seed the default roles and admin user, and start both servers. Ends with a working login at `http://localhost:5173`.

## 2. [Your first investigation](first-investigation.md) — ~15 min

Create a seed-based evidence graph, watch the five-step pipeline run, explore STIX nodes on the graph canvas, and add a hypothesis scored on the NATO Admiralty Scale.

## 3. [Your first detection rule](first-rule.md) — ~10 min

Write a YAML DSL rule in the Monaco editor, test it against a STIX fixture, review the append-only audit trail, and (if you have the `senior_analyst` role) promote it to the shared library.

---

[← Documentation index](../index.md)
