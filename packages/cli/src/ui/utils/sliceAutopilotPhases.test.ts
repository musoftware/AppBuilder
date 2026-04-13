/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { sliceAutopilotPhaseMessages } from './sliceAutopilotPhases.js';

describe('sliceAutopilotPhaseMessages', () => {
  const msgs = ['a', 'b', 'c', 'd'];

  it('returns a single 1-based message', () => {
    const r = sliceAutopilotPhaseMessages(msgs, 2);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.messages).toEqual(['b']);
  });

  it('returns an inclusive range', () => {
    const r = sliceAutopilotPhaseMessages(msgs, 2, 3);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.messages).toEqual(['b', 'c']);
  });

  it('rejects empty queue', () => {
    const r = sliceAutopilotPhaseMessages([], 1);
    expect(r.ok).toBe(false);
  });

  it('rejects out-of-range', () => {
    const r = sliceAutopilotPhaseMessages(msgs, 0);
    expect(r.ok).toBe(false);
    const r2 = sliceAutopilotPhaseMessages(msgs, 5);
    expect(r2.ok).toBe(false);
    const r3 = sliceAutopilotPhaseMessages(msgs, 2, 5);
    expect(r3.ok).toBe(false);
  });
});
