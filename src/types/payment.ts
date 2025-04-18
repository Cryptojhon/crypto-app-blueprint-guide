
export type PaymentMethod = 'evc' | 'edahab' | 'paysii';
export type FundTab = 'deposit' | 'withdraw';

export interface PaymentMethodConfig {
  id: PaymentMethod;
  name: string;
  description: string;
  processingTime: string;
  fee: number;
  imageUrl: string;
}

export const paymentMethods: PaymentMethodConfig[] = [
  {
    id: 'evc',
    name: 'EVC Plus',
    description: 'Hormuud Mobile Money',
    processingTime: '5-15 minutes',
    fee: 1.0,
    imageUrl: '/images/payment/evc.png'
  },
  {
    id: 'edahab',
    name: 'eDahab',
    description: 'Somtel Mobile Money',
    processingTime: '5-15 minutes',
    fee: 1.0,
    imageUrl: '/images/payment/edahab.png'
  },
  {
    id: 'paysii',
    name: 'Paysii',
    description: 'Premier Mobile Money',
    processingTime: '5-15 minutes',
    fee: 1.0,
    imageUrl: '/images/payment/paysii.png'
  }
];
