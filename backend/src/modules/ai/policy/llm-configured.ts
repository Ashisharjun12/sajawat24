import { _config } from "@/config/config.js";

export function isLlmConfigured(): boolean {
    return Boolean(_config.LLM_API_KEY?.trim() && _config.LLM_BASE_URL?.trim() && _config.LLM_MODEL?.trim());
}
