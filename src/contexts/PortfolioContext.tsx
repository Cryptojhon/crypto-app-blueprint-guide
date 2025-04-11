
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CryptoAsset } from '../services/cryptoApi';
import { toast } from '@/components/ui/use-toast';

interface PortfolioAsset {
  assetId: string;
  symbol: string;
  name: string;
  amount: number;
  averagePrice: number;
}

interface PortfolioContextType {
  balance: number;
  portfolioAssets: PortfolioAsset[];
  totalValue: number;
  addFunds: (amount: number) => void;
  buyAsset: (asset: CryptoAsset, amount: number, price: number) => void;
  sellAsset: (asset: CryptoAsset, amount: number, price: number) => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Mock starting balance of $10,000
  const [balance, setBalance] = useState(10000);
  const [portfolioAssets, setPortfolioAssets] = useState<PortfolioAsset[]>([]);
  const [totalValue, setTotalValue] = useState(0);

  // Calculate total portfolio value
  useEffect(() => {
    const calculateTotalValue = () => {
      // Sum up the value of all assets plus the cash balance
      const assetsValue = portfolioAssets.reduce((sum, asset) => {
        return sum + asset.amount * asset.averagePrice;
      }, 0);
      
      setTotalValue(assetsValue + balance);
    };

    calculateTotalValue();
  }, [portfolioAssets, balance]);

  // Add funds to balance
  const addFunds = (amount: number) => {
    setBalance(prev => prev + amount);
    toast({
      title: "Funds Added",
      description: `$${amount.toLocaleString()} has been added to your account`,
    });
  };

  // Buy crypto asset
  const buyAsset = (asset: CryptoAsset, amount: number, price: number) => {
    const total = amount * price;
    
    if (total > balance) {
      toast({
        title: "Insufficient Funds",
        description: "You don't have enough balance to complete this purchase.",
        variant: "destructive"
      });
      return;
    }
    
    // Update balance
    setBalance(prev => prev - total);
    
    // Update or add to portfolio
    setPortfolioAssets(prev => {
      const existingAsset = prev.find(a => a.assetId === asset.id);
      
      if (existingAsset) {
        // Update existing asset
        const newTotalAmount = existingAsset.amount + amount;
        const newTotalCost = (existingAsset.amount * existingAsset.averagePrice) + total;
        const newAveragePrice = newTotalCost / newTotalAmount;
        
        return prev.map(a => 
          a.assetId === asset.id 
            ? { ...a, amount: newTotalAmount, averagePrice: newAveragePrice } 
            : a
        );
      } else {
        // Add new asset
        return [...prev, {
          assetId: asset.id,
          symbol: asset.symbol,
          name: asset.name,
          amount: amount,
          averagePrice: price
        }];
      }
    });
    
    toast({
      title: "Purchase Successful",
      description: `Bought ${amount} ${asset.symbol.toUpperCase()} for $${total.toLocaleString()}`,
    });
  };

  // Sell crypto asset
  const sellAsset = (asset: CryptoAsset, amount: number, price: number) => {
    const existingAsset = portfolioAssets.find(a => a.assetId === asset.id);
    
    if (!existingAsset || existingAsset.amount < amount) {
      toast({
        title: "Insufficient Assets",
        description: `You don't have enough ${asset.symbol.toUpperCase()} to sell.`,
        variant: "destructive"
      });
      return;
    }
    
    const total = amount * price;
    
    // Update balance
    setBalance(prev => prev + total);
    
    // Update portfolio
    setPortfolioAssets(prev => {
      const updatedAssets = prev.map(a => {
        if (a.assetId === asset.id) {
          const newAmount = a.amount - amount;
          // If amount becomes 0, it will be filtered out below
          return { ...a, amount: newAmount };
        }
        return a;
      });
      
      // Remove assets with 0 amount
      return updatedAssets.filter(a => a.amount > 0);
    });
    
    toast({
      title: "Sale Successful",
      description: `Sold ${amount} ${asset.symbol.toUpperCase()} for $${total.toLocaleString()}`,
    });
  };

  const value: PortfolioContextType = {
    balance,
    portfolioAssets,
    totalValue,
    addFunds,
    buyAsset,
    sellAsset
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = (): PortfolioContextType => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};
