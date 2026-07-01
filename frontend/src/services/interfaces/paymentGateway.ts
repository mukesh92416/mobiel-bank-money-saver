export interface PaymentGatewayInterface {
  processPayment(params: {
    amount: number
    currency: string
    description?: string
    metadata?: Record<string, string>
  }): Promise<{ success: boolean; transactionId?: string; error?: string }>

  verifyPayment(transactionId: string): Promise<{ verified: boolean; status: string }>

  refund(transactionId: string, amount?: number): Promise<{ success: boolean; refundId?: string }>
}

export const paymentGateway: PaymentGatewayInterface = {
  async processPayment() {
    throw new Error('PaymentGateway not implemented')
  },
  async verifyPayment() {
    throw new Error('PaymentGateway not implemented')
  },
  async refund() {
    throw new Error('PaymentGateway not implemented')
  },
}
