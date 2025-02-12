import { WebhookPayload } from '@actions/github/lib/interfaces'

export default {
  eventName: 'pull_request',
  payload: {
    pull_request: {
      number: 6,
      action: 'created',
      comment: {
        body: 'This item was fixed. #PROJECT-123',
        html_url: 'https://example.com/issue-comment',
        id: 7,
        user: {
          login: 'user49',
        },
      },
    },
  },
  repo: {
    owner: '鈴木太郎',
    repo: 'example-repo',
  },
} as WebhookPayload
