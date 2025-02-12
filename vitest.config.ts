import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    reporters: ['default', 'junit', 'json'],
    outputFile: {
      junit: './logs/vitest-junit.xml',
      json: './logs/vitest-report.json',
    },
    coverage: {
      // 'json-summary' is required for Github action
      reporter: ['html', 'json-summary'],
      reportOnFailure: true,
      reportsDirectory: './logs/coverage',
      include: ['src/'],
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100
      }
    },
  },
})
