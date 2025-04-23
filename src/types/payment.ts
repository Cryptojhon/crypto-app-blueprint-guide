
export type PaymentMethod = 'bitcoin' | 'bnb' | 'solana' | 'usdt' | 'core';
export type FundTab = 'deposit' | 'withdraw';

export interface PaymentMethodConfig {
  id: PaymentMethod;
  name: string;
  description: string;
  processingTime: string;
  fee: number;
  address: string;
  imageUrl: string;
}

export const paymentMethods: PaymentMethodConfig[] = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    description: 'Bitcoin Network (BTC)',
    processingTime: '10-30 minutes',
    fee: 0.1,
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    imageUrl: '/images/payment/btc-qr.png'
  },
  {
    id: 'bnb',
    name: 'BNB',
    description: 'BNB Smart Chain (BSC)',
    processingTime: '5-10 minutes',
    fee: 0.1,
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    imageUrl: '/images/payment/bnb-qr.png'
  },
  {
    id: 'solana',
    name: 'Solana',
    description: 'Solana Network (SOL)',
    processingTime: '1-2 minutes',
    fee: 0.1,
    address: '7cKC5UDenda6F3JP2qvPiWnRqqKy6qVJqGnbwrvzmJRy',
    imageUrl: '/images/payment/sol-qr.png'
  },
  {
    id: 'usdt',
    name: 'USDT',
    description: 'Tether (ERC-20)',
    processingTime: '10-30 minutes',
    fee: 1.0,
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    imageUrl: '/images/payment/usdt-qr.png'
  },
  {
    id: 'core',
    name: 'CORE',
    description: 'Core DAO',
    processingTime: '5-10 minutes',
    fee: 0.1,
    address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    imageUrl: '/images/payment/core-qr.png'
  }
];
