
import React, { useState } from 'react';
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { generateChartData } from '@/services/cryptoApi';

interface PriceChartProps {
  assetId: string;
  assetName: string;
  currentPrice: number;
  priceChangePercentage24h: number;
}

const PriceChart: React.FC<PriceChartProps> = ({
  assetId,
  assetName,
  currentPrice,
  priceChangePercentage24h,
}) => {
  const [timeframe, setTimeframe] = useState<string>('1D');
  
  // Available timeframes
  const timeframes = ['1D', '1W', '1M', 'YTD', '1Y'];
  
  // Get chart data based on selected timeframe
  const chartData = generateChartData(timeframe);
  
  // Determine chart color based on price change
  const chartColor = priceChangePercentage24h >= 0 ? 'rgba(22, 199, 132, 1)' : 'rgba(234, 57, 67, 1)';
  const chartGradientFrom = priceChangePercentage24h >= 0 ? 'rgba(22, 199, 132, 0.2)' : 'rgba(234, 57, 67, 0.2)';
  const chartGradientTo = priceChangePercentage24h >= 0 ? 'rgba(22, 199, 132, 0.01)' : 'rgba(234, 57, 67, 0.01)';
  
  // Format price for display
  const formatPrice = (price: number) => {
    if (price >= 1) {
      return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
      return price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 });
    }
  };
  
  // Format date for tooltip
  const formatTooltipDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date);
  };
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-3 border border-border rounded-md shadow-md">
          <p className="text-sm font-medium">
            ${formatPrice(payload[0].value)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatTooltipDate(payload[0].payload.timestamp)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full">
      <div className="flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold">{assetName} Price</h2>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-medium">${formatPrice(currentPrice)}</span>
              <span
                className={cn(
                  'text-sm',
                  priceChangePercentage24h >= 0 ? 'text-crypto-up' : 'text-crypto-down'
                )}
              >
                {priceChangePercentage24h >= 0 ? '+' : ''}
                {priceChangePercentage24h.toFixed(2)}%
              </span>
            </div>
          </div>
          
          <div className="flex gap-1">
            {timeframes.map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeframe(tf)}
                className="text-xs px-2.5 py-1.5 h-8"
              >
                {tf}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartGradientFrom} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={chartGradientTo} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(tick) => {
                  const date = new Date(tick);
                  if (timeframe === '1D') {
                    return date.getHours() + ':00';
                  }
                  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
                }}
                tick={{ fontSize: 12, fill: '#888' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={['dataMin', 'dataMax']}
                tick={{ fontSize: 12, fill: '#888' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(tick) => `$${formatPrice(tick)}`}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke={chartColor}
                fill="url(#colorGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PriceChart;
