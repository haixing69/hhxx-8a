// @ts-ignore;
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Alert, AlertDescription, AlertTitle } from '@/components/ui';
// @ts-ignore;
import { RefreshCw, TrendingUp, AlertCircle, Settings, Clock, BarChart3, WifiOff, CheckCircle, ExternalLink } from 'lucide-react';

export function TradingViewChart({
  symbol,
  data,
  timeframe,
  trades = [],
  height = 400,
  showVolume = true,
  showSignals = true,
  onRefresh
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking'); // checking, connected, error, not_configured
  const [klineData, setKlineData] = useState([]);
  const [apiConfig, setApiConfig] = useState(null);
  const chartRef = useRef(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // 检查API配置
  const checkApiConfig = async () => {
    try {
      setApiStatus('checking');

      // 检查OKX配置
      const configResult = await $w.cloud.callDataSource({
        dataSourceName: 'okx_config',
        methodName: 'wedaGetRecordsV2',
        params: {
          limit: 1
        }
      });
      if (configResult.records && configResult.records.length > 0) {
        const config = configResult.records[0];
        setApiConfig(config);

        // 验证配置完整性
        if (config.apiKey && config.secretKey && config.passphrase) {
          setApiStatus('connected');
          return true;
        } else {
          setApiStatus('not_configured');
          setError({
            type: 'api_config',
            message: 'API配置不完整',
            details: '请完成OKX API配置',
            action: 'configure'
          });
          return false;
        }
      } else {
        setApiStatus('not_configured');
        setError({
          type: 'api_config',
          message: '未配置API密钥',
          details: '请先配置OKX API密钥',
          action: 'configure'
        });
        return false;
      }
    } catch (error) {
      console.error('检查API配置失败:', error);
      setApiStatus('error');
      setError({
        type: 'check_error',
        message: '无法检查API配置',
        details: error.message || '请检查网络连接'
      });
      return false;
    }
  };

  // 检查云函数状态
  const checkCloudFunction = async () => {
    try {
      const result = await $w.cloud.callFunction({
        name: 'backtrader',
        data: {
          action: 'ping'
        }
      });
      return result && result.success;
    } catch (error) {
      console.error('云函数检查失败:', error);
      return false;
    }
  };

  // 加载K线数据
  const loadKlineData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. 检查云函数
      const hasFunction = await checkCloudFunction();
      if (!hasFunction) {
        setError({
          type: 'function_missing',
          message: '数据服务未就绪',
          details: 'backtrader云函数未部署或不可用',
          action: 'deploy'
        });
        setLoading(false);
        return;
      }

      // 2. 检查API配置
      const isApiReady = await checkApiConfig();
      if (!isApiReady) {
        setLoading(false);
        return;
      }

      // 3. 加载数据
      const result = await $w.cloud.callFunction({
        name: 'backtrader',
        data: {
          action: 'get_kline_data',
          symbol: symbol,
          timeframe: timeframe,
          limit: 200
        }
      });
      if (result.success && result.data && result.data.length > 0) {
        setKlineData(result.data);
        setLastUpdate(new Date());
        setError(null);
      } else {
        setError({
          type: 'no_data',
          message: result.message || '无法获取K线数据',
          details: `交易标的: ${symbol}, 时间周期: ${timeframe}`,
          action: 'retry'
        });
        setKlineData([]);
      }
    } catch (error) {
      console.error('加载K线数据失败:', error);

      // 分析具体错误类型
      let errorType = 'load_error';
      let errorMessage = '数据加载失败';
      let errorDetails = error.message || '未知错误';
      if (error.message?.includes('FunctionName')) {
        errorType = 'function_missing';
        errorMessage = '数据服务未部署';
        errorDetails = 'backtrader云函数不存在，请联系管理员';
      } else if (error.message?.includes('timeout')) {
        errorType = 'timeout';
        errorMessage = '请求超时';
        errorDetails = '数据请求超时，请稍后重试';
      } else if (error.message?.includes('permission')) {
        errorType = 'permission';
        errorMessage = '权限不足';
        errorDetails = '请检查云函数权限配置';
      }
      setError({
        type: errorType,
        message: errorMessage,
        details: errorDetails,
        action: 'retry'
      });
    } finally {
      setLoading(false);
    }
  };

  // 渲染图表
  const renderChart = () => {
    if (!chartRef.current || klineData.length === 0) return;
    const container = chartRef.current;
    container.innerHTML = '';
    const chartContainer = document.createElement('div');
    chartContainer.style.width = '100%';
    chartContainer.style.height = `${height}px`;
    chartContainer.style.position = 'relative';
    container.appendChild(chartContainer);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${container.clientWidth} ${height}`);
    chartContainer.appendChild(svg);

    // 计算数据范围
    const prices = klineData.map(d => [d.open, d.high, d.low, d.close]).flat();
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const volumes = klineData.map(d => d.volume);
    const maxVolume = Math.max(...volumes);

    // 图表尺寸
    const chartWidth = container.clientWidth;
    const chartHeight = height;
    const candleWidth = Math.max(2, chartWidth / klineData.length - 1);

    // 绘制网格
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    for (let i = 0; i <= 10; i++) {
      const y = chartHeight / 10 * i;
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', 0);
      line.setAttribute('y1', y);
      line.setAttribute('x2', chartWidth);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', '#374151');
      line.setAttribute('stroke-width', 0.5);
      gridGroup.appendChild(line);
    }
    svg.appendChild(gridGroup);

    // 绘制蜡烛图
    klineData.forEach((candle, index) => {
      const x = index * (chartWidth / klineData.length) + chartWidth / klineData.length / 2;
      const yOpen = chartHeight - (candle.open - minPrice) / priceRange * chartHeight;
      const yClose = chartHeight - (candle.close - minPrice) / priceRange * chartHeight;
      const yHigh = chartHeight - (candle.high - minPrice) / priceRange * chartHeight;
      const yLow = chartHeight - (candle.low - minPrice) / priceRange * chartHeight;

      // 蜡烛实体
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x - candleWidth / 2);
      rect.setAttribute('y', Math.min(yOpen, yClose));
      rect.setAttribute('width', candleWidth);
      rect.setAttribute('height', Math.abs(yClose - yOpen));
      rect.setAttribute('fill', candle.close >= candle.open ? '#10b981' : '#ef4444');
      svg.appendChild(rect);

      // 上下影线
      const wick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      wick.setAttribute('x1', x);
      wick.setAttribute('y1', yHigh);
      wick.setAttribute('x2', x);
      wick.setAttribute('y2', yLow);
      wick.setAttribute('stroke', candle.close >= candle.open ? '#10b981' : '#ef4444');
      wick.setAttribute('stroke-width', 1);
      svg.appendChild(wick);

      // 成交量
      if (showVolume) {
        const volumeHeight = candle.volume / maxVolume * (chartHeight * 0.2);
        const volumeRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        volumeRect.setAttribute('x', x - candleWidth / 2);
        volumeRect.setAttribute('y', chartHeight - volumeHeight);
        volumeRect.setAttribute('width', candleWidth);
        volumeRect.setAttribute('height', volumeHeight);
        volumeRect.setAttribute('fill', candle.close >= candle.open ? '#10b981' : '#ef4444');
        volumeRect.setAttribute('opacity', 0.3);
        svg.appendChild(volumeRect);
      }
    });

    // 绘制交易信号
    if (showSignals && trades.length > 0) {
      trades.forEach(trade => {
        const tradeIndex = klineData.findIndex(d => new Date(d.time) >= new Date(trade.timestamp));
        if (tradeIndex >= 0) {
          const x = tradeIndex * (chartWidth / klineData.length) + chartWidth / klineData.length / 2;
          const y = chartHeight - (trade.price - minPrice) / priceRange * chartHeight;
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', x);
          circle.setAttribute('cy', y);
          circle.setAttribute('r', 4);
          circle.setAttribute('fill', trade.side === 'buy' ? '#10b981' : '#ef4444');
          circle.setAttribute('stroke', '#ffffff');
          circle.setAttribute('stroke-width', 1);
          svg.appendChild(circle);
        }
      });
    }

    // 添加价格标签
    const priceLabels = [minPrice, (minPrice + maxPrice) / 2, maxPrice];
    priceLabels.forEach(price => {
      const y = chartHeight - (price - minPrice) / priceRange * chartHeight;
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', 5);
      text.setAttribute('y', y + 4);
      text.setAttribute('fill', '#9ca3af');
      text.setAttribute('font-size', '12');
      text.textContent = price.toFixed(2);
      svg.appendChild(text);
    });
  };

  // 渲染错误状态
  const renderErrorState = () => {
    if (!error) return null;
    const errorConfig = {
      api_config: {
        icon: Settings,
        title: 'API配置问题',
        message: '请配置OKX API密钥',
        action: '配置API',
        actionHandler: () => $w.utils.navigateTo({
          pageId: 'api-config'
        })
      },
      function_missing: {
        icon: AlertCircle,
        title: '数据服务未就绪',
        message: 'backtrader云函数未部署',
        action: '联系管理员',
        actionHandler: () => {
          // 可以添加联系管理员的操作
          console.log('请联系系统管理员部署backtrader云函数');
        }
      },
      connection_error: {
        icon: WifiOff,
        title: '连接失败',
        message: '无法连接到数据源',
        action: '重试连接',
        actionHandler: loadKlineData
      },
      no_data: {
        icon: BarChart3,
        title: '无数据',
        message: '当前时间段无数据',
        action: '刷新数据',
        actionHandler: loadKlineData
      },
      load_error: {
        icon: AlertCircle,
        title: '加载失败',
        message: '数据加载过程中出错',
        action: '重试',
        actionHandler: loadKlineData
      },
      timeout: {
        icon: Clock,
        title: '请求超时',
        message: '数据请求超时',
        action: '重试',
        actionHandler: loadKlineData
      },
      permission: {
        icon: AlertCircle,
        title: '权限不足',
        message: '请检查云函数权限',
        action: '检查权限',
        actionHandler: loadKlineData
      }
    };
    const config = errorConfig[error.type] || errorConfig.load_error;
    return <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <config.icon className="w-16 h-16 text-gray-500 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">{config.title}</h3>
        <p className="text-gray-400 mb-2">{config.message}</p>
        {error.details && <p className="text-sm text-gray-500 mb-4">{error.details}</p>}
        
        <div className="flex space-x-2">
          <Button onClick={config.actionHandler} variant="outline" className="border-gray-600 text-gray-300 hover:text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            {config.action}
          </Button>
          
          {error.type === 'api_config' && <Button onClick={() => $w.utils.navigateTo({
          pageId: 'api-config'
        })} variant="default" className="bg-blue-600 hover:bg-blue-700">
            <ExternalLink className="w-4 h-4 mr-2" />
            立即配置
          </Button>}
        </div>
      </div>;
  };

  // 渲染加载状态
  const renderLoadingState = () => {
    return <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">加载K线数据中...</h3>
        <p className="text-gray-400">正在获取 {symbol} 的 {timeframe} 数据</p>
        {apiStatus === 'checking' && <p className="text-sm text-gray-500 mt-2">正在验证API连接...</p>}
      </div>;
  };

  // 渲染图表状态栏
  const renderStatusBar = () => {
    return <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
        <div className="flex items-center space-x-4">
          <span>交易标的: {symbol}</span>
          <span>时间周期: {timeframe}</span>
          <span>数据点: {klineData.length}</span>
        </div>
        <div className="flex items-center space-x-2">
          {apiStatus === 'connected' && <Badge variant="default" className="bg-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              已连接
            </Badge>}
          {lastUpdate && <span>更新: {lastUpdate.toLocaleTimeString()}</span>}
        </div>
      </div>;
  };

  // 使用传入的数据或本地数据
  useEffect(() => {
    if (data && data.length > 0) {
      setKlineData(data);
      setError(null);
      setApiStatus('connected');
    } else {
      loadKlineData();
    }
  }, [symbol, timeframe]);

  // 渲染图表
  useEffect(() => {
    if (klineData.length > 0 && !loading && !error) {
      renderChart();
    }
  }, [klineData, trades, height]);
  return <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">交易标的:</span>
          <span className="text-white font-medium">{symbol}</span>
          <span className="text-sm text-gray-400">时间周期:</span>
          <span className="text-white font-medium">{timeframe}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={loadKlineData} disabled={loading} className="text-gray-400 hover:text-white">
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-0">
          <div ref={chartRef} className="w-full" style={{
          height: `${height}px`
        }}>
            {loading && renderLoadingState()}
            {error && !loading && renderErrorState()}
            {!loading && !error && klineData.length === 0 && <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <BarChart3 className="w-12 h-12 text-gray-500 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">暂无数据</h3>
                <p className="text-gray-400">点击刷新按钮获取最新数据</p>
              </div>}
          </div>
        </CardContent>
      </Card>

      {klineData.length > 0 && renderStatusBar()}

      {trades.length > 0 && <div className="mt-4 flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-gray-400">买入信号</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-gray-400">卖出信号</span>
          </div>
        </div>}
    </div>;
}