// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent } from '@/components/ui';
// @ts-ignore;
import { TrendingUp, TrendingDown, DollarSign, Clock } from 'lucide-react';

export function RealTimePrice({
  data,
  symbol
}) {
  if (!data) return null;
  const formatCurrency = value => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  const formatPercent = value => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };
  const isPositive = data.change >= 0;
  return <Card className="bg-gray-800 border-gray-700 mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-400 mb-1">{symbol} 实时价格</div>
            <div className="text-2xl font-bold text-white">{formatCurrency(data.price)}</div>
          </div>
          <div className="text-right">
            <div className={`text-lg font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'} flex items-center`}>
              {isPositive ? <TrendingUp className="w-5 h-5 mr-1" /> : <TrendingDown className="w-5 h-5 mr-1" />}
              {formatPercent(data.changePercent)}
            </div>
            <div className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(data.change)}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
          <div>
            <div className="text-gray-400">24h最高</div>
            <div className="text-white">{formatCurrency(data.high24h)}</div>
          </div>
          <div>
            <div className="text-gray-400">24h最低</div>
            <div className="text-white">{formatCurrency(data.low24h)}</div>
          </div>
          <div>
            <div className="text-gray-400">24h成交量</div>
            <div className="text-white">{data.volume24h?.toLocaleString()}</div>
          </div>
        </div>
      </CardContent>
    </Card>;
}