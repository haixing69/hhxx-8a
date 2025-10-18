// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input } from '@/components/ui';

export function BacktestConfig({
  config,
  onConfigChange
}) {
  const periods = [{
    value: '1M',
    label: '1个月'
  }, {
    value: '3M',
    label: '3个月'
  }, {
    value: '6M',
    label: '6个月'
  }, {
    value: '1Y',
    label: '1年'
  }, {
    value: '2Y',
    label: '2年'
  }, {
    value: '3Y',
    label: '3年'
  }];
  const intervals = [{
    value: '1m',
    label: '1分钟'
  }, {
    value: '5m',
    label: '5分钟'
  }, {
    value: '15m',
    label: '15分钟'
  }, {
    value: '1h',
    label: '1小时'
  }, {
    value: '4h',
    label: '4小时'
  }, {
    value: '1D',
    label: '1天'
  }, {
    value: '1W',
    label: '1周'
  }];
  const handleChange = (field, value) => {
    onConfigChange({
      ...config,
      [field]: value
    });
  };
  return <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">回测配置</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="period" className="text-gray-300">回测周期</Label>
            <Select value={config.period} onValueChange={value => handleChange('period', value)}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods.map(period => <SelectItem key={period.value} value={period.value}>{period.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interval" className="text-gray-300">K线周期</Label>
            <Select value={config.interval} onValueChange={value => handleChange('interval', value)}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {intervals.map(interval => <SelectItem key={interval.value} value={interval.value}>{interval.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialCapital" className="text-gray-300">初始资金</Label>
            <Input id="initialCapital" type="number" value={config.initialCapital} onChange={e => handleChange('initialCapital', parseFloat(e.target.value) || 10000)} className="bg-gray-700 border-gray-600 text-white" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-gray-300">开始日期</Label>
            <Input id="startDate" type="date" value={config.startDate} onChange={e => handleChange('startDate', e.target.value)} className="bg-gray-700 border-gray-600 text-white" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-gray-300">结束日期</Label>
            <Input id="endDate" type="date" value={config.endDate} onChange={e => handleChange('endDate', e.target.value)} className="bg-gray-700 border-gray-600 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>;
}