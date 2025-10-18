// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Input, Label } from '@/components/ui';

export function StrategyParameters({
  parameters,
  onChange
}) {
  const handleParameterChange = (key, value) => {
    onChange({
      ...parameters,
      [key]: isNaN(value) ? value : parseFloat(value)
    });
  };
  const parameterFields = [{
    key: 'short_window',
    label: '短期窗口',
    type: 'number',
    placeholder: '如: 20'
  }, {
    key: 'long_window',
    label: '长期窗口',
    type: 'number',
    placeholder: '如: 50'
  }, {
    key: 'position_size',
    label: '仓位比例',
    type: 'number',
    step: 0.1,
    min: 0,
    max: 1,
    placeholder: '如: 0.8'
  }, {
    key: 'stop_loss',
    label: '止损比例',
    type: 'number',
    step: 0.01,
    placeholder: '如: 0.05'
  }, {
    key: 'take_profit',
    label: '止盈比例',
    type: 'number',
    step: 0.01,
    placeholder: '如: 0.1'
  }];
  return <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">策略参数</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parameterFields.map(field => <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key} className="text-gray-300">{field.label}</Label>
              <Input id={field.key} type={field.type} step={field.step} min={field.min} max={field.max} value={parameters[field.key] || ''} onChange={e => handleParameterChange(field.key, e.target.value)} placeholder={field.placeholder} className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
            </div>)}
        </div>
      </CardContent>
    </Card>;
}