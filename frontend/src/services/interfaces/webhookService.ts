export interface WebhookServiceInterface {
  registerWebhook(params: {
    url: string
    events: string[]
    secret?: string
  }): Promise<{ id: string; status: string }>

  handleWebhook(payload: unknown, signature?: string): Promise<{ processed: boolean; event: string }>

  listWebhooks(): Promise<{ id: string; url: string; events: string[]; active: boolean }[]>

  deleteWebhook(id: string): Promise<{ success: boolean }>
}

export const webhookService: WebhookServiceInterface = {
  async registerWebhook() {
    throw new Error('WebhookService not implemented')
  },
  async handleWebhook() {
    throw new Error('WebhookService not implemented')
  },
  async listWebhooks() {
    throw new Error('WebhookService not implemented')
  },
  async deleteWebhook() {
    throw new Error('WebhookService not implemented')
  },
}
