import { _config } from '@/config/config.js'
import { isAiInfrastructureEnabled } from './ai-config.js'

export const UNIVERSAL_GATEWAY_ID = 'universal'
export const UNIVERSAL_PROVIDER_ID = 'main'

const PLACEHOLDER_MODEL = `${UNIVERSAL_GATEWAY_ID}/${UNIVERSAL_PROVIDER_ID}/disabled`

/** Routes LLM calls through UniversalGateway → any OpenAI-compatible API. */
export function toUniversalModelId(model?: string): string {
    if (!isAiInfrastructureEnabled()) {
        return PLACEHOLDER_MODEL
    }
    const raw = model ?? _config.LLM_MODEL
    if (!raw?.trim()) {
        throw new Error('LLM_MODEL is missing from environment')
    }
    if (raw.startsWith(`${UNIVERSAL_GATEWAY_ID}/`)) {
        return raw
    }
    return `${UNIVERSAL_GATEWAY_ID}/${UNIVERSAL_PROVIDER_ID}/${raw}`
}

export const agentModel = toUniversalModelId()
export const toolAgentModel = toUniversalModelId(_config.LLM_TOOL_MODEL ?? _config.LLM_MODEL)
export const guardrailModel = toUniversalModelId(_config.GUARDRAIL_MODEL ?? _config.LLM_MODEL)
