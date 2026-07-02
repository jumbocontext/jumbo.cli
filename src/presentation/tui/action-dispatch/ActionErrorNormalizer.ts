export const ActionErrorNormalizer = {
  normalize(caughtError: unknown): Error {
    if (caughtError instanceof Error) {
      return caughtError;
    }

    return new Error(String(caughtError));
  },
} as const;
