export type BankAccount = {
  id: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  createdAt: string;
};

export type UpiId = {
  id: string;
  vpa: string;
  createdAt: string;
};
