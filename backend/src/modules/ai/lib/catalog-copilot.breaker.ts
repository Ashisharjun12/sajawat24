import { CircuitBreakerFactory } from "@/infrastructure/resilence/resilense.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { _config } from "@/config/config.js";

const timeoutMs = Number(_config.AI_LLM_TIMEOUT_MS ?? 45_000);

const breaker = CircuitBreakerFactory.create(
    async <T>(operation: () => Promise<T>) => operation(),
    "catalog-copilot-llm",
    {
        timeout: timeoutMs,
        errorThresholdPercentage: 50,
        resetTimeout: 30_000,
    },
);

export async function runCatalogCopilotLlm<T>(operation: () => Promise<T>): Promise<T> {
    try {
        return (await breaker.fire(operation)) as T;
    } catch (error) {
        if (error instanceof Error && error.message.includes("Timed out")) {
            throw new ApiError(504, "AI request timed out");
        }
        if (breaker.opened) {
            throw new ApiError(503, "AI service temporarily unavailable");
        }
        throw new ApiError(502, "AI generation failed");
    }
}
