export interface EmbeddingProvider {
  name: string
  dimensions: number
  embed(text: string): Promise<number[]>
  embedBatch(texts: string[]): Promise<number[][]>
}

export interface OllamaEmbeddingConfig {
  baseUrl?: string
  model?: string
}

/**
 * Ollama-based embedding provider using nomic-embed-text
 */
export class OllamaEmbeddingProvider implements EmbeddingProvider {
  name = 'ollama'
  dimensions = 768 // nomic-embed-text dimensions
  private baseUrl: string
  private model: string

  constructor(config: OllamaEmbeddingConfig = {}) {
    this.baseUrl = config.baseUrl ?? 'http://localhost:11434'
    this.model = config.model ?? 'nomic-embed-text'
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt: text,
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama embedding error: ${response.status}`)
    }

    const data = await response.json()
    return data.embedding as number[]
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    // Ollama doesn't support batch embeddings natively
    // Process sequentially for now
    const embeddings: number[][] = []
    for (const text of texts) {
      const embedding = await this.embed(text)
      embeddings.push(embedding)
    }
    return embeddings
  }
}

/**
 * Create an embedding provider based on configuration
 */
export function createEmbeddingProvider(
  type: 'ollama' = 'ollama',
  config?: OllamaEmbeddingConfig
): EmbeddingProvider {
  switch (type) {
    case 'ollama':
      return new OllamaEmbeddingProvider(config)
    default:
      throw new Error(`Unknown embedding provider: ${type}`)
  }
}
