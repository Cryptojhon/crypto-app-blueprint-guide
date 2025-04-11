
import React, { useState, useEffect } from 'react';
import { CryptoAsset, executeTrade } from '@/services/cryptoApi';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';

interface TradeFormProps {
  asset: CryptoAsset;
}

const TradeForm: React.FC<TradeFormProps> = ({ asset }) => {
  const { balance, portfolioAssets, buyAsset, sellAsset } = usePortfolio();
  
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState<string>('');
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Get portfolio data for this asset (if owned)
  const portfolioAsset = portfolioAssets.find(a => a.assetId === asset.id);
  
  // Calculate estimated cost when amount changes
  useEffect(() => {
    const amountValue = parseFloat(amount);
    if (!isNaN(amountValue) && amountValue > 0) {
      setEstimatedCost(amountValue * asset.currentPrice);
    } else {
      setEstimatedCost(0);
    }
  }, [amount, asset.currentPrice]);
  
  // Handle trade execution
  const handleTrade = async () => {
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to trade",
        variant: "destructive",
      });
      return;
    }
    
    // Check if buy order exceeds balance
    if (tradeType === 'buy' && estimatedCost > balance) {
      toast({
        title: "Insufficient Funds",
        description: "You don't have enough balance to complete this purchase",
        variant: "destructive",
      });
      return;
    }
    
    // Check if sell order exceeds holdings
    if (tradeType === 'sell' && (!portfolioAsset || portfolioAsset.amount < amountValue)) {
      toast({
        title: "Insufficient Assets",
        description: `You don't have enough ${asset.symbol.toUpperCase()} to sell`,
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Execute trade through API (mock in our case)
      const response = await executeTrade({
        assetId: asset.id,
        amount: amountValue,
        type: tradeType,
      });
      
      if (response.success) {
        if (tradeType === 'buy') {
          buyAsset(asset, amountValue, asset.currentPrice);
        } else {
          sellAsset(asset, amountValue, asset.currentPrice);
        }
        
        setAmount('');
        toast({
          title: `${tradeType === 'buy' ? 'Purchase' : 'Sale'} Successful`,
          description: response.message,
        });
      }
    } catch (error) {
      console.error('Trade execution error:', error);
      toast({
        title: "Trade Failed",
        description: "There was an error processing your trade",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Format price with appropriate decimals
  const formatPrice = (price: number) => {
    if (price >= 1) {
      return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
      return price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 });
    }
  };
  
  // Handle max amount button click
  const handleSetMaxAmount = () => {
    if (tradeType === 'buy' && balance > 0) {
      const maxAmount = balance / asset.currentPrice;
      // Limit to 6 decimal places for UI clarity
      setAmount(Math.floor(maxAmount * 1000000) / 1000000 + '');
    } else if (tradeType === 'sell' && portfolioAsset) {
      setAmount(portfolioAsset.amount + '');
    }
  };

  return (
    <div className="w-full border rounded-lg p-5">
      <h2 className="text-lg font-semibold mb-4">Trade {asset.name}</h2>
      
      <Tabs value={tradeType} onValueChange={(v) => setTradeType(v as 'buy' | 'sell')}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="buy">Buy</TabsTrigger>
          <TabsTrigger value="sell">Sell</TabsTrigger>
        </TabsList>
        
        <TabsContent value="buy" className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <label htmlFor="buy-amount">Amount to Buy</label>
              <Button variant="ghost" size="sm" className="h-5 text-xs px-2 py-0" onClick={handleSetMaxAmount}>
                Max
              </Button>
            </div>
            <div className="relative">
              <Input
                id="buy-amount"
                type="number"
                placeholder={`Amount of ${asset.symbol.toUpperCase()}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-20"
              />
              <div className="absolute inset-y-0 right-3 flex items-center text-sm font-medium text-muted-foreground">
                {asset.symbol.toUpperCase()}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between text-sm py-2 border-t">
            <span className="text-muted-foreground">Available Balance:</span>
            <span>${formatPrice(balance)}</span>
          </div>
          
          <div className="flex justify-between text-sm py-2">
            <span className="text-muted-foreground">Estimated Cost:</span>
            <span>${formatPrice(estimatedCost)}</span>
          </div>
          
          <Button 
            className="w-full"
            onClick={handleTrade}
            disabled={loading || estimatedCost <= 0 || estimatedCost > balance}
          >
            {loading ? 'Processing...' : `Buy ${asset.symbol.toUpperCase()}`}
          </Button>
        </TabsContent>
        
        <TabsContent value="sell" className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <label htmlFor="sell-amount">Amount to Sell</label>
              <Button variant="ghost" size="sm" className="h-5 text-xs px-2 py-0" onClick={handleSetMaxAmount}>
                Max
              </Button>
            </div>
            <div className="relative">
              <Input
                id="sell-amount"
                type="number"
                placeholder={`Amount of ${asset.symbol.toUpperCase()}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-20"
              />
              <div className="absolute inset-y-0 right-3 flex items-center text-sm font-medium text-muted-foreground">
                {asset.symbol.toUpperCase()}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between text-sm py-2 border-t">
            <span className="text-muted-foreground">Your Holdings:</span>
            <span>
              {portfolioAsset ? portfolioAsset.amount : 0} {asset.symbol.toUpperCase()}
            </span>
          </div>
          
          <div className="flex justify-between text-sm py-2">
            <span className="text-muted-foreground">Estimated Value:</span>
            <span>${formatPrice(estimatedCost)}</span>
          </div>
          
          <Button 
            className="w-full"
            variant="destructive"
            onClick={handleTrade}
            disabled={loading || !portfolioAsset || parseFloat(amount) > portfolioAsset.amount}
          >
            {loading ? 'Processing...' : `Sell ${asset.symbol.toUpperCase()}`}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TradeForm;
