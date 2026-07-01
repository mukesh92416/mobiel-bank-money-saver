export interface UpiAutoPayInterface {
  createMandate(params: {
    upiId: string
    amount: number
    frequency: 'daily' | 'weekly' | 'monthly'
    startDate: string
    endDate?: string
    description?: string
  }): Promise<{ mandateId: string; status: string; approvalUrl?: string }>

  revokeMandate(mandateId: string): Promise<{ success: boolean }>

  listMandates(): Promise<{
    mandates: { id: string; amount: number; frequency: string; status: string; nextCharge: string }[]
  }>
}

export const upiAutoPay: UpiAutoPayInterface = {
  async createMandate() {
    throw new Error('UpiAutoPay not implemented')
  },
  async revokeMandate() {
    throw new Error('UpiAutoPay not implemented')
  },
  async listMandates() {
    throw new Error('UpiAutoPay not implemented')
  },
}
