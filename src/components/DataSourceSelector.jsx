// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
// @ts-ignore;
import { Database, TrendingUp, Settings } from 'lucide-react';

export function DataSourceSelector({
  selectedSource = {},
  onSave
}) {
  const [dataSources, setDataSources] = useState([{
    name: 'okx',
    displayName: 'OKX交易所',
    symbol: 'BTC-USDT',
    description: 'OKX现货交易数据',
    icon: TrendingUp,
    features: ['实时行情', '历史K线', '深度数据']
  }, {
    name: 'binance',
    displayName: 'Binance交易所',
    symbol: 'BTC-USDT',
    description: 'Binance现货交易数据',
    icon: TrendingUp,
    features: ['实时行情', '历史K线', '深度数据']
  }, {
    name: 'coinbase',
    displayName: 'Coinbase交易所',
    symbol: 'BTC-USDT',
    description: 'Coinbase现货交易数据',
    icon: TrendingUp,
    features: ['实时行情', '历史K线']
  }]);
  const [selected, setSelected] = useState(selectedSource?.name || 'okx');
  const [symbol, setSymbol] = useState(selectedSource?.symbol || 'BTC-USDT');
  const handleSelection = sourceName => {
    setSelected(sourceName);
    const source = dataSources.find(ds => ds.name === sourceName);
    if (source && onSave) {
      onSave({
        name: sourceName,
        symbol: symbol,
        displayName: source.displayName
      });
    }
  };
  const handleSymbolChange = newSymbol => {
    setSymbol(newSymbol);
    const source = dataSources.find(ds => ds.name === selected);
    if (source && onSave) {
      onSave({
        name: selected,
        symbol: newSymbol,
        displayName: source.displayName
      });
    }
  };
  const availableSymbols = ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'DOGE-USDT', 'ADA-USDT', 'DOT-USDT', 'LINK-USDT', 'UNI-USDT'];
  return <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dataSources.map(source => {
        const Icon = source.icon;
        const isSelected = selected === source.name;
        return <Card key={source.name} className={`cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700 bg-gray-800 hover:border-gray-600'}`} onClick={() => handleSelection(source.name)}>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-500' : 'bg-gray-700'}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-sm font-medium text-white">
                    {source.displayName}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-400 mb-2">{source.description}</p>
                <div className="space-y-1">
                  {source.features.map((feature, idx) => <div key={idx} className="text-xs text-gray-500 flex items-center">
                      <div className="w-1 h-1 bg-gray-500 rounded-full mr-2"></div>
                      {feature}
                    </div>)}
                </div>
              </CardContent>
            </Card>;
      })}
      </div>

      <div className="mt-4">
        <label className="text-sm font-medium text-gray-300 mb-2 block">交易标的</label>
        <select value={symbol} onChange={e => handleSymbolChange(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          {availableSymbols.map(sym => <option key={sym} value={sym} className="bg-gray-800">
              {sym}
            </option>)}
        </select>
      </div>

      <div className="mt-4 p-4 bg-gray-800 rounded-lg">
        <div className="text-sm text-gray-300">
          <div className="flex items-center justify-between mb-2">
            <span>当前选择:</span>
            <span className="text-blue-400 font-medium">
              {dataSources.find(ds => ds.name === selected)?.displayName || '未选择'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>交易标的:</span>
            <span className="text-blue-400 font-medium">{symbol}</span>
          </div>
        </div>
      </div>
    </div>;
}