import * as core from '@actions/core'
import * as github from '@actions/github'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { execSync } from 'child_process'
import pullRequestPayload from './payloads/pull_request.ts'
import { run } from '../src/index'

const mockListCommentsResponse = vi.hoisted(() => vi.fn())
const mockPullsResponse = vi.hoisted(() => vi.fn())

vi.mock('child_process', () => ({
  execSync: vi.fn(),
}))

vi.mock('@actions/core', () => ({
  getInput: vi.fn(),
  info: vi.fn(),
  setFailed: vi.fn(),
}))

vi.mock('@actions/github', () => ({
  context: vi.fn(),
  getOctokit: vi.fn(),
}))

vi.mock('@octokit/rest')

describe('GitHub Action - PR Git Notes', () => {
  beforeEach(() => {
    core.getInput.mockImplementation((name) => {
      const lookup = {}

      return lookup[name] || `FAKE-${name}`
    })

    github.context = pullRequestPayload
    github.getOctokit.mockReturnValue({
      rest: {
        issues: {
          listComments: mockListCommentsResponse,
        },
        pulls: {
          get: mockPullsResponse,
        },
      },
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('fails if not triggered by a pull request', async () => {
    const setFailedMock = vi.spyOn(core, 'setFailed')
    github.context = { payload: {} }

    await run()

    expect(setFailedMock).toHaveBeenCalledWith(
      'This action must be triggered by a pull request.',
    )
  })

  it('does not add a git note if there are no comments', async () => {
    const infoMock = vi.spyOn(core, 'info')

    // Mock the ListComments response.
    mockListCommentsResponse.mockImplementationOnce(() => ({ data: [] }))

    await run()

    expect(infoMock).toHaveBeenCalledWith('No comments to add as a git note.')
  })

  it('fails if merge commit SHA cannot be determined', async () => {
    const setFailedMock = vi.spyOn(core, 'setFailed')

    mockPullsResponse.mockImplementationOnce(() => ({ data: {} }))
    mockListCommentsResponse.mockImplementationOnce(() => ({
      data: [
        {
          body: 'lorem ipsum dolor sit amet',
          user: {
            login: 'user47',
          },
        },
      ],
    }))

    await run()

    expect(setFailedMock).toHaveBeenCalledWith(
      'Could not determine merge commit SHA.',
    )
  })

  it('adds a git note with PR comments', async () => {
    const infoMock = vi.spyOn(core, 'info')

    mockPullsResponse.mockImplementationOnce(() => ({
      data: { merge_commit_sha: 'FAKE-SHA' },
    }))
    mockListCommentsResponse.mockImplementationOnce(() => ({
      data: [
        {
          body: 'lorem ipsum dolor sit amet',
          user: {
            login: 'user47',
          },
        },
      ],
    }))

    await run()

    expect(execSync).toHaveBeenCalledWith(
      'git fetch origin "refs/notes/*:refs/notes/*"',
    )
    expect(execSync).toHaveBeenCalledWith('git fetch origin FAKE-SHA')
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining(
        'git notes add FAKE-SHA -m "- user47: lorem ipsum dolor sit amet"',
      ),
    )
    expect(execSync).toHaveBeenCalledWith('git push origin "refs/notes/*"')
    expect(infoMock).toHaveBeenCalledWith('Git note added successfully.')
  })

  it('captures errors', async () => {
    const setFailedMock = vi.spyOn(core, 'setFailed')
    mockListCommentsResponse.mockImplementationOnce(() => ({}))

    await run()

    expect(setFailedMock).toHaveBeenCalledWith(
      "Cannot read properties of undefined (reading 'length')",
    )
  })
})
