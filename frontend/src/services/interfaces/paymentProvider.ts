export interface PaymentProviderInterface {
  name: string
  isAvailable(): Promise<boolean>

  initiatePayment(params: {
    amount: number
    currency?: string
    description?: string
    customerEmail?: string
    customerPhone?: string
  }): Promise<{ paymentId: string; redirectUrl?: string; qrCode?: string }>

  checkStatus(paymentId: string): Promise<{
    status: 'pending' | 'completed' | 'failed' | 'refunded'
    amount?: number
    completedAt?: string
  }>
}

export const paymentProvider: PaymentProviderInterface = {
  name: 'Not Implemented',
  async isAvailable() {
    return false
  },
  async initiatePayment() {
    throw new Error('PaymentProvider not implemented')
  },
  async checkStatus() {
    throw new Error('PaymentProvider not implemented')
  },
}
