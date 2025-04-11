
// Mock crypto data
export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;
  marketCap: number;
  marketCapRank: number;
  volume24h: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  sparklineData?: number[];
}

// Mock data for the initial state
export const mockCryptoAssets: CryptoAsset[] = [
  {
    id: "bitcoin",
    symbol: "btc",
    name: "Bitcoin",
    image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    currentPrice: 72450.32,
    marketCap: 1421573583749,
    marketCapRank: 1,
    volume24h: 25228737242,
    priceChange24h: 876.32,
    priceChangePercentage24h: 1.23,
    sparklineData: [69420, 70150, 71200, 70900, 72340, 72450.32],
  },
  {
    id: "ethereum",
    symbol: "eth",
    name: "Ethereum",
    image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    currentPrice: 3890.74,
    marketCap: 467291053985,
    marketCapRank: 2,
    volume24h: 15643295032,
    priceChange24h: -78.23,
    priceChangePercentage24h: -1.97,
    sparklineData: [3950, 3920, 3850, 3840, 3870, 3890.74],
  },
  {
    id: "tether",
    symbol: "usdt",
    name: "Tether",
    image: "https://assets.coingecko.com/coins/images/325/large/Tether.png",
    currentPrice: 1.00,
    marketCap: 116956723742,
    marketCapRank: 3,
    volume24h: 48427638352,
    priceChange24h: 0.001,
    priceChangePercentage24h: 0.1,
    sparklineData: [1, 1, 1, 1, 1, 1],
  },
  {
    id: "bnb",
    symbol: "bnb",
    name: "BNB",
    image: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
    currentPrice: 598.32,
    marketCap: 89748523695,
    marketCapRank: 4,
    volume24h: 1526738294,
    priceChange24h: 12.43,
    priceChangePercentage24h: 2.12,
    sparklineData: [580, 585, 590, 587, 595, 598.32],
  },
  {
    id: "solana",
    symbol: "sol",
    name: "Solana",
    image: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
    currentPrice: 157.89,
    marketCap: 69748523215,
    marketCapRank: 5,
    volume24h: 2953841253,
    priceChange24h: 4.21,
    priceChangePercentage24h: 2.74,
    sparklineData: [150, 152, 155, 153, 156, 157.89],
  },
  {
    id: "xrp",
    symbol: "xrp",
    name: "XRP",
    image: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png",
    currentPrice: 0.58,
    marketCap: 31716782364,
    marketCapRank: 6,
    volume24h: 1208473621,
    priceChange24h: -0.02,
    priceChangePercentage24h: -3.33,
    sparklineData: [0.60, 0.59, 0.58, 0.57, 0.58, 0.58],
  },
  {
    id: "cardano",
    symbol: "ada",
    name: "Cardano",
    image: "https://assets.coingecko.com/coins/images/975/large/cardano.png",
    currentPrice: 0.47,
    marketCap: 16519273695,
    marketCapRank: 7,
    volume24h: 426738294,
    priceChange24h: 0.02,
    priceChangePercentage24h: 4.44,
    sparklineData: [0.45, 0.46, 0.46, 0.47, 0.47, 0.47],
  },
  {
    id: "dogecoin",
    symbol: "doge",
    name: "Dogecoin",
    image: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png",
    currentPrice: 0.12,
    marketCap: 15748523695,
    marketCapRank: 8,
    volume24h: 726738294,
    priceChange24h: -0.01,
    priceChangePercentage24h: -7.69,
    sparklineData: [0.13, 0.13, 0.12, 0.12, 0.12, 0.12],
  }
];

// Mock API for getting market data
export const fetchMarketData = async (): Promise<CryptoAsset[]> => {
  // Normally here you'd call a real API, but for demo purposes we'll use mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockCryptoAssets);
    }, 500); // Simulate network delay
  });
};

// Mock API for getting asset details
export const fetchAssetDetails = async (id: string): Promise<CryptoAsset | undefined> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const asset = mockCryptoAssets.find(asset => asset.id === id);
      resolve(asset);
    }, 500);
  });
};

// Generate mock chart data points
export const generateChartData = (timeframe: string): { timestamp: number; price: number }[] => {
  const now = new Date();
  const data: { timestamp: number; price: number }[] = [];
  
  // Number of data points based on timeframe
  let points = 24;
  let startPrice = 72000;
  let volatility = 0.03; // 3% price movement
  
  switch(timeframe) {
    case '1D':
      points = 24;
      break;
    case '1W':
      points = 7 * 24;
      break;
    case '1M':
      points = 30 * 24;
      break;
    case 'YTD':
      points = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24)) * 24;
      break;
    case '1Y':
      points = 365 * 24;
      break;
    default:
      points = 24;
  }
  
  // Generate price data
  for (let i = 0; i < points; i++) {
    const timestamp = new Date(now.getTime() - ((points - i) * 60 * 60 * 1000)).getTime();
    const priceChange = startPrice * (Math.random() * volatility * 2 - volatility);
    startPrice += priceChange;
    data.push({
      timestamp,
      price: Math.max(100, startPrice) // Ensure price doesn't go below 100 for demo
    });
  }
  
  return data;
};

// Mock trading functionality
export interface TradeRequest {
  assetId: string;
  amount: number;
  type: 'buy' | 'sell';
}

export interface TradeResponse {
  success: boolean;
  orderId?: string;
  message?: string;
}

export const executeTrade = async (trade: TradeRequest): Promise<TradeResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate successful trade with random order ID
      const orderId = `ORD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      
      resolve({
        success: true,
        orderId,
        message: `${trade.type === 'buy' ? 'Bought' : 'Sold'} ${trade.amount} of ${trade.assetId} successfully!`
      });
    }, 1000);
  });
};
