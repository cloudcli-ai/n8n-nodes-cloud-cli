import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class CloudCliApi implements ICredentialType {
	name = 'cloudCliApi';
	displayName = 'Cloud CLI API';
	documentationUrl = 'https://cloudcli.ai/api-keys';
	icon: Icon = 'file:logo.svg';
	properties: INodeProperties[] = [
		{
			displayName: 'Host',
			name: 'host',
			type: 'string',
			default: 'https://cloudcli.ai/api/v1',
			required: true,
			description: 'CloudCLI API base URL',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'API key from https://cloudcli.ai/api-keys',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-KEY': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.host}}',
			url: '/environments',
			method: 'GET',
		},
	};
}
