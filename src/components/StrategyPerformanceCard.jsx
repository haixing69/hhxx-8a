// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
// @ts-ignore;
import { TrendingUp, TrendingDown, DollarSign, Target, Clock, BarChart3 } from 'lucide-react';

export function StrategyPerformanceCard({
  data
}) {
  if (!data) {
    return <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="text-center text-gray-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>暂无数据</p>
          </div>
        </CardContent>
      </Card>;
  }
  const formatCurrency = value => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };
  const formatPercent = value => {
    return `${(value || 0) >= 0 ? '+' : ''}${(value || 0).toFixed(2)}%`;
  };
  const formatNumber = value => {
    return new Intl.NumberFormat('zh-CN').format(value || 0);
  };
  const metrics = [{
    label: '总收益',
    value: formatPercent(data.totalReturn),
    icon: data.totalReturn >= 0 ? TrendingUp : TrendingDown,
    color: data.totalReturn >= 0 ? 'text-green-400' : 'text-red-400',
    bgColor: data.totalReturn >= 0 ? 'bg-green-900/20' : 'bg-red-900/20'
  }, {
    label: '初始资金',
    value: formatCurrency(data.initialCapital || data.parameters?.initialCapital),
    icon: DollarSign,
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20'
  }, {
    label: '夏普比率',
    value: (data.sharpeRatio || 0).toFixed(3),
    icon: Target,
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/20'
  }, {
    label: '最大回撤',
    value: formatPercent(-Math.abs(data.maxDrawdown || 0)),
    icon: TrendingDown,
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/20'
  }, {
    label: '交易次数',
    value: formatNumber(data.totalTrades),
    icon: BarChart3,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-900/20'
  }, {
    label: '胜率',
    value: `${(data.winRate || 0).toFixed(1)}%`,
    icon: Target,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-900/20'
  }];
  return <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">策略表现</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {metrics.map((metric, index) => <div key={index} className={`p-4 rounded-lg ${metric.bgColor} border border-gray-700`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{metric.label}</p>
                  <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                </div>
                <metric.icon className={`w-8 h-8 ${metric.color} opacity-80`} />
              </div>
            </div>)}
        </div>
        
        {data.startDate && data.endDate && <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span>回测周期</span>
              </div>
              <span>{data.startDate} 至 {data.endDate}</span>
            </div>
          </div>}
      </CardContent>
    </Card>;
}