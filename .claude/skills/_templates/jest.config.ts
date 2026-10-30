// Template: unit + integration (testing). Needs: jest, ts-jest or next/jest, jest-environment-jsdom,
// @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jest-axe, msw.
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

export default createJestConfig({
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],   // import '@testing-library/jest-dom'; import 'jest-axe/extend-expect'; msw server
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1', '\\.module\\.css$': 'identity-obj-proxy' },
  testPathIgnorePatterns: ['<rootDir>/e2e/', '<rootDir>/out/'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.stories.*', '!src/test/**', '!src/app/**'],
  coverageThreshold: {
    global: { lines: 80, functions: 80, branches: 70 },
    './src/flags/': { lines: 100, functions: 100, branches: 100 },
    './src/config/': { lines: 100, functions: 100 },
    './src/api/errors.ts': { lines: 100, functions: 100, branches: 100 },
  },
});
