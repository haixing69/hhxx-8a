// @ts-ignore;
import React, { useEffect, useRef } from 'react';
// @ts-ignore;
import { Card, CardContent } from '@/components/ui';

export function SignalOverlay({
  data,
  signals
}) {
  const chartRef = useRef(null);
  useEffect(() => {
    if (!data || !chartRef.current) return;
    const container = chartRef.current;
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = 400;
    canvas.style.width = '100%';
    canvas.style.height = '400px';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 数据准备
    const equityCurve = data.performance?.equityCurve || [];
    const trades = data.trades || [];
    if (equityCurve.length === 0) return;

    // 计算范围
    const prices = equityCurve.map(p => p.value);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // 绘制设置
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    // 绘制背景
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制网格
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) {
      const y = padding + chartHeight / 10 * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }

    // 绘制权益曲线
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    equityCurve.forEach((point, index) => {
      const x = padding + index / (equityCurve.length - 1) * chartWidth;
      const y = padding + chartHeight - (point.value - minPrice) / priceRange * chartHeight;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // 绘制交易信号
    trades.forEach(trade => {
      const index = equityCurve.findIndex(p => new Date(p.time) >= new Date(trade.timestamp));
      if (index >= 0) {
        const x = padding + index / (equityCurve.length - 1) * chartWidth;
        const y = padding + chartHeight - (equityCurve[index].value - minPrice) / priceRange * chartHeight;

        // 绘制信号点
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = trade.side === 'buy' ? '#10b981' : '#ef4444';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // 添加标签
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px sans-serif';
    ctx.fillText(`初始: ${minPrice.toFixed(2)}`, 10, 20);
    ctx.fillText(`最终: ${maxPrice.toFixed(2)}`, 10, 35);
  }, [data, signals]);
  return <div className="w-full">
      <div ref={chartRef} className="w-full" style={{
      height: '400px'
    }}></div>
    </div>;
}