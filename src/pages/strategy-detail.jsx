// @ts-ignore;
import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Tabs, TabsContent, TabsList, TabsTrigger, Alert, AlertDescription } from '@/components/ui';
// @ts-ignore;
import { Play, Pause, RefreshCw, Settings, Clock, TrendingUp, TrendingDown, DollarSign, Target, BarChart3, AlertCircle, Eye, Zap } from 'lucide-react';

// @ts-ignore;
import { StrategyPerformanceCard } from '@/components/StrategyPerformanceCard';
// @ts-ignore;
import { StrategyChart } from '@/components/StrategyChart';
// @ts-ignore;
import { StrategyCodeViewer } from '@/components/StrategyCodeViewer';
// @ts-ignore;
import { TradeHistoryTable } from '@/components/TradeHistoryTable';
// @ts-ignore;
import { PerformanceMetrics } from '@/components/PerformanceMetrics';
// @ts-ignore;
import { TradingViewChart } from '@/components/TradingViewChart';
// @ts-ignore;
import { RealTimePrice } from '@/components/RealTimePrice';
// @ts-ignore;
import { StrategySignals } from '@/components/StrategySignals';
// @ts-ignore;
import { SignalOverlay } from '@/components/SignalOverlay';
export default function StrategyDetailPage(props) {
  const {
    $w,
    style
  } = props;
  const [strategy, setStrategy] = useState(null);
  const [backtestResult, setBacktestResult] = useState(null);
  const [liveRun, setLiveRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLive, setIsLive] = useState(false);
  const [realTimeData, setRealTimeData] = useState(null);
  const [signals, setSignals] = useState([]);
  const [priceAlerts, setPriceAlerts] = useState([]);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const strategyId = props.$w.page.dataset.params?.id;

  // 加载策略详情
  const loadStrategy = async () => {
    if (!strategyId) {
      $w.utils.navigateTo({
        pageId: 'index'
      });
      return;
    }
    try {
      setLoading(true);
      const [strategyData, backtestData, liveData] = await Promise.all([$w.cloud.callDataSource({
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
      }), $w.cloud.callDataSource({
        dataSourceName: 'backtest_result',
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
            createdAt: 'desc'
          }],
          limit: 1
        }
      }), $w.cloud.callDataSource({
        dataSourceName: 'live_run',
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
            createdAt: 'desc'
          }],
          limit: 1
        }
      })]);
      setStrategy(strategyData);
      setBacktestResult(backtestData.records?.[0] || null);
      setLiveRun(liveData.records?.[0] || null);
      setIsLive(liveData.records?.[0]?.status === 'running');
    } catch (error) {
      console.error('加载策略失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载实时数据
  const loadRealTimeData = async () => {
    if (!strategy) return;
    try {
      const result = await $w.cloud.callFunction({
        name: 'backtrader',
        data: {
          action: 'get_realtime_price',
          symbol: strategy.symbol
        }
      });
      if (result.success) {
        setRealTimeData(result.data);
      }
    } catch (error) {
      console.error('加载实时数据失败:', error);
    }
  };

  // 加载策略信号
  const loadSignals = async () => {
    if (!strategy) return;
    try {
      const result = await $w.cloud.callFunction({
        name: 'backtrader',
        data: {
          action: 'get_strategy_signals',
          strategyId: strategyId,
          symbol: strategy.symbol
        }
      });
      if (result.success) {
        setSignals(result.signals || []);
      }
    } catch (error) {
      console.error('加载策略信号失败:', error);
    }
  };

  // 实时数据轮询
  useEffect(() => {
    if (isLive) {
      loadRealTimeData();
      loadSignals();
      const interval = setInterval(() => {
        loadRealTimeData();
        loadSignals();
      }, 5000);
      setRefreshInterval(interval);
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [isLive, strategy]);

  // 初始加载
  useEffect(() => {
    loadStrategy();
  }, [strategyId]);

  // 计算价格提醒
  useEffect(() => {
    if (realTimeData && strategy) {
      const alerts = [];
      const currentPrice = realTimeData.price;
      const {
        parameters
      } = strategy;

      // 检查止损提醒
      if (parameters.stopLoss) {
        const stopLossPrice = currentPrice * (1 - parameters.stopLoss);
        alerts.push({
          type: 'stop_loss',
          price: stopLossPrice,
          message: `止损提醒: 价格接近 ${stopLossPrice.toFixed(2)}`,
          severity: 'warning'
        });
      }

      // 检查止盈提醒
      if (parameters.takeProfit) {
        const takeProfitPrice = currentPrice * (1 + parameters.takeProfit);
        alerts.push({
          type: 'take_profit',
          price: takeProfitPrice,
          message: `止盈提醒: 价格接近 ${takeProfitPrice.toFixed(2)}`,
          severity: 'info'
        });
      }
      setPriceAlerts(alerts);
    }
  }, [realTimeData, strategy]);
  const handleStartLive = async () => {
    try {
      const result = await $w.cloud.callFunction({
        name: 'backtrader',
        data: {
          action: 'start_live_trading',
          strategyId: strategyId,
          symbol: strategy.symbol,
          parameters: strategy.parameters
        }
      });
      if (result.success) {
        setIsLive(true);
      }
    } catch (error) {
      console.error('启动实盘失败:', error);
    }
  };
  const handleStopLive = async () => {
    try {
      const result = await $w.cloud.callFunction({
        name: 'backtrader',
        data: {
          action: 'stop_live_trading',
          strategyId: strategyId
        }
      });
      if (result.success) {
        setIsLive(false);
      }
    } catch (error) {
      console.error('停止实盘失败:', error);
    }
  };
  const handleBack = () => {
    $w.utils.navigateBack();
  };
  const handleEdit = () => {
    $w.utils.navigateTo({
      pageId: 'strategy-edit',
      params: {
        id: strategyId
      }
    });
  };
  if (loading) {
    return <div style={style} className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-64 bg-gray-700 rounded"></div>
              <div className="h-64 bg-gray-700 rounded"></div>
              <div className="h-64 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>;
  }
  if (!strategy) {
    return <div style={style} className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-gray-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">策略不存在</h2>
            <p className="mb-4">无法找到指定的策略</p>
            <Button onClick={handleBack} variant="outline" className="border-gray-600 text-gray-300 hover:text-white">
              返回
            </Button>
          </div>
        </div>
      </div>;
  }
  return <div style={style} className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={handleBack} className="text-gray-400 hover:text-white">
              <TrendingUp className="w-5 h-5 mr-2" />
              返回
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">{strategy.name}</h1>
              <p className="text-gray-400 mt-1">{strategy.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant={isLive ? "default" : "secondary"} className={isLive ? "bg-green-600" : "bg-gray-600"}>
              {isLive ? "实盘运行中" : "已停止"}
            </Badge>
            <Button onClick={handleEdit} variant="outline" className="border-gray-600 text-gray-300 hover:text-white">
              <Settings className="w-4 h-4 mr-2" />
              编辑
            </Button>
            {isLive ? <Button onClick={handleStopLive} variant="destructive" className="bg-red-600 hover:bg-red-700">
                <Pause className="w-4 h-4 mr-2" />
                停止实盘
              </Button> : <Button onClick={handleStartLive} className="bg-green-600 hover:bg-green-700">
                <Play className="w-4 h-4 mr-2" />
                启动实盘
              </Button>}
          </div>
        </div>

        {/* 实时行情面板 */}
        {realTimeData && <RealTimePrice data={realTimeData} symbol={strategy.symbol} />}

        {/* 价格提醒 */}
        {priceAlerts.length > 0 && <div className="mb-4 space-y-2">
            {priceAlerts.map((alert, index) => <Alert key={index} className={alert.severity === 'warning' ? 'bg-yellow-900/20 border-yellow-800' : 'bg-blue-900/20 border-blue-800'}>
                <AlertDescription className="text-white">
                  <div className="flex items-center">
                    <Zap className="w-4 h-4 mr-2" />
                    {alert.message}
                  </div>
                </AlertDescription>
              </Alert>)}
          </div>}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              概览
            </TabsTrigger>
            <TabsTrigger value="chart" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              图表
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              表现
            </TabsTrigger>
            <TabsTrigger value="code" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              代码
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <StrategyChart data={backtestResult} />
              </div>
              <div>
                <StrategyPerformanceCard data={backtestResult} />
              </div>
            </div>

            {isLive && <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Eye className="w-5 h-5 mr-2" />
                      实时策略信号
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StrategySignals signals={signals} />
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">实时K线图</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TradingViewChart symbol={strategy.symbol} timeframe={strategy.backtestConfig?.timeframe || '1h'} trades={signals} />
                  </CardContent>
                </Card>
              </div>}
          </TabsContent>

          <TabsContent value="chart" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">策略回测图表</CardTitle>
              </CardHeader>
              <CardContent>
                <SignalOverlay data={backtestResult} signals={signals} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PerformanceMetrics data={backtestResult} />
              <TradeHistoryTable trades={backtestResult?.trades || []} />
            </div>
          </TabsContent>

          <TabsContent value="code" className="space-y-6">
            <StrategyCodeViewer code={strategy.code} language="python" />
          </TabsContent>
        </Tabs>
      </div>
    </div>;
}