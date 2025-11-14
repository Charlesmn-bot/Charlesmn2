
export enum Status {
  Pending = 'Pending',
  InProgress = 'In Progress',
  Completed = 'Completed',
  Collected = 'Collected',
}

export enum SaleType {
  Accessory = 'Accessory',
  Repair = 'Repair',
  PhoneSale = 'Phone Sale',
  B2B_FundiShopSale = 'B2B/Fundi Shop Sale',
}

export enum PaymentMethod {
  Cash = 'Cash',
  Mpesa = 'M-Pesa',
  LipaMdogoMdogo = 'Lipa Mdogo Mdogo',
  Onfone = 'Onfone',
  Credit = 'Credit',
}

export interface Technician {
  id: string;
  name: string;
}

export interface CustomerServiceRepresentative {
  id: string;
  name: string;
}

export interface User {
  id: string;
  username: string;
  role: 'Admin' | 'Cashier';
}

export interface Sale {
  id: string;
  receiptNumber: string;
  customerName: string;
  customerNumber?: string;
  phoneType: string; // Will be 'Accessory Name' for accessories
  saleType: SaleType;
  repairType?: string; // Only for Repair
  price: number;
  assignedTechnician?: Technician['id']; // Not for Accessory
  estimatedRepairTime?: string; // Only for Repair
  storageLocation?: string; // Only for Repair/PhoneSale
  notes: string;
  imeiPhoto?: string; // Base64 string of the photo, for PhoneSale
  dateBooked: string;
  receiptDate: string;
  dateCollection?: string;
  status: Status;
  paymentMethod: PaymentMethod;
  mpesaNumber?: string;
  lipaMdogoMdogoPlan?: string;
  lipaMdogoMdogoAmount?: number;
  onfoneTransactionId?: string;
  // New fields for Repair
  phoneModel?: string; 
  devicePhoto?: string;
  receivedInShop?: boolean;
  // New fields for Credit payment
  creditPaid?: boolean;
  creditPaidDate?: string;
  customerIdNumber?: string;
  creditAmountPaid?: number;
  creditDueDate?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
}

export interface Purchase {
  id:string;
  supplierId: string;
  product: string;
  cost: number; // Unit Cost
  quantity: number;
  totalCost: number;
  receiptUrl?: string;
  date: string;
}