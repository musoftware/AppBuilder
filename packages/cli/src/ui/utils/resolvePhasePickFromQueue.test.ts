/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { resolvePhasePickFromQueue } from './resolvePhasePickFromQueue.js';

describe('resolvePhasePickFromQueue', () => {
  it('slices by numeric indices', () => {
    const full = ['a', 'b', 'c'];
    const r = resolvePhasePickFromQueue(
      { pipeline: 'quality-check', start: 2, end: 3 },
      full,
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.messages).toEqual(['b', 'c']);
  });

  it('matches prod skill mini-loop header', () => {
    const msg = `━━━ \`e2e-testing\` — PHASE 1/6 — scan ━━━\nrun`;
    const full = ['x', msg, 'y'];
    const r = resolvePhasePickFromQueue(
      { pipeline: 'prod', phaseNames: ['e2e-testing'] },
      full,
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.messages).toEqual([msg]);
  });

  it('matches full-chain by phase title slug', () => {
    const p = '[FULL CHAIN 3/9 — PLANNER]\nbody';
    const full = [p];
    const r = resolvePhasePickFromQueue(
      { pipeline: 'full-chain', phaseNames: ['planner'] },
      full,
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.messages).toEqual([p]);
  });

  it('matches ready-production nested full-chain', () => {
    const inner = '[FULL CHAIN 1/9 — REVERSE BROWNFIELD]\nx';
    const wrapped = `[READY-PRODUCTION round 1/2 — full-chain]\n\n${inner}`;
    const r = resolvePhasePickFromQueue(
      { pipeline: 'ready-production', phaseNames: ['brownfield'] },
      [wrapped],
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.messages).toEqual([wrapped]);
  });
});
