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
    },
  },
})
