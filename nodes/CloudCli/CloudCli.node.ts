import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodeListSearchResult,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class CloudCli implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Cloud CLI',
		name: 'cloudCli',
		icon: 'file:logo.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Manage CloudCLI development environments and run AI agents',
		defaults: {
			name: 'Cloud CLI',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'cloudCliApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Environment',
						value: 'environment',
					},
					{
						name: 'Agent',
						value: 'agent',
					},
				],
				default: 'environment',
			},
			// Environment Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['environment'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new development environment',
						action: 'Create an environment',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete an environment (must be stopped first)',
						action: 'Delete an environment',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get details of a specific environment',
						action: 'Get an environment',
					},
					{
						name: 'Get Many',
						value: 'list',
						description: 'Retrieve a list of environments',
						action: 'Get many environments',
					},
					{
						name: 'Start',
						value: 'start',
						description: 'Start a stopped environment',
						action: 'Start an environment',
					},
					{
						name: 'Stop',
						value: 'stop',
						description: 'Stop a running environment',
						action: 'Stop an environment',
					},
				],
				default: 'list',
			},
			// Agent Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['agent'],
					},
				},
				options: [
					{
						name: 'Execute',
						value: 'execute',
						description: 'Run Claude Code or Cursor agent on a running environment',
						action: 'Execute an agent',
					},
				],
				default: 'execute',
			},
			// Environment ID field (for get, delete, start, stop)
			{
				displayName: 'Environment',
				name: 'environmentId',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				required: true,
				displayOptions: {
					show: {
						resource: ['environment'],
						operation: ['get', 'delete', 'start', 'stop'],
					},
				},
				description: 'The environment to operate on',
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						placeholder: 'Select an environment...',
						typeOptions: {
							searchListMethod: 'searchEnvironments',
							searchable: true,
						},
					},
					{
						displayName: 'By ID',
						name: 'id',
						type: 'string',
						placeholder: 'e.g. 550e8400-e29b-41d4-a716-446655440000',
						validation: [
							{
								type: 'regex',
								properties: {
									regex: '^[a-f0-9-]+$',
									errorMessage: 'Not a valid environment ID',
								},
							},
						],
					},
				],
			},
			// List environments - optional status filter
			{
				displayName: 'Status Filter',
				name: 'status',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['environment'],
						operation: ['list'],
					},
				},
				options: [
					{
						name: 'All',
						value: '',
					},
					{
						name: 'Error',
						value: 'error',
					},
					{
						name: 'Running',
						value: 'running',
					},
					{
						name: 'Starting',
						value: 'starting',
					},
					{
						name: 'Stopped',
						value: 'stopped',
					},
					{
						name: 'Stopping',
						value: 'stopping',
					},
				],
				default: '',
				description: 'Filter environments by status',
			},
			// Create environment fields
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['environment'],
						operation: ['create'],
					},
				},
				default: '',
				placeholder: 'e.g. My Backend API',
				description: 'Name for the environment (1-50 characters)',
			},
			{
				displayName: 'Subdomain',
				name: 'subdomain',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['environment'],
						operation: ['create'],
					},
				},
				default: '',
				placeholder: 'e.g. mybackend-abc123',
				description: 'Subdomain for the environment (3-30 characters, lowercase alphanumeric and hyphens)',
			},
			{
				displayName: 'GitHub URL',
				name: 'githubUrl',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['environment'],
						operation: ['create'],
					},
				},
				default: '',
				placeholder: 'e.g. https://github.com/username/repo',
				description: 'Optional GitHub repository URL to clone',
			},
			{
				displayName: 'GitHub Token',
				name: 'githubToken',
				type: 'string',
				typeOptions: {
					password: true,
				},
				displayOptions: {
					show: {
						resource: ['environment'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'GitHub personal access token for private repositories',
			},
			// Agent Execute fields
			{
				displayName: 'Environment',
				name: 'agentEnvironmentId',
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				required: true,
				displayOptions: {
					show: {
						resource: ['agent'],
						operation: ['execute'],
					},
				},
				description: 'The running environment to execute the agent on',
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						placeholder: 'Select an environment...',
						typeOptions: {
							searchListMethod: 'searchEnvironments',
							searchable: true,
						},
					},
					{
						displayName: 'By ID',
						name: 'id',
						type: 'string',
						placeholder: 'e.g. 550e8400-e29b-41d4-a716-446655440000',
						validation: [
							{
								type: 'regex',
								properties: {
									regex: '^[a-f0-9-]+$',
									errorMessage: 'Not a valid environment ID',
								},
							},
						],
					},
				],
			},
			{
				displayName: 'Project Name',
				name: 'projectName',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['agent'],
						operation: ['execute'],
					},
				},
				default: '={{$parameter["agentEnvironmentId"].cachedResultName?.split(" ")[0] || ""}}',
				placeholder: 'e.g. backend',
				description: 'Name of the project inside /workspace/ directory. Defaults to the environment subdomain. Only change this if you know what you are doing.',
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				required: true,
				displayOptions: {
					show: {
						resource: ['agent'],
						operation: ['execute'],
					},
				},
				default: '',
				placeholder: 'e.g. Add user authentication with JWT',
				description: 'Task description for the AI agent',
			},
			{
				displayName: 'Provider',
				name: 'provider',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['agent'],
						operation: ['execute'],
					},
				},
				options: [
					{
						name: 'Claude',
						value: 'claude',
					},
					{
						name: 'Codex',
						value: 'codex',
					},
					{
						name: 'Cursor',
						value: 'cursor',
					},
				],
				default: 'claude',
				description: 'AI provider to use',
			},
			// TODO: Add a model parameter to allow users to select the AI model 
			{
				displayName: 'Additional Options',
				name: 'additionalOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['agent'],
						operation: ['execute'],
					},
				},
				options: [
					{
						displayName: 'Create Branch',
						name: 'createBranch',
						type: 'boolean',
						default: false,
						description: 'Whether to create a git branch for the changes',
					},
					{
						displayName: 'Create Pull Request',
						name: 'createPR',
						type: 'boolean',
						default: false,
						description: 'Whether to create a pull request after completion',
					},
					{
						displayName: 'GitHub Token',
						name: 'githubToken',
						type: 'string',
						typeOptions: {
							password: true,
						},
						default: '',
						description: 'GitHub token for private repos or PR creation',
					},
				],
			},
		],
	};

	methods = {
		listSearch: {
			async searchEnvironments(
				this: ILoadOptionsFunctions,
				filter?: string,
			): Promise<INodeListSearchResult> {
				const credentials = await this.getCredentials('cloudCliApi');
				const baseUrl = credentials.host as string;

				const response = await this.helpers.httpRequest({
					method: 'GET',
					url: `${baseUrl}/environments`,
					headers: {
						'X-API-KEY': credentials.apiKey as string,
					},
					json: true,
				});

				const environments = (response.environments || []) as IDataObject[];

				const results = environments
					.filter((env) => {
						if (!filter) return true;
						const name = (env.name as string) || '';
						const id = (env.id as string) || '';
						const subdomain = (env.subdomain as string) || '';
						const filterLower = filter.toLowerCase();
						return name.toLowerCase().includes(filterLower) || id.toLowerCase().includes(filterLower) || subdomain.toLowerCase().includes(filterLower);
					})
					.map((env) => ({
						name: `${env.name} (${env.status})`,
						value: env.id as string,
						url: env.access_url as string,
					}));

				return { results };
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('cloudCliApi');
		const baseUrl = credentials.host as string;
		const apiKey = credentials.apiKey as string;

		const headers: IDataObject = {
			'X-API-KEY': apiKey,
		};

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const resource = this.getNodeParameter('resource', itemIndex) as string;
				const operation = this.getNodeParameter('operation', itemIndex) as string;

				let responseData: IDataObject;

				if (resource === 'environment') {
					if (operation === 'list') {
						const status = this.getNodeParameter('status', itemIndex, '') as string;
						const queryParams = status ? `?status=${status}` : '';

						const response = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/environments${queryParams}`,
							headers,
							json: true,
						});

						// Extract environments array and return each as separate item
						const environments = (response.environments || []) as IDataObject[];
						for (const env of environments) {
							returnData.push({
								json: env,
								pairedItem: itemIndex,
							});
						}
						continue; // Skip the default push at the end
					} else if (operation === 'get') {
						const environmentIdValue = this.getNodeParameter('environmentId', itemIndex) as { value: string };
						const environmentId = environmentIdValue.value;

						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/environments/${environmentId}`,
							headers,
							json: true,
						});
					} else if (operation === 'create') {
						const name = this.getNodeParameter('name', itemIndex) as string;
						const subdomain = this.getNodeParameter('subdomain', itemIndex) as string;
						const githubUrl = this.getNodeParameter('githubUrl', itemIndex, '') as string;
						const githubToken = this.getNodeParameter('githubToken', itemIndex, '') as string;

						const body: IDataObject = { name, subdomain };
						if (githubUrl) body.github_url = githubUrl;
						if (githubToken) body.github_token = githubToken;

						responseData = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/environments`,
							headers,
							body,
							json: true,
						});
					} else if (operation === 'delete') {
						const environmentIdValue = this.getNodeParameter('environmentId', itemIndex) as { value: string };
						const environmentId = environmentIdValue.value;

						await this.helpers.httpRequest({
							method: 'DELETE',
							url: `${baseUrl}/environments/${environmentId}`,
							headers,
							json: true,
						});

						responseData = { deleted: true };
					} else if (operation === 'start') {
						const environmentIdValue = this.getNodeParameter('environmentId', itemIndex) as { value: string };
						const environmentId = environmentIdValue.value;

						responseData = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/environments/${environmentId}/start`,
							headers,
							json: true,
						});
					} else if (operation === 'stop') {
						const environmentIdValue = this.getNodeParameter('environmentId', itemIndex) as { value: string };
						const environmentId = environmentIdValue.value;

						responseData = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/environments/${environmentId}/stop`,
							headers,
							json: true,
						});
					} else {
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
							itemIndex,
						});
					}
				} else if (resource === 'agent') {
					if (operation === 'execute') {
						const environmentIdValue = this.getNodeParameter('agentEnvironmentId', itemIndex) as { value: string };
						const environmentId = environmentIdValue.value;
						const projectName = this.getNodeParameter('projectName', itemIndex) as string;
						const message = this.getNodeParameter('message', itemIndex) as string;
						const provider = this.getNodeParameter('provider', itemIndex) as string;
						const additionalOptions = this.getNodeParameter('additionalOptions', itemIndex, {}) as IDataObject;

						const body: IDataObject = {
							environmentId,
							projectName,
							message,
							provider,
						};

						if (additionalOptions.createBranch) {
							body.createBranch = additionalOptions.createBranch;
						}
						if (additionalOptions.createPR) {
							body.createPR = additionalOptions.createPR;
						}
						if (additionalOptions.githubToken) {
							body.githubToken = additionalOptions.githubToken;
						}

						responseData = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/agent/execute`,
							headers,
							body,
							json: true,
							timeout: 600000, // 10 minutes timeout for long-running agent tasks
						});
					} else {
						throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
							itemIndex,
						});
					}
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`, {
						itemIndex,
					});
				}

				returnData.push({
					json: responseData,
					pairedItem: itemIndex,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
							errorDetails: error.response?.body || error.response?.data || null,
						},
						pairedItem: itemIndex,
					});
				} else {
					if (error.context) {
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
						description: `Failed to call CloudCLI API: ${error.message}`,
					});
				}
			}
		}

		return [returnData];
	}
}
