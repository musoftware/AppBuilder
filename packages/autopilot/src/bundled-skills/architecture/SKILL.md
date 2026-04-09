---
name: architecture
description: Outline system structure, boundaries, data flow, and major components before implementation. Use for new apps, large refactors, or multi-service designs.
---

# Architecture

Produce a pragmatic structure that an implementer can follow.

## Cover

- Main modules or layers and their responsibilities
- Data model or API boundaries at a high level
- Integration points (HTTP, DB, queues, third-party APIs)
- Operational basics (config, logging, deployment shape) when relevant

## Keep it proportional

Match depth to project size — a small CLI needs a short section; a distributed system needs clearer service boundaries and failure modes.
