const esModules = [];

module.exports = {
  verbose: true,
  preset: 'ts-jest',
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^vue$': 'vue/dist/vue.common.js'
  },
  moduleFileExtensions: ['js', 'vue', 'json', 'ts', 'gql'],
  testMatch: [
    '<rootDir>/lib/**/*.spec.ts',
    '<rootDir>/pages/**/*.spec.ts',
    '<rootDir>/middleware/**/*.spec.ts',
    '<rootDir>/components/**/*.spec.ts',
    '<rootDir>/store/**/*.spec.ts'
  ],
  transform: {
    '\\.(gql|graphql)$': 'jest-transform-graphql',
    '^.+\\.js$': 'babel-jest',
    '.*\\.(vue)$': 'vue-jest',
    '^.+\\.ts?$': 'ts-jest'
  },
  transformIgnorePatterns: [`/node_modules/(?!${esModules})`],
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.json'
    }
  },
  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/store/**/*.ts'],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['html', 'text', 'text-summary']
};
