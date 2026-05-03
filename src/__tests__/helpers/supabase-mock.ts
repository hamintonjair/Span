/**
 * Mock completo de Supabase para testing
 */

export type MockResponse<T = any> = {
  data: T | null;
  error: { message: string; code?: string } | null;
  count?: number;
};

export const createMockSupabase = () => {
  const mockChain = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
    order: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    and: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
  };

  return {
    ...mockChain,
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
    },
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn(),
        download: jest.fn(),
        getPublicUrl: jest.fn(),
        remove: jest.fn(),
        list: jest.fn(),
      }),
    },
    rpc: jest.fn(),
  };
};

export const mockSupabase = createMockSupabase();

/**
 * Helpers para simular respuestas
 */
export const mockSuccessResponse = <T>(data: T): MockResponse<T> => ({
  data,
  error: null,
});

export const mockErrorResponse = (message: string, code?: string): MockResponse => ({
  data: null,
  error: { message, code },
});

export const mockEmptyResponse = (): MockResponse => ({
  data: null,
  error: null,
});

export const mockArrayResponse = <T>(data: T[]): MockResponse<T[]> => ({
  data,
  error: null,
});
