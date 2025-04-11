
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CryptoAsset, fetchMarketData } from '@/services/cryptoApi';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { ArrowUpIcon, ArrowDownIcon, ChevronDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

// Type for sort options
type SortKey = 'name' | 'currentPrice' | 'priceChangePercentage24h' | 'marketCap' | 'volume24h';

const MarketTable: React.FC = () => {
  const [assets, setAssets] = useState<CryptoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('marketCap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Fetch market data
  useEffect(() => {
    const getMarketData = async () => {
      try {
        setLoading(true);
        const data = await fetchMarketData();
        setAssets(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch market data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    getMarketData();
  }, []);

  // Handle sorting
  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      // Toggle order if same key
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New key, set default order based on key
      setSortBy(key);
      setSortOrder(key === 'name' ? 'asc' : 'desc');
    }
  };

  // Apply sorting and filtering
  const sortedAssets = [...assets]
    .filter(asset => {
      if (!searchQuery) return true;
      return asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
             asset.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      let aValue: string | number = a[sortBy as keyof CryptoAsset] as any;
      let bValue: string | number = b[sortBy as keyof CryptoAsset] as any;

      if (sortBy === 'name') {
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // Handle asset click to navigate to detail view
  const handleAssetClick = (assetId: string) => {
    navigate(`/asset/${assetId}`);
  };

  // Handle sort selection from dropdown
  const handleSortSelection = (key: SortKey) => {
    setSortBy(key);
    // Set appropriate default sort order based on the key
    setSortOrder(key === 'name' ? 'asc' : 'desc');
  };

  // Format price with appropriate decimals
  const formatPrice = (price: number) => {
    if (price >= 1) {
      return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
      // For smaller prices, show more decimal places
      return price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 });
    }
  };

  // Format large numbers with abbreviations
  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toString();
  };

  return (
    <div className="w-full">
      {/* Search and sort controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center">
          <span className="text-sm text-muted-foreground mr-2">Sort by:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                {sortBy === 'name' && 'Name'}
                {sortBy === 'currentPrice' && 'Price'}
                {sortBy === 'priceChangePercentage24h' && '24h %'}
                {sortBy === 'marketCap' && 'Market Cap'}
                {sortBy === 'volume24h' && 'Volume'}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleSortSelection('name')}>Name</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortSelection('currentPrice')}>Price</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortSelection('priceChangePercentage24h')}>24h %</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortSelection('marketCap')}>Market Cap</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSortSelection('volume24h')}>Volume</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="ml-2"
          >
            {sortOrder === 'asc' ? (
              <ArrowUpIcon className="h-4 w-4" />
            ) : (
              <ArrowDownIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* Loading state */}
      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center">
          <div className="h-16 w-16 border-4 border-primary border-t-transparent animate-spin rounded-full"></div>
          <p className="mt-4 text-muted-foreground">Loading market data...</p>
        </div>
      ) : (
        /* Market table */
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">#</TableHead>
                <TableHead className="min-w-[180px]">Name</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">24h %</TableHead>
                <TableHead className="text-right hidden md:table-cell">Market Cap</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Volume (24h)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    {searchQuery ? "No assets found matching your search" : "No assets available"}
                  </TableCell>
                </TableRow>
              ) : (
                sortedAssets.map((asset) => (
                  <TableRow 
                    key={asset.id}
                    className="cursor-pointer hover:bg-secondary/50"
                    onClick={() => handleAssetClick(asset.id)}
                  >
                    <TableCell className="font-medium">{asset.marketCapRank}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img 
                          src={asset.image} 
                          alt={asset.name} 
                          className="w-6 h-6 rounded-full" 
                        />
                        <div>
                          <div className="font-medium">{asset.name}</div>
                          <div className="text-xs text-muted-foreground uppercase">{asset.symbol}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${formatPrice(asset.currentPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span 
                        className={`
                          ${asset.priceChangePercentage24h > 0 ? 'text-crypto-up' : ''}
                          ${asset.priceChangePercentage24h < 0 ? 'text-crypto-down' : ''}
                          ${asset.priceChangePercentage24h === 0 ? 'text-crypto-neutral' : ''}
                        `}
                      >
                        {asset.priceChangePercentage24h > 0 ? '+' : ''}
                        {asset.priceChangePercentage24h.toFixed(2)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      ${formatLargeNumber(asset.marketCap)}
                    </TableCell>
                    <TableCell className="text-right hidden lg:table-cell">
                      ${formatLargeNumber(asset.volume24h)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default MarketTable;
