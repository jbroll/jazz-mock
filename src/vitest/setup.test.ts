import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createCoValueConstructorMocks,
  createJazzConsoleFilter,
  createJazzToolsMock,
} from './setup.js';

describe('createJazzConsoleFilter', () => {
  let originalError: typeof console.error;
  let originalWarn: typeof console.warn;

  beforeEach(() => {
    originalError = console.error;
    originalWarn = console.warn;
  });

  afterEach(() => {
    console.error = originalError;
    console.warn = originalWarn;
  });

  it('creates filter with error and warn functions', () => {
    const filter = createJazzConsoleFilter();

    expect(filter.error).toBeDefined();
    expect(filter.warn).toBeDefined();
    expect(typeof filter.error).toBe('function');
    expect(typeof filter.warn).toBe('function');
  });

  it('suppresses Jazz-prefixed messages', () => {
    const filter = createJazzConsoleFilter();
    const errorSpy = vi.fn();
    console.error = errorSpy;

    filter.error('[Jazz] Some warning message');
    filter.error('Jazz: initialization message');

    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('suppresses Jazz initialization messages', () => {
    const filter = createJazzConsoleFilter();
    const warnSpy = vi.fn();
    console.warn = warnSpy;

    filter.warn('Jazz initialization failed');

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('suppresses CoMap/CoList initialization warnings', () => {
    const filter = createJazzConsoleFilter();
    const warnSpy = vi.fn();
    console.warn = warnSpy;

    filter.warn('CoMap initialization warning: something happened');
    filter.warn('CoList initialization warning: something else');

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('suppresses React deprecation warnings', () => {
    const filter = createJazzConsoleFilter();
    const warnSpy = vi.fn();
    console.warn = warnSpy;

    filter.warn('Warning: ReactDOM.render is deprecated');
    filter.warn('Warning: componentWillReceiveProps has been renamed');
    filter.warn('Warning: componentWillMount has been renamed');

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('passes through non-Jazz messages', () => {
    // Set up spies BEFORE creating filter (filter captures console at creation time)
    const errorSpy = vi.fn();
    const warnSpy = vi.fn();
    console.error = errorSpy;
    console.warn = warnSpy;
    const filter = createJazzConsoleFilter();

    filter.error('Regular error message');
    filter.warn('Regular warning message');

    expect(errorSpy).toHaveBeenCalledWith('Regular error message');
    expect(warnSpy).toHaveBeenCalledWith('Regular warning message');
  });

  it('passes through all arguments for non-suppressed messages', () => {
    // Set up spy BEFORE creating filter
    const errorSpy = vi.fn();
    console.error = errorSpy;
    const filter = createJazzConsoleFilter();

    filter.error('Error:', { code: 500 }, 'extra info');

    expect(errorSpy).toHaveBeenCalledWith('Error:', { code: 500 }, 'extra info');
  });

  it('handles null/undefined first argument', () => {
    // Set up spy BEFORE creating filter
    const errorSpy = vi.fn();
    console.error = errorSpy;
    const filter = createJazzConsoleFilter();

    filter.error(null);
    filter.error(undefined);

    expect(errorSpy).toHaveBeenCalledTimes(2);
  });

  describe('with additionalPatterns option', () => {
    it('suppresses messages matching additional patterns', () => {
      const filter = createJazzConsoleFilter({
        additionalPatterns: [/^MyApp:/, /custom-warning/i],
      });
      const warnSpy = vi.fn();
      console.warn = warnSpy;

      filter.warn('MyApp: some message');
      filter.warn('This has a Custom-Warning in it');

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('still suppresses default patterns with additional patterns', () => {
      const filter = createJazzConsoleFilter({
        additionalPatterns: [/^MyApp:/],
      });
      const warnSpy = vi.fn();
      console.warn = warnSpy;

      filter.warn('[Jazz] message');
      filter.warn('MyApp: message');

      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('with replaceDefaults option', () => {
    it('only uses additional patterns when replaceDefaults is true', () => {
      // Set up spy BEFORE creating filter
      const warnSpy = vi.fn();
      console.warn = warnSpy;
      const filter = createJazzConsoleFilter({
        additionalPatterns: [/^Custom:/],
        replaceDefaults: true,
      });

      // Default patterns should NOT be suppressed
      filter.warn('[Jazz] message');
      expect(warnSpy).toHaveBeenCalledWith('[Jazz] message');

      warnSpy.mockClear();

      // Custom pattern should be suppressed
      filter.warn('Custom: message');
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('allows all messages when replaceDefaults is true with no additional patterns', () => {
      // Set up spy BEFORE creating filter
      const warnSpy = vi.fn();
      console.warn = warnSpy;
      const filter = createJazzConsoleFilter({
        replaceDefaults: true,
      });

      filter.warn('[Jazz] message');
      filter.warn('CoMap initialization warning');

      expect(warnSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('getPatterns', () => {
    it('returns copy of active patterns', () => {
      const filter = createJazzConsoleFilter();
      const patterns = filter.getPatterns();

      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0]).toBeInstanceOf(RegExp);
    });

    it('includes additional patterns', () => {
      const customPattern = /^Custom:/;
      const filter = createJazzConsoleFilter({
        additionalPatterns: [customPattern],
      });
      const patterns = filter.getPatterns();

      expect(patterns).toContain(customPattern);
    });

    it('returns only custom patterns when replaceDefaults is true', () => {
      const customPattern = /^Custom:/;
      const filter = createJazzConsoleFilter({
        additionalPatterns: [customPattern],
        replaceDefaults: true,
      });
      const patterns = filter.getPatterns();

      expect(patterns).toHaveLength(1);
      expect(patterns[0]).toBe(customPattern);
    });
  });
});

describe('createJazzToolsMock', () => {
  it('creates mock with co namespace', () => {
    const mock = createJazzToolsMock();

    expect(mock.co).toBeDefined();
    expect(mock.co.map).toBeDefined();
    expect(mock.co.list).toBeDefined();
    expect(mock.co.record).toBeDefined();
    expect(mock.co.profile).toBeDefined();
    expect(mock.co.account).toBeDefined();
  });

  it('creates mock with z namespace', () => {
    const mock = createJazzToolsMock();

    expect(mock.z).toBeDefined();
    expect(mock.z.string).toBeDefined();
    expect(mock.z.number).toBeDefined();
    expect(mock.z.boolean).toBeDefined();
  });

  it('co.map returns builder with create and optional', () => {
    const mock = createJazzToolsMock();
    const mapBuilder = mock.co.map();

    expect(mapBuilder.create).toBeDefined();
    expect(mapBuilder.optional).toBeDefined();
    expect(mapBuilder.withMigration).toBeDefined();
  });

  it('includes FileStream mock', () => {
    const mock = createJazzToolsMock();

    expect(mock.FileStream).toBeDefined();
  });
});

describe('createCoValueConstructorMocks', () => {
  it('creates co.list constructor that returns array with metadata', () => {
    const mocks = createCoValueConstructorMocks();
    const ListConstructor = mocks.list({});

    const result = ListConstructor.create(['a', 'b', 'c'], {});

    expect(result).toEqual(['a', 'b', 'c']);
    expect(result.$isLoaded).toBe(true);
    expect(result.$jazz).toBeDefined();
    expect(result.$jazz.push).toBeDefined();
  });

  it('creates co.record constructor that returns object with metadata', () => {
    const mocks = createCoValueConstructorMocks();
    const RecordConstructor = mocks.record({}, {});

    const result = RecordConstructor.create({ key: 'value' }, {});

    expect(result.key).toBe('value');
    expect(result.$isLoaded).toBe(true);
    expect(result.$jazz).toBeDefined();
  });

  it('creates co.map constructor that returns object with metadata', () => {
    const mocks = createCoValueConstructorMocks();
    const MapConstructor = mocks.map({});

    const result = MapConstructor.create({ name: 'test' }, {});

    expect(result.name).toBe('test');
    expect(result.$isLoaded).toBe(true);
    expect(result.$jazz).toBeDefined();
  });
});
