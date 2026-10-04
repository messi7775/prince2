module.exports = {
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  testEnvironment: 'node',
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '../tsconfig.json' }] },
  modulePathIgnorePatterns: ['<rootDir>/generated/'],
};
