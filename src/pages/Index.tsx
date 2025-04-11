
import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import MarketTable from '@/components/market/MarketTable';
import PortfolioSummary from '@/components/portfolio/PortfolioSummary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CryptoAsset, fetchMarketData } from '@/services/cryptoApi';
import { useToast } from '@/components/ui/use-toast';

const Index = () => {
  const [assets, setAssets] = useState<CryptoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch crypto assets data
  useEffect(() => {
    const getAssets = async () => {
      try {
        setLoading(true);
        const data = await fetchMarketData();
        setAssets(data);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch market data. Please try again later.',
          variant: 'destructive',
        });
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    getAssets();
  }, [toast]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <Tabs defaultValue="market" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="market">Market</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          </TabsList>
          
          <TabsContent value="market">
            <MarketTable />
          </TabsContent>
          
          <TabsContent value="portfolio">
            <div className="space-y-6">
              <PortfolioSummary assets={assets} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
