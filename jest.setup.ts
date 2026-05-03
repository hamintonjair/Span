import '@testing-library/jest-dom';

// Mock global fetch
global.fetch = jest.fn() as jest.Mock;

// Extend Jest matchers
declare module 'expect' {
  interface Matchers<R> {
    toBeValidUUID(): R;
    toBeValidTimestamp(): R;
  }
}

// Custom matchers
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    return {
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid UUID`,
      pass,
    };
  },
  toBeValidTimestamp(received: string | Date) {
    const date = new Date(received);
    const pass = !isNaN(date.getTime());
    return {
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid timestamp`,
      pass,
    };
  },
});

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
