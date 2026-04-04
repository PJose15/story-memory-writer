import { describe, it, expect } from 'vitest';
import { getAdaptiveConfig } from '@/lib/adaptive-experience';
import type { AdaptiveConfig } from '@/lib/adaptive-experience';

describe('getAdaptiveConfig', () => {
  it('returns defaults for null blockType', () => {
    const config = getAdaptiveConfig(null);
    expect(config.noRetreat).toBe(false);
    expect(config.timerMinutes).toBeNull();
    expect(config.guidedPrompts).toBe(false);
    expect(config.preparationMessage).toBe('Take a deep breath. You are here to write.');
  });

  it('returns correct config for fear block', () => {
    const config = getAdaptiveConfig('fear');
    expect(config.noRetreat).toBe(false);
    expect(config.timerMinutes).toBeNull();
    expect(config.guidedPrompts).toBe(false);
    expect(config.preparationMessage).toBe('Write freely. No one is watching.');
  });

  it('returns correct config for perfectionism block', () => {
    const config = getAdaptiveConfig('perfectionism');
    expect(config.noRetreat).toBe(true);
    expect(config.timerMinutes).toBeNull();
    expect(config.guidedPrompts).toBe(false);
    expect(config.preparationMessage).toBe('Your inner editor is off duty.');
  });

  it('returns correct config for direction block', () => {
    const config = getAdaptiveConfig('direction');
    expect(config.noRetreat).toBe(false);
    expect(config.timerMinutes).toBeNull();
    expect(config.guidedPrompts).toBe(true);
    expect(config.preparationMessage).toBe('Follow the prompts.');
  });

  it('returns correct config for exhaustion block', () => {
    const config = getAdaptiveConfig('exhaustion');
    expect(config.noRetreat).toBe(false);
    expect(config.timerMinutes).toBe(15);
    expect(config.guidedPrompts).toBe(false);
    expect(config.preparationMessage).toBe("Just 15 minutes. That's all.");
  });

  it('every block type has a non-empty preparationMessage', () => {
    const blockTypes = ['fear', 'perfectionism', 'direction', 'exhaustion'] as const;
    for (const type of blockTypes) {
      const config = getAdaptiveConfig(type);
      expect(config.preparationMessage).toBeTruthy();
      expect(config.preparationMessage.length).toBeGreaterThan(0);
    }
  });

  it('null blockType returns all falsy/null defaults', () => {
    const config = getAdaptiveConfig(null);
    expect(config.noRetreat).toBe(false);
    expect(config.timerMinutes).toBeNull();
    expect(config.guidedPrompts).toBe(false);
  });

  it('default config values match expected shape', () => {
    const config = getAdaptiveConfig(null);
    const keys = Object.keys(config);
    expect(keys).toContain('noRetreat');
    expect(keys).toContain('timerMinutes');
    expect(keys).toContain('guidedPrompts');
    expect(keys).toContain('preparationMessage');
  });

  it('only perfectionism enables noRetreat', () => {
    expect(getAdaptiveConfig('fear').noRetreat).toBe(false);
    expect(getAdaptiveConfig('perfectionism').noRetreat).toBe(true);
    expect(getAdaptiveConfig('direction').noRetreat).toBe(false);
    expect(getAdaptiveConfig('exhaustion').noRetreat).toBe(false);
    expect(getAdaptiveConfig(null).noRetreat).toBe(false);
  });

  it('only exhaustion sets a timer', () => {
    expect(getAdaptiveConfig('fear').timerMinutes).toBeNull();
    expect(getAdaptiveConfig('perfectionism').timerMinutes).toBeNull();
    expect(getAdaptiveConfig('direction').timerMinutes).toBeNull();
    expect(getAdaptiveConfig('exhaustion').timerMinutes).toBe(15);
    expect(getAdaptiveConfig(null).timerMinutes).toBeNull();
  });

  it('only direction enables guided prompts', () => {
    expect(getAdaptiveConfig('fear').guidedPrompts).toBe(false);
    expect(getAdaptiveConfig('perfectionism').guidedPrompts).toBe(false);
    expect(getAdaptiveConfig('direction').guidedPrompts).toBe(true);
    expect(getAdaptiveConfig('exhaustion').guidedPrompts).toBe(false);
    expect(getAdaptiveConfig(null).guidedPrompts).toBe(false);
  });
});
