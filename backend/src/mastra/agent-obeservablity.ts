import { Observability } from '@mastra/observability'
import { LangSmithExporter } from '@mastra/langsmith'
import { _config } from '../config/config.js'

export const agentObservability = new Observability({
    configs: {
        langsmith: {
            serviceName: 'research-autonomous-agent',
            exporters: [
                new LangSmithExporter({
                    apiKey: _config.LANGSMITH_API_KEY,
                    projectName: _config.LANGSMITH_PROJECT,
                }),
            ],
        },
    },
})