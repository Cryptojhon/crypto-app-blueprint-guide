import { useEffect, useState } from 'react';

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
  lastUpdated?: string;
}

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

const formatCryptoAsset = (coin: any): CryptoAsset => ({
  id: coin.id,
  symbol: coin.symbol,
  name: coin.name,
  image: coin.image,
  currentPrice: coin.current_price,
  marketCap: coin.market_cap,
  marketCapRank: coin.market_cap_rank,
  volume24h: coin.total_volume,
  priceChange24h: coin.price_change_24h,
  priceChangePercentage24h: coin.price_change_percentage_24h,
  lastUpdated: coin.last_updated,
  sparklineData: coin.sparkline_in_7d?.price
});

// Function to fetch market data
export const fetchMarketData = async (): Promise<CryptoAsset[]> => {
  try {
    const response = await fetch(
      `${COINGECKO_API_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true`
    );
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data.map(formatCryptoAsset);
  } catch (error) {
    console.error('Error fetching market data:', error);
    throw error;
  }
};

// Function to fetch single asset details
export const fetchAssetDetails = async (id: string): Promise<CryptoAsset | undefined> => {
  try {
    const response = await fetch(
      `${COINGECKO_API_URL}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`
    );
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      image: data.image.large,
      currentPrice: data.market_data.current_price.usd,
      marketCap: data.market_data.market_cap.usd,
      marketCapRank: data.market_cap_rank,
      volume24h: data.market_data.total_volume.usd,
      priceChange24h: data.market_data.price_change_24h,
      priceChangePercentage24h: data.market_data.price_change_percentage_24h,
      lastUpdated: data.last_updated,
      sparklineData: data.market_data.sparkline_7d?.price
    };
  } catch (error) {
    console.error('Error fetching asset details:', error);
    throw error;
  }
};

// Hook for real-time market data
export const useMarketData = (updateInterval = 30000) => {
  const [assets, setAssets] = useState<CryptoAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchMarketData();
        setAssets(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch market data');
        console.error('Error fetching market data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchData();

    // Set up polling
    const intervalId = setInterval(fetchData, updateInterval);

    return () => clearInterval(intervalId);
  }, [updateInterval]);

  return { assets, isLoading, error };
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
