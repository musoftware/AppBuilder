import { describe, expect, it } from 'vitest';
import { messageMatchesGoTrigger } from './goTriggerMatch.js';

describe('messageMatchesGoTrigger', () => {
  const triggers = ['go', 'start', "let's go"];

  it('matches exact trigger', () => {
    expect(messageMatchesGoTrigger('go', triggers)).toBe(true);
    expect(messageMatchesGoTrigger('  GO  ', triggers)).toBe(true);
  });

  it('matches trigger followed by space or comma', () => {
    expect(messageMatchesGoTrigger('go now', triggers)).toBe(true);
    expect(messageMatchesGoTrigger("let's go please", triggers)).toBe(true);
    expect(messageMatchesGoTrigger('start, please', triggers)).toBe(true);
  });

  it('rejects partial substring matches', () => {
    expect(messageMatchesGoTrigger('ago', triggers)).toBe(false);
    expect(messageMatchesGoTrigger('starting', triggers)).toBe(false);
  });
});
