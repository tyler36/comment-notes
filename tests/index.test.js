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
      const lookup = {
        'comment-template': `FAKE-comment-template`,
      }

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
        `git notes add FAKE-SHA -m "FAKE-comment-template"`,
      ),
    )
    expect(execSync).toHaveBeenCalledWith('git push origin "refs/notes/*"')
    expect(infoMock).toHaveBeenCalledWith('Git note added successfully.')
  })

  it('configs notes template via input', async () => {
    core.getInput.mockImplementation((name) => {
      const lookup = {
        'comment-template': '- $comment.user.login: $comment.body',
      }

      return lookup[name] || `FAKE-${name}`
    })

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
        {
          body: 'Suscipit, cupiditate.',
          user: {
            login: 'user27',
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
        `git notes add FAKE-SHA -m "- user47: lorem ipsum dolor sit amet
- user27: Suscipit, cupiditate."`,
      ),
    )
  })

  it('notes template fall back to empty string if key does not exist', async () => {
    core.getInput.mockImplementation((name) => {
      const lookup = {
        'comment-template': '- $comment.user.login $comment.invalid',
      }

      return lookup[name] || `FAKE-${name}`
    })

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
      expect.stringContaining(`git notes add FAKE-SHA -m "- user47"`),
    )
  })

  it.each(dataProvider_comments())(`Notes Case: $id`, async (data) => {
    const setFailedMock = vi.spyOn(core, 'setFailed')
    core.getInput.mockImplementation((name) => {
      const lookup = {
        'comment-template': '- $comment.user.login: $comment.body',
      }

      return lookup[name] || `FAKE-${name}`
    })
    mockPullsResponse.mockImplementationOnce(() => ({
      data: { merge_commit_sha: 'FAKE-SHA' },
    }))
    mockListCommentsResponse.mockImplementationOnce(() => ({
      data: [
        {
          body: data.body,
          user: {
            login: 'user47',
          },
        },
      ],
    }))

    await run()

    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining(
        `git notes add FAKE-SHA -m "- user47: ${data.body}"`,
      ),
    )
    expect(setFailedMock).toBeCalledTimes(0)
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

function dataProvider_comments() {
  return [
    {
      id: 'simple string',
      body: 'Hello world',
    },
    {
      id: 'Mixed alpha-numeric.',
      body: 'ThiS is A mix of numb3rs and cASEs',
    },
    {
      id: 'Emojis',
      body: '😊 With emojis',
    },
    {
      id: 'Mutli-line comment',
      body: `This is a
multiline comment.`,
    },
    {
      id: 'Markdown link',
      body: 'Include an [link](https://google.com)',
    },
    {
      id: 'Double quotes',
      body: 'Check "double quotes"',
    },
    {
      id: 'Single quotes',
      body: "Check 'single quotes'",
    },
    {
      id: 'Backtick block',
      body: 'Inline code block `v05`',
    },
    {
      id: 'Codeblock',
      body: "Here is a code example:\n\n```javascript\nconsole.log('Hello, world!');\n```",
    },
    {
      id: 'Japanese mix',
      body: 'お疲れ様です。',
    },
    {
      id: 'Japanese mix with unicode',
      body: '(✿✪‿✪｡)ﾉｺﾝﾁｬ♡',
    },
  ]
}
