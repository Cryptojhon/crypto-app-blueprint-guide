
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CryptoAsset, fetchAssetDetails } from '@/services/cryptoApi';
import Header from '@/components/layout/Header';
import PriceChart from '@/components/market/PriceChart';
import TradeForm from '@/components/market/TradeForm';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const AssetDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [asset, setAsset] = useState<CryptoAsset | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Fetch asset details
  useEffect(() => {
    const getAssetDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await fetchAssetDetails(id);
        
        if (!data) {
          toast({
            title: "Asset Not Found",
            description: `Could not find asset with ID: ${id}`,
            variant: "destructive",
          });
          navigate('/');
          return;
        }
        
        setAsset(data);
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Failed to fetch asset details. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    getAssetDetails();
  }, [id, navigate, toast]);
  
  // Format market cap and volume
  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toString();
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 mb-4"
        >
          <ArrowLeft size={16} />
          Back to Markets
        </Button>
        
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center">
            <div className="h-16 w-16 border-4 border-primary border-t-transparent animate-spin rounded-full"></div>
            <p className="mt-4 text-muted-foreground">Loading asset details...</p>
          </div>
        ) : asset ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <img 
                  src={asset.image} 
                  alt={asset.name} 
                  className="w-12 h-12 rounded-full" 
                />
                <div>
                  <h1 className="text-3xl font-bold">{asset.name}</h1>
                  <p className="text-muted-foreground uppercase">{asset.symbol}</p>
                </div>
              </div>
              
              <div className="border rounded-lg p-6 bg-card">
                <PriceChart 
                  assetId={asset.id}
                  assetName={asset.name}
                  currentPrice={asset.currentPrice}
                  priceChangePercentage24h={asset.priceChangePercentage24h}
                />
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Market Cap</p>
                  <p className="text-lg font-medium">${formatLargeNumber(asset.marketCap)}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Volume (24h)</p>
                  <p className="text-lg font-medium">${formatLargeNumber(asset.volume24h)}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Price Change (24h)</p>
                  <p 
                    className={`text-lg font-medium ${
                      asset.priceChange24h > 0 ? 'text-crypto-up' : 
                      asset.priceChange24h < 0 ? 'text-crypto-down' : ''
                    }`}
                  >
                    {asset.priceChange24h > 0 ? '+' : ''}
                    ${Math.abs(asset.priceChange24h).toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Rank</p>
                  <p className="text-lg font-medium">#{asset.marketCapRank}</p>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-1">
              <TradeForm asset={asset} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-lg text-muted-foreground">Asset not found</p>
            <Button 
              className="mt-4" 
              onClick={() => navigate('/')}
            >
              Return to Markets
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default AssetDetail;
