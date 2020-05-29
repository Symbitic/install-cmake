module.exports = {
    automock: false,
    clearMocks: true,
    moduleFileExtensions: [ 'js', 'ts' ],
    testEnvironment: 'node',
    testMatch: [ '**/*.test.ts' ],
    testPathIgnorePatterns: [
      '<rootDir>/actions/'
    ],
    testRunner: 'jest-circus/runner',
    transformIgnorePatterns: [
      '<rootDir>/dist/',
      '<rootDir>/node_modules/'
    ],
    transform: {
      '^.+\\.ts$': 'ts-jest'
    },
    verbose: true
}
