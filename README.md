# n8n-nodes-cloud-cli

This is an n8n community node for [Cloud CLI](https://cloudcli.ai). It lets you manage cloud development environments and run AI coding agents (Claude Code, Cursor, Codex) directly from your n8n workflows.

[n8n](https://n8n.io/) is a fair-code licensed workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

### Environment

- **Create** - Create a new development environment
- **Delete** - Delete an environment
- **Get** - Get details of a specific environment
- **Get Many** - Retrieve a list of environments
- **Start** - Start a stopped environment
- **Stop** - Stop a running environment

### Agent

- **Execute** - Run Claude Code or Cursor agent or Codex on a running environment

## Credentials

You need a Cloud CLI API key to use this node. Get your API key from [cloudcli.ai/api-keys](https://cloudcli.ai/api-keys).

## Resources

- [Cloud CLI Documentation](https://cloudcli.ai/docs)
- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE.md)
