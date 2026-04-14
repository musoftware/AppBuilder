import { describe, it, expect } from 'vitest';
import { looksLikeSmartOrchestratorAwaitingUserNext } from './smartOrchestratorAutoContinue.js';

describe('looksLikeSmartOrchestratorAwaitingUserNext', () => {
  it('returns true for > next', () => {
    expect(
      looksLikeSmartOrchestratorAwaitingUserNext(
        '✅ TEST-FIX COMPLETE — moving to next skill\n\n> next',
      ),
    ).toBe(true);
  });

  it('returns true for type next', () => {
    expect(
      looksLikeSmartOrchestratorAwaitingUserNext('When ready, type next.'),
    ).toBe(true);
  });

  it('returns false for unrelated completion', () => {
    expect(
      looksLikeSmartOrchestratorAwaitingUserNext(
        '✅ All tasks done. Production ready.',
      ),
    ).toBe(false);
  });
});
