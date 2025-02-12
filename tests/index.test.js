import { describe, it, expect, vi, beforeEach, afterEach, resetAllMocks } from "vitest";
import { run } from "../src/index";
import { execSync } from 'child_process';
import * as core from '@actions/core';
import * as github from '@actions/github';
import pullRequestPayload from "./payloads/pull_request.ts";

const mockPayload = vi.hoisted(() => vi.fn())

vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

vi.mock('@actions/core', () => ({
  getInput: vi.fn(),
  info: vi.fn(),
  setFailed: vi.fn(),
}));

vi.mock('@actions/github', () => ({
  context: vi.fn(),
  getOctokit: vi.fn(),
}));

vi.mock('@octokit/rest');

describe("GitHub Action - PR Git Notes", () => {
  beforeEach(() => {
    core.getInput.mockImplementation((name) => {
      const lookup = {}

      return lookup[name] || `FAKE-${name}`
    })

    github.context = pullRequestPayload
  });

  afterEach(() => {
    vi.resetAllMocks()
  })

  it("fails if not triggered by a pull request", async () => {
      const setFailedMock = vi.spyOn(core, "setFailed");
      github.context = {payload: {}}

      await run();

      expect(setFailedMock).toHaveBeenCalledWith("This action must be triggered by a pull request.");
    });

  it("does not add a git note if there are no comments", async () => {
    const infoMock = vi.spyOn(core, "info");

    // Mock the Octokit instance
    const mockListComments = vi.fn().mockImplementation(() => ({ data: [] }));
    const mockOctokit = {
      rest: {
        issues: {
          listComments: mockListComments,
        },
      },
    };
    github.getOctokit.mockReturnValueOnce(mockOctokit);

    await run();

    expect(infoMock).toHaveBeenCalledWith("No comments to add as a git note.");
  });

  it("fails if merge commit SHA cannot be determined", async () => {
    const setFailedMock = vi.spyOn(core, "setFailed");

    // Mock the Octokit instance
    const mockListComments = vi.fn().mockImplementation(() => ({ data: [
      {
        'user': 'dave',
      }
    ] }));
    const mockPulls = vi.fn().mockImplementation(() => ({ data: {pr: {}}}));
    const mockOctokit = {
      rest: {
        issues: {
          listComments: mockListComments,
        },
        pulls: {
          get: mockPulls,
        }
      },
    };
    github.getOctokit.mockReturnValueOnce(mockOctokit);

    await run();

    expect(setFailedMock).toHaveBeenCalledWith("Could not determine merge commit SHA.");
  });

});
