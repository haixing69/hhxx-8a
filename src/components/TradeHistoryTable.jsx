// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';

export function TradeHistoryTable({
  trades
}) {
  return <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">交易记录</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-700">
              <tr>
                <th className="px-6 py-3">日期</th>
                <th className="px-6 py-3">操作</th>
                <th className="px-6 py-3">价格</th>
                <th className="px-6 py-3">数量</th>
                <th className="px-6 py-3">金额</th>
                <th className="px-6 py-3">盈亏</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade, index) => <tr key={index} className="border-b border-gray-700 hover:bg-gray-700">
                  <td className="px-6 py-4">{trade.date}</td>
                  <td className="px-6 py-4">
                    <Badge className={trade.action === 'BUY' ? 'bg-green-600' : 'bg-red-600'}>
                      {trade.action}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">¥{trade.price}</td>
                  <td className="px-6 py-4">{trade.shares}</td>
                  <td className="px-6 py-4">¥{trade.value.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    {trade.profit && <span className={trade.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {trade.profit >= 0 ? '+' : ''}¥{trade.profit}
                      </span>}
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>;
}