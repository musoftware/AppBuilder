import { describe, it, expect, vi } from 'vitest';
import { BrainstormAgent } from './BrainstormAgent.js';
import { DEFAULT_SETTINGS } from '../types.js';

describe('BrainstormAgent', () => {
  it('handles first turn for multi-word idea without throwing (e.g. erp system in laravel)', async () => {
    const callModel = vi
      .fn()
      .mockResolvedValue('What modules do you need first?');
    const agent = new BrainstormAgent(DEFAULT_SETTINGS, callModel);

    const result = await agent.chat('erp system in laravel');

    expect(result.ready).toBe(false);
    expect(result.reply).toBe('What modules do you need first?');
    expect(callModel).toHaveBeenCalledTimes(1);
    expect(agent.getContextSpec().idea).toBe('erp system in laravel');
  });

  it('treats go trigger without calling the model', async () => {
    const callModel = vi.fn().mockResolvedValue('ignored');
    const agent = new BrainstormAgent(DEFAULT_SETTINGS, callModel);

    const result = await agent.chat('go');

    expect(result.ready).toBe(true);
    expect(result.reply).toBe('');
    expect(callModel).not.toHaveBeenCalled();
  });

  it('uses merged settings so goTriggers is always iterable', async () => {
    const callModel = vi.fn().mockResolvedValue('ok');
    const agent = new BrainstormAgent(
      {
        ...DEFAULT_SETTINGS,
        goTriggers: ['launch'],
      },
      callModel,
    );

    expect(await agent.chat('launch')).toEqual({ reply: '', ready: true });
    expect(callModel).not.toHaveBeenCalled();
  });
});
