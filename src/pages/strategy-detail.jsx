// @ts-ignore;
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Alert, AlertDescription, AlertTitle } from '@/components/ui';
// @ts-ignore;
import { TrendingUp, TrendingDown, RefreshCw, Clock, BarChart3, DollarSign, Activity, Target, AlertCircle, Wifi, WifiOff } from 'lucide-react';

// @ts-ignore;
import { StrategyPerformanceCard } from '@/components/StrategyPerformanceCard';
// @ts-ignore;
import { PerformanceMetrics } from '@/components/PerformanceMetrics';
// @ts-ignore;
import { TradeHistoryTable } from '@/components/TradeHistoryTable';
// @ts-ignore;
import { TradingViewChart } from '@/components/TradingViewChart';
// @ts-ignore;
import { StrategyCodeViewer } from '@/components/StrategyCodeViewer';
// @ts-ignore;
import { RealTimePrice } from '@/components/RealTimePrice';
// @ts-ignore;
import { StrategySignals } from '@/components/StrategySignals';
// @ts-ignore;
import { SignalOverlay } from '@/components/SignalOverlay';
export default function StrategyDetail(props) {
  const {
    $w
  } = props;
  const strategyId = $w.page.dataset.params?.id;
  const [strategy, setStrategy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [realtimeData, setRealtimeData] = useState(null);
  const [signals, setSignals] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState('1h');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [wsConnection, setWsConnection] = useState('disconnected'); // disconnected, connecting, connected, error
  const [wsError, setWsError] = useState(null);
  const wsRef = useRef(null);

  // 加载策略详情
  const loadStrategy = async () => {
    if (!strategyId) {
      setError('策略ID不能为空');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'strategy',
        methodName: 'wedaGetItemV2',
        params: {
          filter: {
            where: {
              _id: {
                $eq: strategyId
              }
            }
          },
          select: {
            $master: true
          }
        }
      });
      if (result) {
        setStrategy(result);
        // 加载初始数据
        await Promise.all([loadRealtimeData(result.symbol), loadSignals()]);
        // 建立WebSocket连接
        connectWebSocket();
      } else {
        setError('策略不存在');
      }
    } catch (error) {
      console.error('加载策略失败:', error);
      setError('加载策略失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 加载实时行情数据
  const loadRealtimeData = async symbol => {
    try {
      const result = await $w.cloud.callFunction({
        name: 'backtrader',
        data: {
          action: 'get_realtime_data',
          symbol: symbol
        }
      });
      if (result.success) {
        setRealtimeData(result.data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('加载实时数据失败:', error);
    }
  };

  // 加载策略信号
  const loadSignals = async () => {
    if (!strategyId) return;
    try {
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'signal',
        methodName: 'wedaGetRecordsV2',
        params: {
          filter: {
            where: {
              strategyId: {
                $eq: strategyId
              }
            }
          },
          orderBy: [{
            timestamp: 'desc'
          }],
          limit: 50
        }
      });
      if (result.records) {
        setSignals(result.records);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('加载策略信号失败:', error);
    }
  };

  // 建立WebSocket连接
  const connectWebSocket = () => {
    if (!strategyId) return;
    setWsConnection('connecting');
    try {
      // 使用云开发实时推送功能
      const tcb = $w.cloud.getCloudInstance();
      const db = tcb.database();

      // 监听 signal 数据模型的变化
      const watcher = db.collection('signal').where({
        strategyId: strategyId
      }).watch({
        onChange: snapshot => {
          if (snapshot.type === 'init') {
            setWsConnection('connected');
            setWsError(null);
          } else if (snapshot.type === 'change') {
            // 处理新增的信号
            const newSignals = snapshot.docs.map(doc => doc);
            setSignals(prevSignals => {
              // 合并并去重
              const allSignals = [...newSignals, ...prevSignals];
              const uniqueSignals = allSignals.filter((signal, index, self) => index === self.findIndex(s => s._id === signal._id));
              return uniqueSignals.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
            });
            setLastUpdate(new Date());
          }
        },
        onError: error => {
          console.error('WebSocket连接错误:', error);
          setWsConnection('error');
          setWsError(error.message);
        }
      });
      wsRef.current = watcher;

      // 5秒后如果还没连接成功，尝试轮询
      setTimeout(() => {
        if (wsConnection === 'connecting') {
          setWsConnection('disconnected');
          // 启动轮询作为备选方案
          const interval = setInterval(loadSignals, 5000);
          wsRef.current = {
            close: () => clearInterval(interval)
          };
        }
      }, 5000);
    } catch (error) {
      console.error('建立WebSocket连接失败:', error);
      setWsConnection('error');
      setWsError(error.message);
      // 使用轮询作为备选方案
      const interval = setInterval(loadSignals, 5000);
      wsRef.current = {
        close: () => clearInterval(interval)
      };
    }
  };

  // 手动刷新所有数据
  const refreshAllData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadRealtimeData(strategy.symbol), loadSignals()]);
    } finally {
      setRefreshing(false);
    }
  };

  // 清理WebSocket连接
  useEffect(() => {
    return () => {
      if (wsRef.current && wsRef.current.close) {
        wsRef.current.close();
      }
    };
  }, []);

  // 初始加载
  useEffect(() => {
    loadStrategy();
  }, [strategyId]);

  // 格式化函数
  const formatCurrency = value => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };
  const formatPercent = value => {
    return `${value >= 0 ? '+' : ''}${(value || 0).toFixed(2)}%`;
  };
  const formatNumber = value => {
    return new Intl.NumberFormat('zh-CN').format(value || 0);
  };
  const formatTime = timestamp => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  // 连接状态指示器
  const ConnectionStatus = () => {
    const statusConfig = {
      connected: {
        icon: Wifi,
        color: 'text-green-400',
        text: '实时连接'
      },
      connecting: {
        icon: RefreshCw,
        color: 'text-yellow-400',
        text: '连接中...'
      },
      disconnected: {
        icon: WifiOff,
        color: 'text-gray-400',
        text: '已断开'
      },
      error: {
        icon: AlertCircle,
        color: 'text-red-400',
        text: '连接错误'
      }
    };
    const config = statusConfig[wsConnection] || statusConfig.disconnected;
    return <div className={`flex items-center space-x-2 text-sm ${config.color}`}>
        <config.icon className="w-4 h-4" />
        <span>{config.text}</span>
      </div>;
  };

  // 实时行情卡片
  const RealtimeCard = () => {
    if (!realtimeData) return null;
    const change = realtimeData.change24h || 0;
    const isPositive = change >= 0;
    return <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>实时行情</span>
            <div className="flex items-center space-x-2">
              <ConnectionStatus />
              <Button variant="ghost" size="sm" onClick={refreshAllData} disabled={refreshing} className="text-gray-400 hover:text-white">
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{formatCurrency(realtimeData.price)}</div>
              <div className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercent(change)}
              </div>
              <div className="text-xs text-gray-400">当前价格</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-white">{formatCurrency(realtimeData.high24h)}</div>
              <div className="text-xs text-gray-400">24h最高</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-white">{formatCurrency(realtimeData.low24h)}</div>
              <div className="text-xs text-gray-400">24h最低</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-white">{formatNumber(realtimeData.volume24h)}</div>
              <div className="text-xs text-gray-400">24h成交量</div>
            </div>
          </div>
          {lastUpdate && <div className="mt-4 text-xs text-gray-400 text-center">
              最后更新: {formatTime(lastUpdate.getTime())}
            </div>}
        </CardContent>
      </Card>;
  };

  // 时间周期选择器
  const TimeframeSelector = () => {
    const timeframes = [{
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
      value: '1d',
      label: '1天'
    }];
    return <div className="flex space-x-2 mb-4">
        {timeframes.map(tf => <Button key={tf.value} variant={timeframe === tf.value ? 'default' : 'outline'} size="sm" onClick={() => setTimeframe(tf.value)} className={timeframe === tf.value ? 'bg-blue-600' : 'border-gray-600 text-gray-300'}>
            {tf.label}
          </Button>)}
      </div>;
  };
  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
        <span className="ml-2 text-white">加载中...</span>
      </div>;
  }
  if (error) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>;
  }
  if (!strategy) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>策略不存在</AlertTitle>
          <AlertDescription>请检查策略ID是否正确</AlertDescription>
        </Alert>
      </div>;
  }
  return <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* 页面头部 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{strategy.name}</h1>
            <p className="text-gray-400">{strategy.description}</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => $w.utils.navigateBack()} className="border-gray-600 text-gray-300">
              返回
            </Button>
            <Button onClick={() => $w.utils.navigateTo({
            pageId: 'strategy-edit',
            params: {
              id: strategyId
            }
          })} className="bg-blue-600 hover:bg-blue-700">
              编辑策略
            </Button>
          </div>
        </div>

        {/* 实时行情卡片 */}
        <RealtimeCard />

        {/* WebSocket 错误提示 */}
        {wsError && <Alert variant="destructive" className="bg-red-900/20 border-red-700">
            <AlertTitle>连接问题</AlertTitle>
            <AlertDescription>{wsError}，已启用轮询模式</AlertDescription>
          </Alert>}

        {/* 标签页导航 */}
        <div className="border-b border-gray-700">
          <nav className="flex space-x-8">
            {[{
            id: 'overview',
            label: '概览'
          }, {
            id: 'chart',
            label: '图表'
          }, {
            id: 'performance',
            label: '性能'
          }, {
            id: 'trades',
            label: '交易记录'
          }, {
            id: 'code',
            label: '代码'
          }].map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-2 px-1 border-b-2 text-sm font-medium ${activeTab === tab.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-300'}`}>
                {tab.label}
              </button>)}
          </nav>
        </div>

        {/* 内容区域 */}
        <div>
          {activeTab === 'overview' && <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <StrategyPerformanceCard data={strategy.backtestResult} />
                <PerformanceMetrics data={strategy.backtestResult} />
              </div>
              <StrategySignals strategyId={strategyId} symbol={strategy.symbol} />
            </div>}

          {activeTab === 'chart' && <div className="space-y-4">
              <TimeframeSelector />
              <TradingViewChart symbol={strategy.symbol} timeframe={timeframe} trades={signals} height={500} />
            </div>}

          {activeTab === 'performance' && <div className="space-y-6">
              <StrategyPerformanceCard data={strategy.backtestResult} />
              <PerformanceMetrics data={strategy.backtestResult} />
            </div>}

          {activeTab === 'trades' && <TradeHistoryTable trades={strategy.trades || []} />}

          {activeTab === 'code' && <StrategyCodeViewer code={strategy.code} language="python" />}
        </div>
      </div>
    </div>;
}