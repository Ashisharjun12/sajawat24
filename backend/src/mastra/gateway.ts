import { MastraModelGateway, type ProviderConfig } from '@mastra/core/llm'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { _config } from '../config/config.js'

const LLM_API_KEY_ENV = 'LLM_API_KEY'

function registeredModels(): string[] {
    const models = new Set<string>()
    if (_config.LLM_MODEL) models.add(_config.LLM_MODEL)
    if (_config.LLM_TOOL_MODEL) models.add(_config.LLM_TOOL_MODEL)
    if (_config.GUARDRAIL_MODEL) models.add(_config.GUARDRAIL_MODEL)
    return [...models]
}

function normalizeBaseUrl(url: string): string {
    return url.replace(/\/+$/, '')
}

export class UniversalGateway extends MastraModelGateway {
    readonly id = 'universal'
    readonly name = 'Universal Gateway'

    async fetchProviders(): Promise<Record<string, ProviderConfig>> {
        return {
            main: {
                name: 'main',
                models: registeredModels(),
                apiKeyEnvVar: LLM_API_KEY_ENV,
                gateway: this.id,
                url: _config.LLM_BASE_URL as string,
            },
        }
    }

    buildUrl(_modelId?: string, _envVars?: Record<string, string>): string {
        const url = _config.LLM_BASE_URL
        if (!url) throw new Error('Missing LLM_BASE_URL in .env')
        return normalizeBaseUrl(url)
    }

    async getApiKey(_modelId: string): Promise<string> {
        const key = _config.LLM_API_KEY
        if (!key) throw new Error('Missing LLM_API_KEY in .env')
        return key
    }

    async resolveLanguageModel({
        modelId,
        providerId,
        apiKey,
    }: {
        modelId: string
        providerId: string
        apiKey: string
    }) {
        const headers: Record<string, string> = {}
        const baseUrl = this.buildUrl()
        if (baseUrl.includes('openrouter.ai')) {
            if (_config.OPENROUTER_SITE_URL) headers['HTTP-Referer'] = _config.OPENROUTER_SITE_URL
            if (_config.OPENROUTER_APP_NAME) headers['X-Title'] = _config.OPENROUTER_APP_NAME
        }

        return createOpenAICompatible({
            name: providerId,
            apiKey,
            baseURL: baseUrl,
            headers: Object.keys(headers).length > 0 ? headers : undefined,
        }).chatModel(modelId) as any
    }
}

export const universalGateway = new UniversalGateway()