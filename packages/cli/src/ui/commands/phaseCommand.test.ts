/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { parseAutopilotPhasePickArgs } from './phaseCommand.js';

describe('parseAutopilotPhasePickArgs', () => {
  it('parses pipeline and single index', () => {
    const r = parseAutopilotPhasePickArgs('prod 4');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.pick.pipeline).toBe('prod');
      expect(r.pick.start).toBe(4);
      expect(r.pick.end).toBeUndefined();
    }
  });

  it('parses inclusive range', () => {
    const r = parseAutopilotPhasePickArgs('full-chain 2-10');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.pick.pipeline).toBe('full-chain');
      expect(r.pick.start).toBe(2);
      expect(r.pick.end).toBe(10);
    }
  });

  it('parses focus after -- for prod-ready', () => {
    const r = parseAutopilotPhasePickArgs('prod-ready 3 -- harden auth');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.pick.pipeline).toBe('prod-ready');
      expect(r.pick.start).toBe(3);
      expect(r.pick.pipelineFocus).toBe('harden auth');
    }
  });

  it('rejects focus for prod', () => {
    const r = parseAutopilotPhasePickArgs('prod 1 -- extra');
    expect(r.ok).toBe(false);
  });

  it('rejects unknown pipeline', () => {
    const r = parseAutopilotPhasePickArgs('nope 1');
    expect(r.ok).toBe(false);
  });

  it('parses a single skill-style phase name', () => {
    const r = parseAutopilotPhasePickArgs('prod e2e-testing');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.pick.phaseNames).toEqual(['e2e-testing']);
      expect(r.pick.start).toBeUndefined();
    }
  });

  it('parses comma-separated phase names', () => {
    const r = parseAutopilotPhasePickArgs('prod plan,user-stories');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.pick.phaseNames).toEqual(['plan', 'user-stories']);
    }
  });

  it('parses prod-ready by role name with focus', () => {
    const r = parseAutopilotPhasePickArgs('prod-ready analyst -- fix checkout');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.pick.phaseNames).toEqual(['analyst']);
      expect(r.pick.pipelineFocus).toBe('fix checkout');
    }
  });
});
