module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  maxWorkers: '50%',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.ts',
    '!src/cli.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transformIgnorePatterns: [
    'node_modules/(?!uuid)',
  ],
  transform: {
    '^.+\\.[jt]sx?$': ['ts-jest', {
      useESM: true,
      tsconfig: './tsconfig.jest.json',
    }],
  },
};
