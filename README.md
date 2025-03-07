# Comment Notes

## Overview

This workflow writes PR comments as Git notes into a PR merge commit.
This is useful to keep a backup of the conversation as well as having offline access to comments.
It was inspired by [Store Code Discussions in Git using Git Notes](https://wouterj.nl/2024/08/git-notes).

## What are git notes?

"git notes" is a system of storing addition information about a commit.
This information is tracked in a reference to a commit hash.
It could be anything from personal comments, issue tracking references, or even test results.
See [official docs](https://git-scm.com/docs/git-notes).

Note:
Git notes never really "caught on". Many website, like GitHub, do not display "git notes".

## Usage

1. Add a `.github/workflows/comment-notes.yml` as below.

   ```yml
   on:
     pull_request:
       types: [closed]

   jobs:
     comment-notes:
       runs-on: ubuntu-latest
       name: 'comment-notes'
       if: github.event.pull_request.merged == true
       permissions:
         contents: write
         pull-requests: read
       steps:
         # Private repositories must use checkout action.
         - name: Checkout
           uses: actions/checkout@v4

         - uses: fregante/setup-git-user@v2

         - name: Commit notes
           id: commit-notes
           uses: tyler36/backlog-linker
           with:
             github-token: ${{ secrets.GITHUB_TOKEN }}
   ```

   This action runs when a PR is closed.
   It reads the PR comments, and appends them as a git note.

2. Update your git remote to fetch the notes.

   ```shell
   git config --add remote.origin.fetch '+refs/notes/*:refs/notes/*'
   ```

3. Run `git log` to see the notes.

### Templates

To override, the default comment template, update your workflow action:

```yml
with:
  github-token: ${{ secrets.GITHUB_TOKEN }}
  comment-template: '- $comment.user.login: $comment.body'
```

The workflow will attempt to replace `$comment` items with the values from the comment object.
For example, given the following comment object

```js
{
  body: 'This works great!'
  user: {
    login: 'Dave'
  }
}
```

... `- $comment.user.login: $comment.body` template would become `- Dave: This works great!`.

### Ignore Authors

If you would like to ignore certain author comments, like a bot or spammer, add the following configuration.

```yml
with:
  github-token: ${{ secrets.GITHUB_TOKEN }}
  ignore-authors: 'spammer123,dependabot[bot]'
```

The `ignore-authors` string is split on comma, and matched against the comment's `author.login` string.

## Contributions

Contributions are welcome. Contributions with tests will be prioritized.

**Contributed by [@tyler36](https://github.com/tyler36)**
