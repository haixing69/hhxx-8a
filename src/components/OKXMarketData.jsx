// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/components/ui';
// @ts-ignore;
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

export function OKXMarketData({
  symbol = 'BTC-USDT'
}) {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    fetchMarketData();
    // 设置定时刷新
    const interval = setInterval(() => {
      fetchMarketData();
    }, 5000);
    return () => clearInterval(interval);
  }, [symbol]);
  const fetchMarketData = async () => {
    try {
      // 模拟OKX API调用
      // 实际使用时应该调用 $w.cloud.callFunction 来调用云函数获取数据
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 模拟市场数据
      const mockData = {
        symbol: symbol,
        price: 43250.50 + Math.random() * 1000 - 500,
        change24h: 2.34 + Math.random() * 4 - 2,
        volume24h: 1250000000 + Math.random() * 500000000,
        high24h: 44500.00,
        low24h: 42100.00,
        timestamp: new Date().toISOString()
      };
      setMarketData(mockData);
      setLoading(false);
    } catch (error) {
      console.error('获取市场数据失败:', error);
      setLoading(false);
    }
  };
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMarketData();
    setRefreshing(false);
  };
  if (loading) {
    return <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
            <div className="h-8 bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>;
  }
  return <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">{marketData.symbol}</CardTitle>
        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing} className="text-gray-400 hover:text-white">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-3xl font-bold text-white">
              ${marketData.price.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
            </p>
            <div className="flex items-center mt-2">
              <Badge className={marketData.change24h >= 0 ? 'bg-green-600' : 'bg-red-600'}>
                {marketData.change24h >= 0 ? '+' : ''}{marketData.change24h.toFixed(2)}%
              </Badge>
              {marketData.change24h >= 0 ? <TrendingUp className="w-4 h-4 text-green-400 ml-2" /> : <TrendingDown className="w-4 h-4 text-red-400 ml-2" />}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">24h最高</span>
              <p className="text-white">${marketData.high24h.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-gray-400">24h最低</span>
              <p className="text-white">${marketData.low24h.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-gray-400">24h成交量</span>
              <p className="text-white">${(marketData.volume24h / 1000000).toFixed(2)}M</p>
            </div>
            <div>
              <span className="text-gray-400">更新时间</span>
              <p className="text-white">{new Date(marketData.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
}