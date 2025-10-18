// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
// @ts-ignore;
import { TrendingUp, TrendingDown, Target, Clock, BarChart3, AlertTriangle } from 'lucide-react';

export function PerformanceMetrics({
  data
}) {
  // 安全获取数据，提供默认值
  const safeData = {
    annualReturn: data?.annualReturn || 0,
    volatility: data?.volatility || 0,
    maxDrawdown: data?.maxDrawdown || 0,
    sharpeRatio: data?.sharpeRatio || 0,
    winRate: data?.winRate || 0,
    profitFactor: data?.profitFactor || 0,
    totalTrades: data?.totalTrades || 0,
    avgTradeReturn: data?.avgTradeReturn || 0,
    avgWin: data?.avgWin || 0,
    avgLoss: data?.avgLoss || 0,
    longestWinStreak: data?.longestWinStreak || 0,
    longestLossStreak: data?.longestLossStreak || 0,
    startDate: data?.startDate || '',
    endDate: data?.endDate || ''
  };
  const formatPercent = value => {
    if (value === null || value === undefined) return '0.00%';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };
  const formatNumber = value => {
    if (value === null || value === undefined) return '0';
    return new Intl.NumberFormat('zh-CN').format(value);
  };
  const formatCurrency = value => {
    if (value === null || value === undefined) return '$0.00';
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  const metrics = [{
    label: '年化收益',
    value: formatPercent(safeData.annualReturn),
    icon: safeData.annualReturn >= 0 ? TrendingUp : TrendingDown,
    color: safeData.annualReturn >= 0 ? 'text-green-400' : 'text-red-400',
    bgColor: safeData.annualReturn >= 0 ? 'bg-green-900/20' : 'bg-red-900/20'
  }, {
    label: '波动率',
    value: formatPercent(safeData.volatility),
    icon: BarChart3,
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20'
  }, {
    label: '最大回撤',
    value: formatPercent(-Math.abs(safeData.maxDrawdown)),
    icon: TrendingDown,
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/20'
  }, {
    label: '夏普比率',
    value: safeData.sharpeRatio.toFixed(3),
    icon: Target,
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/20'
  }, {
    label: '胜率',
    value: `${safeData.winRate.toFixed(1)}%`,
    icon: Target,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-900/20'
  }, {
    label: '盈亏比',
    value: safeData.profitFactor.toFixed(2),
    icon: BarChart3,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-900/20'
  }, {
    label: '总交易',
    value: formatNumber(safeData.totalTrades),
    icon: BarChart3,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-900/20'
  }, {
    label: '平均收益',
    value: formatCurrency(safeData.avgTradeReturn),
    icon: TrendingUp,
    color: safeData.avgTradeReturn >= 0 ? 'text-green-400' : 'text-red-400',
    bgColor: safeData.avgTradeReturn >= 0 ? 'bg-green-900/20' : 'bg-red-900/20'
  }];
  if (!data) {
    return <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="text-center text-gray-400">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>暂无性能数据</p>
            <p className="text-sm mt-1">请先运行回测或实盘</p>
          </div>
        </CardContent>
      </Card>;
  }
  return <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">详细指标</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          {metrics.map((metric, index) => <div key={index} className={`p-4 rounded-lg ${metric.bgColor} border border-gray-700`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{metric.label}</p>
                  <p className={`text-xl font-bold ${metric.color}`}>{metric.value}</p>
                </div>
                <metric.icon className={`w-6 h-6 ${metric.color} opacity-80`} />
              </div>
            </div>)}
        </div>

        {safeData.startDate && safeData.endDate && <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">最长连胜</p>
                <p className="text-white font-medium">{safeData.longestWinStreak} 次</p>
              </div>
              <div>
                <p className="text-gray-400">最长连败</p>
                <p className="text-white font-medium">{safeData.longestLossStreak} 次</p>
              </div>
              <div>
                <p className="text-gray-400">平均盈利</p>
                <p className="text-green-400 font-medium">{formatCurrency(safeData.avgWin)}</p>
              </div>
              <div>
                <p className="text-gray-400">平均亏损</p>
                <p className="text-red-400 font-medium">{formatCurrency(safeData.avgLoss)}</p>
              </div>
            </div>
          </div>}
      </CardContent>
    </Card>;
}