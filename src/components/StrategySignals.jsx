// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Badge } from '@/components/ui';
// @ts-ignore;
import { TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';

export function StrategySignals({
  signals
}) {
  if (!signals || signals.length === 0) {
    return <div className="text-center text-gray-400 py-8">
        <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>暂无策略信号</p>
      </div>;
  }
  const formatCurrency = value => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  const formatTime = timestamp => {
    return new Date(timestamp).toLocaleTimeString('zh-CN');
  };
  return <div className="space-y-3">
      {signals.slice(0, 5).map((signal, index) => <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${signal.side === 'buy' ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
              {signal.side === 'buy' ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
            </div>
            <div>
              <div className="text-white font-medium capitalize">{signal.side}</div>
              <div className="text-sm text-gray-400">{formatTime(signal.timestamp)}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white font-medium">{formatCurrency(signal.price)}</div>
            <Badge variant={signal.side === 'buy' ? "default" : "destructive"} className="text-xs">
              {signal.confidence?.toFixed(1)}% 置信度
            </Badge>
          </div>
        </div>)}
    </div>;
}