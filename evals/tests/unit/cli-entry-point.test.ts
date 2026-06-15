import { describe, it, expect } from '@jest/globals';
import { isMainModule } from '../../src/cli/index.js';

describe('isMainModule', () => {
  it('returns false when argv1 is undefined', () => {
    expect(isMainModule('/anything/index.js', undefined)).toBe(false);
  });

  it('returns false when argv1 is empty string', () => {
    expect(isMainModule('/anything/index.js', '')).toBe(false);
  });

  it('returns true when both paths resolve to the same absolute location', () => {
    if (process.platform === 'win32') {
      const a = 'C:\\projects\\jumbo\\evals\\dist\\cli\\index.js';
      const b = 'C:/projects/jumbo/evals/dist/cli/index.js';
      expect(isMainModule(a, a)).toBe(true);
      expect(isMainModule(a, b)).toBe(true);
      expect(isMainModule(b, a)).toBe(true);
    } else {
      const p = '/home/u/proj/dist/cli/index.js';
      expect(isMainModule(p, p)).toBe(true);
    }
  });

  it('returns false when paths point at different files', () => {
    if (process.platform === 'win32') {
      expect(isMainModule(
        'C:\\projects\\jumbo\\evals\\dist\\cli\\index.js',
        'C:\\projects\\jumbo\\evals\\dist\\cli\\other.js',
      )).toBe(false);
    } else {
      expect(isMainModule('/a/index.js', '/a/other.js')).toBe(false);
    }
  });
});
