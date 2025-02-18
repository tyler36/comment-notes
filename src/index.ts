import * as core from '@actions/core'
import * as github from '@actions/github'
import { execSync } from 'child_process'
import { WebhookPayload } from '@actions/github/lib/interfaces'

/**
 * Clean up the comment string
 *
 * @param input
 * @returns
 */
const sanitizeString = (input: string) => {
  let output = input

  output = output
    .replace(/[\x1F\x7F]/g, '') // Remove control characters
    .replace(/"/g, '\\"') // Escape double quotes
    .replace(/`/g, '\\`') // Escape backticks
    .replace(/\${/g, '\\${') // Escape template interpolation

  return output.trim()
}

export async function run() {
  try {
    const token = core.getInput('github-token')
    const template = core.getInput('comment-template')
    const octokit = github.getOctokit(token)
    const context = github.context

    // This action should only run on pull requests.
    if (!context.payload.pull_request) {
      core.setFailed('This action must be triggered by a pull request.')
      return
    }

    // Get information about the repository.
    const owner = context.repo.owner
    const repo = context.repo.repo
    const pull_number = context.payload.pull_request.number

    // Fetch PR comments
    const { data: comments } = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: pull_number,
    })

    // If there are no comments, there is no need to add a git note.
    if (comments.length === 0) {
      core.info('No comments to add as a git note.')
      return
    }

    const noteContent = comments
      .map((comment) => {
        const result = template.replace(/\$([a-zA-Z0-9_.]+)/g, (_, path) => {
          return (
            path
              .split('.')
              .reduce((obj: WebhookPayload, key: string) => obj?.[key], {
                comment,
              }) ?? ''
          )
        })

        return sanitizeString(result)
      })
      .join('\n')

    // Get the commit SHA of the PR merge
    const { data: pr } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number,
    })
    const commitSHA = pr?.merge_commit_sha

    if (!commitSHA) {
      core.setFailed('Could not determine merge commit SHA.')
      return
    }

    // Add the note
    execSync(`git fetch origin "refs/notes/*:refs/notes/*"`)
    execSync(`git fetch origin ${commitSHA}`)
    execSync(`git notes add ${commitSHA} -m "${noteContent}"`)
    execSync(`git push origin "refs/notes/*"`)

    core.info('Git note added successfully.')
  } catch (error) {
    core.setFailed((error as Error).message)
  }
}

/* v8 ignore next 3 */
if (!process.env.VITEST_WORKER_ID) {
  run()
}
