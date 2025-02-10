const core = require("@actions/core");
const github = require("@actions/github");
const { execSync } = require("child_process");

async function run() {
  try {
    const token = core.getInput("github-token");
    const octokit = github.getOctokit(token);
    const context = github.context;

    if (!context.payload.pull_request) {
      core.setFailed("This action must be triggered by a pull request.");
      return;
    }

    const owner = context.repo.owner;
    const repo = context.repo.repo;
    const pull_number = context.payload.pull_request.number;
  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2)
  // console.log(`The event payload: ${payload}`);

    // Fetch PR comments
    const { data: comments } = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: pull_number,
    });
    console.log(comments);

    if (comments.length === 0) {
      core.info("No comments to add as a git note.");
      return;
    }

    const noteContent = comments.map(comment => `- ${comment.user.login}: ${comment.body}`).join("\n");

    // Get the commit SHA of the PR merge
    const { data: pr } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number,
    });
    const commitSHA = pr.merge_commit_sha;

    if (!commitSHA) {
      core.setFailed("Could not determine merge commit SHA.");
      return;
    }

    // Add the note
    execSync(`git fetch origin ${commitSHA}`);
    execSync(`git notes add ${commitSHA} -m "${noteContent}"`);
    console.log(`git notes add ${commitSHA} -m "${noteContent}"`)
    execSync(`git push origin "refs/notes/*"`);

    core.info("Git note added successfully.");
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
