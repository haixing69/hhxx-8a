// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
// @ts-ignore;
import { TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react';

export function BacktestResults({
  results,
  loading
}) {
  if (loading) {
    return <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-gray-700 rounded"></div>)}
            </div>
          </div>
        </CardContent>
      </Card>;
  }
  if (!results) return null;
  const metrics = [{
    title: '总收益',
    value: `${results.totalReturn >= 0 ? '+' : ''}${results.totalReturn}%`,
    icon: TrendingUp,
    color: results.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'
  }, {
    title: '年化收益',
    value: `${results.annualReturn >= 0 ? '+' : ''}${results.annualReturn}%`,
    icon: TrendingUp,
    color: results.annualReturn >= 0 ? 'text-green-400' : 'text-red-400'
  }, {
    title: '最大回撤',
    value: `${results.maxDrawdown}%`,
    icon: TrendingDown,
    color: 'text-red-400'
  }, {
    title: '夏普比率',
    value: results.sharpeRatio.toString(),
    icon: Target,
    color: 'text-white'
  }, {
    title: '胜率',
    value: `${results.winRate}%`,
    icon: Calendar,
    color: 'text-yellow-400'
  }, {
    title: '交易次数',
    value: results.totalTrades.toString(),
    icon: Target,
    color: 'text-white'
  }, {
    title: '盈利因子',
    value: results.profitFactor.toString(),
    icon: TrendingUp,
    color: results.profitFactor > 1 ? 'text-green-400' : 'text-red-400'
  }, {
    title: '平均持仓天数',
    value: `${results.avgHoldingDays}天`,
    icon: Calendar,
    color: 'text-white'
  }];
  return <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">回测结果</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric, index) => <div key={index} className="bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{metric.title}</p>
                  <p className={`text-xl font-bold ${metric.color}`}>{metric.value}</p>
                </div>
                <metric.icon className={`w-6 h-6 ${metric.color}`} />
              </div>
            </div>)}
        </div>

        {results.trades && results.trades.length > 0 && <div className="mt-6">
            <h3 className="text-lg font-semibold text-white mb-3">最近交易</h3>
            <div className="space-y-2">
              {results.trades.slice(0, 3).map((trade, index) => <div key={index} className="flex justify-between items-center p-3 bg-gray-700 rounded">
                  <div>
                    <span className="text-gray-300">{trade.date}</span>
                    <Badge className={trade.action === 'BUY' ? 'bg-green-600 ml-2' : 'bg-red-600 ml-2'}>
                      {trade.action}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="text-white">${trade.price}</span>
                    {trade.profit && <span className={`ml-2 ${trade.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.profit >= 0 ? '+' : ''}${trade.profit}
                      </span>}
                  </div>
                </div>)}
            </div>
          </div>}
      </CardContent>
    </Card>;
}