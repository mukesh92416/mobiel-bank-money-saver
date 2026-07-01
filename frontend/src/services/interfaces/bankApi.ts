export interface BankApiInterface {
  getBalance(accountId: string): Promise<{ balance: number; currency: string; updatedAt: string }>

  listTransactions(params: {
    accountId: string
    fromDate?: string
    toDate?: string
    limit?: number
  }): Promise<{
    transactions: { id: string; amount: number; description: string; date: string; type: string }[]
  }>

  initiateTransfer(params: {
    fromAccount: string
    toAccount: string
    amount: number
    description?: string
  }): Promise<{ success: boolean; referenceId: string; status: string }>
}

export const bankApi: BankApiInterface = {
  async getBalance() {
    throw new Error('BankApi not implemented')
  },
  async listTransactions() {
    throw new Error('BankApi not implemented')
  },
  async initiateTransfer() {
    throw new Error('BankApi not implemented')
  },
}
