
import React, { useMemo } from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { CryptoAsset } from '@/services/cryptoApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';

interface PortfolioSummaryProps {
  assets: CryptoAsset[];
}

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ assets }) => {
  const { portfolioAssets, balance, totalValue } = usePortfolio();

  // Colors for pie chart
  const COLORS = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', 
    '#00C49F', '#FFBB28', '#FF8042', '#a4de6c'
  ];

  // Prepare data for pie chart
  const pieData = useMemo(() => {
    const data = portfolioAssets.map((portfolioAsset) => {
      const asset = assets.find(a => a.id === portfolioAsset.assetId);
      const value = asset 
        ? portfolioAsset.amount * asset.currentPrice
        : portfolioAsset.amount * portfolioAsset.averagePrice;

      return {
        name: portfolioAsset.symbol.toUpperCase(),
        value: value
      };
    });

    // Add balance as part of the portfolio
    if (balance > 0) {
      data.push({
        name: 'USD',
        value: balance
      });
    }

    return data;
  }, [portfolioAssets, assets, balance]);

  // Custom tooltip for the pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-3 border border-border rounded-md shadow-md text-left">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            ${payload[0].value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground">
            {((payload[0].value / totalValue) * 100).toFixed(2)}% of portfolio
          </p>
        </div>
      );
    }
    return null;
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Portfolio Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length > 0 ? (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center">
              <p className="text-muted-foreground">No assets in portfolio</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Asset Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {portfolioAssets.length > 0 ? (
            <>
              {portfolioAssets.map((portfolioAsset) => {
                const asset = assets.find(a => a.id === portfolioAsset.assetId);
                const currentValue = asset 
                  ? portfolioAsset.amount * asset.currentPrice
                  : portfolioAsset.amount * portfolioAsset.averagePrice;
                const percentage = (currentValue / totalValue) * 100;

                return (
                  <div key={portfolioAsset.assetId} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{portfolioAsset.symbol.toUpperCase()}</span>
                      <span>${currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={percentage} className="h-2" />
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {formatPercentage(percentage)}
                      </span>
                    </div>
                  </div>
                );
              })}
              
              {/* Balance (USD) */}
              {balance > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">USD</span>
                    <span>${balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={(balance / totalValue) * 100} className="h-2" />
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {formatPercentage((balance / totalValue) * 100)}
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-[250px] flex items-center justify-center">
              <p className="text-muted-foreground">No assets in portfolio</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioSummary;
