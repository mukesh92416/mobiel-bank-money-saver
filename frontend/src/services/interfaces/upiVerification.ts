export interface UpiVerificationInterface {
  verifyPayment(upiTransactionId: string): Promise<{
    verified: boolean
    amount?: number
    status: 'pending' | 'success' | 'failed'
    timestamp?: string
  }>

  checkTransactionStatus(refId: string): Promise<{
    status: 'pending' | 'success' | 'failed'
    message?: string
  }>
}

export const upiVerification: UpiVerificationInterface = {
  async verifyPayment() {
    throw new Error('UPIVerification not implemented')
  },
  async checkTransactionStatus() {
    throw new Error('UPIVerification not implemented')
  },
}
