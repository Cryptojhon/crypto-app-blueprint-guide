import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CryptoAsset } from '../services/cryptoApi';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
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
  buyAsset: (asset: CryptoAsset, amount: number, price: number) => Promise<void>;
  sellAsset: (asset: CryptoAsset, amount: number, price: number) => Promise<void>;
  addFunds: (amount: number) => Promise<void>;
  withdrawFunds: (amount: number) => Promise<void>;
  generateReferralLink: () => Promise<string>;
  referralCode: string | null;
  referralCount: number;
  isLoadingReferral: boolean;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [balance, setBalance] = useState(10000); // Mock starting balance of $10,000
  const [portfolioAssets, setPortfolioAssets] = useState<PortfolioAsset[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [isLoadingReferral, setIsLoadingReferral] = useState(false);
  const { user } = useAuth();

  // Fetch user's portfolio on mount
  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!user) return;

      const { data: wallets, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching portfolio:', error);
        return;
      }

      const assets = wallets.map(wallet => ({
        assetId: wallet.asset_id,
        symbol: wallet.asset_id,
        name: wallet.asset_id,
        amount: Number(wallet.balance),
        averagePrice: 0, // We'll calculate this from transactions
      }));

      setPortfolioAssets(assets);

      // Fetch user profile for balance
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (!profileError && profile) {
        setBalance(Number(profile.balance));
      }
    };

    fetchPortfolio();
  }, [user]);

  // Fetch referral data
  useEffect(() => {
    const fetchReferralData = async () => {
      if (!user) return;

      setIsLoadingReferral(true);
      
      // Fetch existing referral code
      const { data: referralData, error: referralError } = await supabase
        .from('referrals')
        .select('code')
        .eq('user_id', user.id)
        .single();

      if (!referralError && referralData) {
        setReferralCode(referralData.code);
        
        // Count referrals
        const { count, error: countError } = await supabase
          .from('referrals_used')
          .select('*', { count: 'exact', head: true })
          .eq('referrer_id', user.id);
          
        if (!countError && count !== null) {
          setReferralCount(count);
        }
      }
      
      setIsLoadingReferral(false);
    };
    
    fetchReferralData();
  }, [user]);

  // Calculate total portfolio value
  useEffect(() => {
    const calculateTotalValue = () => {
      const assetsValue = portfolioAssets.reduce((sum, asset) => {
        return sum + asset.amount * asset.averagePrice;
      }, 0);
      
      setTotalValue(assetsValue + balance);
    };

    calculateTotalValue();
  }, [portfolioAssets, balance]);

  const buyAsset = async (asset: CryptoAsset, amount: number, price: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to trade.",
        variant: "destructive"
      });
      return;
    }

    const total = amount * price;
    
    if (total > balance) {
      toast({
        title: "Insufficient Funds",
        description: "You don't have enough balance to complete this purchase.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'buy',
          asset_id: asset.id,
          amount: amount,
          price: price,
          total_value: total
        });

      if (error) throw error;

      // Update local state after successful transaction
      setBalance(prev => prev - total);
      setPortfolioAssets(prev => {
        const existingAsset = prev.find(a => a.assetId === asset.id);
        
        if (existingAsset) {
          const newAmount = existingAsset.amount + amount;
          const newTotalCost = (existingAsset.amount * existingAsset.averagePrice) + total;
          const newAveragePrice = newTotalCost / newAmount;
          
          return prev.map(a => 
            a.assetId === asset.id 
              ? { ...a, amount: newAmount, averagePrice: newAveragePrice }
              : a
          );
        } else {
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
    } catch (error) {
      console.error('Transaction error:', error);
      toast({
        title: "Transaction Failed",
        description: "There was an error processing your purchase.",
        variant: "destructive"
      });
    }
  };

  const sellAsset = async (asset: CryptoAsset, amount: number, price: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to trade.",
        variant: "destructive"
      });
      return;
    }

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

    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'sell',
          asset_id: asset.id,
          amount: amount,
          price: price,
          total_value: total
        });

      if (error) throw error;

      // Update local state after successful transaction
      setBalance(prev => prev + total);
      setPortfolioAssets(prev => {
        const updatedAssets = prev.map(a => {
          if (a.assetId === asset.id) {
            const newAmount = a.amount - amount;
            return { ...a, amount: newAmount };
          }
          return a;
        });
        
        return updatedAssets.filter(a => a.amount > 0);
      });

      toast({
        title: "Sale Successful",
        description: `Sold ${amount} ${asset.symbol.toUpperCase()} for $${total.toLocaleString()}`,
      });
    } catch (error) {
      console.error('Transaction error:', error);
      toast({
        title: "Transaction Failed",
        description: "There was an error processing your sale.",
        variant: "destructive"
      });
    }
  };

  const addFunds = async (amount: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to add funds.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Update the user's balance in the database
      const { error } = await supabase
        .from('profiles')
        .update({ balance: balance + amount })
        .eq('id', user.id);

      if (error) throw error;

      // Insert a deposit transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'deposit',
          asset_id: 'USD',
          amount: amount,
          price: 1,
          total_value: amount
        });

      if (transactionError) throw transactionError;

      // Update local state
      setBalance(prevBalance => prevBalance + amount);
      
      toast({
        title: "Funds Added",
        description: `$${amount.toLocaleString()} has been added to your account.`,
      });
    } catch (error) {
      console.error('Deposit error:', error);
      toast({
        title: "Deposit Failed",
        description: "There was an error processing your deposit.",
        variant: "destructive"
      });
    }
  };

  const withdrawFunds = async (amount: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to withdraw funds.",
        variant: "destructive"
      });
      return;
    }

    if (amount > balance) {
      toast({
        title: "Insufficient Funds",
        description: "You don't have enough balance to complete this withdrawal.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Update the user's balance in the database
      const { error } = await supabase
        .from('profiles')
        .update({ balance: balance - amount })
        .eq('id', user.id);

      if (error) throw error;

      // Insert a withdrawal transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'withdraw',
          asset_id: 'USD',
          amount: amount,
          price: 1,
          total_value: amount
        });

      if (transactionError) throw transactionError;

      // Update local state
      setBalance(prevBalance => prevBalance - amount);
      
      toast({
        title: "Withdrawal Successful",
        description: `$${amount.toLocaleString()} has been withdrawn from your account.`,
      });
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast({
        title: "Withdrawal Failed",
        description: "There was an error processing your withdrawal.",
        variant: "destructive"
      });
    }
  };

  const generateReferralLink = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate a referral link.",
        variant: "destructive"
      });
      return '';
    }

    try {
      // Check if user already has a referral code
      if (referralCode) {
        return `${window.location.origin}/auth?ref=${referralCode}`;
      }

      // Generate a new referral code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      const { error } = await supabase
        .from('referrals')
        .insert({
          user_id: user.id,
          code: code,
        });

      if (error) throw error;

      // Update local state
      setReferralCode(code);
      
      toast({
        title: "Referral Link Generated",
        description: "Your referral link is ready to share!",
      });
      
      return `${window.location.origin}/auth?ref=${code}`;
    } catch (error) {
      console.error('Referral generation error:', error);
      toast({
        title: "Failed to Generate Referral Link",
        description: "There was an error generating your referral link.",
        variant: "destructive"
      });
      return '';
    }
  };

  const value: PortfolioContextType = {
    balance,
    portfolioAssets,
    totalValue,
    buyAsset,
    sellAsset,
    addFunds,
    withdrawFunds,
    generateReferralLink,
    referralCode,
    referralCount,
    isLoadingReferral
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
