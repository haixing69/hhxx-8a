// @ts-ignore;
import React from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

export function StrategyCodeViewer({
  code
}) {
  return <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">策略代码</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="bg-gray-900 text-gray-300 p-4 rounded-lg overflow-x-auto text-sm">
          <code>{code}</code>
        </pre>
      </CardContent>
    </Card>;
}