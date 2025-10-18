// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, useToast, Badge, Alert, AlertDescription, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
// @ts-ignore;
import { Play, Save, ArrowLeft, Settings, Clock, BarChart3, Code, RefreshCw } from 'lucide-react';

// @ts-ignore;
import { StrategyParameters } from '@/components/StrategyParameters';
// @ts-ignore;
import { DataSourceSelector } from '@/components/DataSourceSelector';
// @ts-ignore;
import { BacktestConfig } from '@/components/BacktestConfig';
// @ts-ignore;
import { StrategyCodeEditor } from '@/components/StrategyCodeEditor';
export default function StrategyCreateBacktestPage(props) {
  const {
    $w,
    style
  } = props;
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [strategy, setStrategy] = useState({
    name: '',
    description: '',
    type: 'backtest',
    status: 'ready',
    symbol: 'BTC-USDT',
    dataSource: 'okx',
    parameters: {
      initialCapital: 10000,
      positionSize: 0.1,
      maxPosition: 1,
      stopLoss: 0.05,
      takeProfit: 0.1
    },
    backtestConfig: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      timeframe: '1h'
    },
    code: `# 回测策略示例 - 移动平均线交叉策略
import backtrader as bt

class MovingAverageCrossStrategy(bt.Strategy):
    params = (
        ('fast_period', 10),
        ('slow_period', 30),
        ('stop_loss', 0.05),
        ('take_profit', 0.1),
    )
    
    def __init__(self):
        self.fast_ma = bt.indicators.SimpleMovingAverage(
            self.data.close, period=self.params.fast_period
        )
        self.slow_ma = bt.indicators.SimpleMovingAverage(
            self.data.close, period=self.params.slow_period
        )
        self.crossover = bt.indicators.CrossOver(self.fast_ma, self.slow_ma)
        
    def next(self):
        if not self.position:
            if self.crossover > 0:  # 金叉
                self.buy()
        else:
            if self.crossover < 0:  # 死叉
                self.sell()
                
    def notify_order(self, order):
        if order.status in [order.Completed]:
            if order.isbuy():
                self.log(f'买入执行, 价格: {order.executed.price:.2f}')
            else:
                self.log(f'卖出执行, 价格: {order.executed.price:.2f}')
    
    def log(self, txt, dt=None):
        dt = dt or self.datas[0].datetime.date(0)
        print(f'{dt.isoformat()} {txt}')

# 策略参数配置
strategy_params = {
    'fast_period': 10,
    'slow_period': 30,
    'stop_loss': 0.05,
    'take_profit': 0.1
}`
  });
  const [codeTemplates] = useState([{
    name: '移动平均线交叉',
    description: '基于快慢均线交叉的经典趋势跟踪策略',
    code: `# 移动平均线交叉策略
import backtrader as bt

class MovingAverageCrossStrategy(bt.Strategy):
    params = (
        ('fast_period', 10),
        ('slow_period', 30),
    )
    
    def __init__(self):
        self.fast_ma = bt.indicators.SimpleMovingAverage(
            self.data.close, period=self.params.fast_period
        )
        self.slow_ma = bt.indicators.SimpleMovingAverage(
            self.data.close, period=self.params.slow_period
        )
        self.crossover = bt.indicators.CrossOver(self.fast_ma, self.slow_ma)
        
    def next(self):
        if not self.position:
            if self.crossover > 0:
                self.buy()
        else:
            if self.crossover < 0:
                self.sell()`
  }, {
    name: 'RSI超买超卖',
    description: '基于RSI指标的超买超卖反转策略',
    code: `# RSI超买超卖策略
import backtrader as bt

class RSIStrategy(bt.Strategy):
    params = (
        ('rsi_period', 14),
        ('rsi_overbought', 70),
        ('rsi_oversold', 30),
    )
    
    def __init__(self):
        self.rsi = bt.indicators.RSI(
            self.data.close, period=self.params.rsi_period
        )
        
    def next(self):
        if not self.position:
            if self.rsi < self.params.rsi_oversold:
                self.buy()
        else:
            if self.rsi > self.params.rsi_overbought:
                self.sell()`
  }, {
    name: '布林带突破',
    description: '基于布林带通道的突破策略',
    code: `# 布林带突破策略
import backtrader as bt

class BollingerBandsStrategy(bt.Strategy):
    params = (
        ('bb_period', 20),
        ('bb_dev', 2),
    )
    
    def __init__(self):
        self.bb = bt.indicators.BollingerBands(
            self.data.close, 
            period=self.params.bb_period,
            devfactor=self.params.bb_dev
        )
        
    def next(self):
        if not self.position:
            if self.data.close > self.bb.lines.top:
                self.buy()
            elif self.data.close < self.bb.lines.bot:
                self.sell()
        else:
            if self.position.size > 0 and self.data.close < self.bb.lines.mid:
                self.sell()
            elif self.position.size < 0 and self.data.close > self.bb.lines.mid:
                self.buy()`
  }, {
    name: 'MACD趋势',
    description: '基于MACD指标的趋势跟踪策略',
    code: `# MACD趋势策略
import backtrader as bt

class MACDStrategy(bt.Strategy):
    params = (
        ('macd_fast', 12),
        ('macd_slow', 26),
        ('macd_signal', 9),
    )
    
    def __init__(self):
        self.macd = bt.indicators.MACD(
            self.data.close,
            period_me1=self.params.macd_fast,
            period_me2=self.params.macd_slow,
            period_signal=self.params.macd_signal
        )
        
    def next(self):
        if not self.position:
            if self.macd.macd > self.macd.signal:
                self.buy()
        else:
            if self.macd.macd < self.macd.signal:
                self.sell()`
  }]);
  const handleInputChange = (field, value) => {
    setStrategy(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleParametersChange = parameters => {
    setStrategy(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        ...parameters
      }
    }));
  };
  const handleBacktestConfigChange = config => {
    setStrategy(prev => ({
      ...prev,
      backtestConfig: {
        ...prev.backtestConfig,
        ...config
      }
    }));
  };
  const handleDataSourceChange = dataSource => {
    setStrategy(prev => ({
      ...prev,
      dataSource: dataSource.name,
      symbol: dataSource.symbol
    }));
  };
  const handleCodeChange = code => {
    setStrategy(prev => ({
      ...prev,
      code: code
    }));
  };
  const handleTemplateSelect = template => {
    setStrategy(prev => ({
      ...prev,
      code: template.code
    }));
    toast({
      title: '模板已应用',
      description: `已加载${template.name}策略模板`,
      variant: 'default'
    });
  };
  const validateForm = () => {
    if (!strategy.name.trim()) {
      toast({
        title: '验证失败',
        description: '请输入策略名称',
        variant: 'destructive'
      });
      return false;
    }
    if (!strategy.description.trim()) {
      toast({
        title: '验证失败',
        description: '请输入策略描述',
        variant: 'destructive'
      });
      return false;
    }
    if (!strategy.code.trim()) {
      toast({
        title: '验证失败',
        description: '请输入策略代码',
        variant: 'destructive'
      });
      return false;
    }
    return true;
  };
  const handleCreateAndRun = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      // 1. 创建策略
      const strategyResult = await $w.cloud.callDataSource({
        dataSourceName: 'strategy',
        methodName: 'wedaCreateV2',
        params: {
          data: {
            name: strategy.name,
            description: strategy.description,
            type: 'backtest',
            status: 'ready',
            symbol: strategy.symbol,
            dataSource: strategy.dataSource,
            parameters: strategy.parameters,
            backtestConfig: strategy.backtestConfig,
            code: strategy.code,
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
        }
      });
      const strategyId = strategyResult.id;

      // 2. 启动回测
      const backtestResult = await $w.cloud.callFunction({
        name: 'backtrader',
        data: {
          action: 'run_backtest',
          strategyId: strategyId,
          code: strategy.code,
          symbol: strategy.symbol,
          startDate: strategy.backtestConfig.startDate,
          endDate: strategy.backtestConfig.endDate,
          timeframe: strategy.backtestConfig.timeframe,
          parameters: strategy.parameters
        }
      });
      if (backtestResult.success) {
        // 3. 保存回测结果
        await $w.cloud.callDataSource({
          dataSourceName: 'backtest_result',
          methodName: 'wedaCreateV2',
          params: {
            data: {
              strategyId: strategyId,
              startDate: strategy.backtestConfig.startDate,
              endDate: strategy.backtestConfig.endDate,
              timeframe: strategy.backtestConfig.timeframe,
              totalReturn: backtestResult.totalReturn || 0,
              sharpeRatio: backtestResult.sharpeRatio || 0,
              maxDrawdown: backtestResult.maxDrawdown || 0,
              totalTrades: backtestResult.totalTrades || 0,
              winRate: backtestResult.winRate || 0,
              trades: backtestResult.trades || [],
              performance: backtestResult.performance || {},
              createdAt: Date.now()
            }
          }
        });
        toast({
          title: '创建成功',
          description: '回测策略已创建并运行完成'
        });

        // 4. 跳转到策略详情页
        $w.utils.navigateTo({
          pageId: 'strategy-detail',
          params: {
            id: strategyId
          }
        });
      } else {
        throw new Error(backtestResult.message || '回测运行失败');
      }
    } catch (error) {
      console.error('创建失败:', error);
      toast({
        title: '创建失败',
        description: error.message || '无法创建回测策略',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };
  const handleBack = () => {
    $w.utils.navigateBack();
  };
  if (loading) {
    return <div style={style} className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              <div className="h-20 bg-gray-700 rounded"></div>
              <div className="h-64 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>;
  }
  return <div style={style} className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={handleBack} className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5 mr-2" />
              返回
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <BarChart3 className="w-8 h-8 mr-3 text-blue-400" />
                创建回测策略
              </h1>
              <p className="text-gray-400 mt-1">编写策略代码，用历史数据验证策略效果</p>
            </div>
          </div>
          <Badge className="bg-blue-500 text-white">回测</Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
            <TabsTrigger value="basic" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              基本信息
            </TabsTrigger>
            <TabsTrigger value="config" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              回测配置
            </TabsTrigger>
            <TabsTrigger value="code" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              策略代码
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">策略基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">策略名称</label>
                  <Input value={strategy.name} onChange={e => handleInputChange('name', e.target.value)} placeholder="例如：BTC均线交叉策略" className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">策略描述</label>
                  <Textarea value={strategy.description} onChange={e => handleInputChange('description', e.target.value)} placeholder="详细描述您的策略逻辑、适用场景和风险控制..." className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 min-h-[100px]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">交易标的</label>
                  <Select value={strategy.symbol} onValueChange={value => handleInputChange('symbol', value)}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="选择交易标的" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="BTC-USDT">BTC-USDT</SelectItem>
                      <SelectItem value="ETH-USDT">ETH-USDT</SelectItem>
                      <SelectItem value="SOL-USDT">SOL-USDT</SelectItem>
                      <SelectItem value="DOGE-USDT">DOGE-USDT</SelectItem>
                      <SelectItem value="ADA-USDT">ADA-USDT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">交易参数配置</CardTitle>
              </CardHeader>
              <CardContent>
                <StrategyParameters parameters={strategy.parameters} onSave={handleParametersChange} config={{
                fields: [{
                  key: 'initialCapital',
                  label: '初始资金 (USDT)',
                  type: 'number',
                  min: 100,
                  max: 1000000
                }, {
                  key: 'positionSize',
                  label: '单笔仓位比例',
                  type: 'number',
                  min: 0.01,
                  max: 1,
                  step: 0.01
                }, {
                  key: 'maxPosition',
                  label: '最大持仓倍数',
                  type: 'number',
                  min: 1,
                  max: 10
                }, {
                  key: 'stopLoss',
                  label: '止损比例',
                  type: 'number',
                  min: 0.01,
                  max: 0.5,
                  step: 0.01
                }, {
                  key: 'takeProfit',
                  label: '止盈比例',
                  type: 'number',
                  min: 0.01,
                  max: 1,
                  step: 0.01
                }]
              }} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">回测配置</CardTitle>
              </CardHeader>
              <CardContent>
                <BacktestConfig config={strategy.backtestConfig} onSave={handleBacktestConfigChange} />
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">数据源配置</CardTitle>
              </CardHeader>
              <CardContent>
                <DataSourceSelector selectedSource={{
                name: strategy.dataSource,
                symbol: strategy.symbol
              }} onSave={handleDataSourceChange} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="code" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>策略代码编辑器</span>
                  <div className="flex space-x-2">
                    <Select onValueChange={value => {
                    const template = codeTemplates.find(t => t.name === value);
                    if (template) handleTemplateSelect(template);
                  }}>
                      <SelectTrigger className="w-[180px] bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="选择模板" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {codeTemplates.map(template => <SelectItem key={template.name} value={template.name}>
                            {template.name}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StrategyCodeEditor code={strategy.code} onChange={handleCodeChange} language="python" height={500} />
                
                <Alert className="mt-4 bg-blue-900/20 border-blue-800">
                  <AlertDescription className="text-blue-200">
                    <div className="space-y-2">
                      <p><strong>使用说明：</strong></p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>策略类必须继承自 bt.Strategy</li>
                        <li>必须实现 __init__ 和 next 方法</li>
                        <li>策略参数通过 params 元组定义</li>
                        <li>使用 self.data.close 获取收盘价数据</li>
                        <li>使用 self.buy() 和 self.sell() 进行交易</li>
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex space-x-4 pt-6">
          <Button onClick={handleBack} variant="outline" className="border-gray-600 text-gray-300 hover:text-white">
            取消
          </Button>
          <Button onClick={handleCreateAndRun} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                创建中...
              </> : <>
                <Play className="w-4 h-4 mr-2" />
                创建并运行回测
              </>}
          </Button>
        </div>
      </div>
    </div>;
}