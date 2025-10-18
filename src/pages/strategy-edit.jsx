// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Input, Textarea, Label, Card, CardContent, CardHeader, CardTitle, useToast, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui';
// @ts-ignore;
import { ArrowLeft, Save, Trash2, Play, Settings } from 'lucide-react';

// @ts-ignore;
import { StrategyParameters } from '@/components/StrategyParameters';
// @ts-ignore;
import { DataSourceSelector } from '@/components/DataSourceSelector';
// @ts-ignore;
import { OKXMarketData } from '@/components/OKXMarketData';
export default function StrategyEditPage(props) {
  const {
    $w,
    style
  } = props;
  const {
    toast
  } = useToast();
  const [strategy, setStrategy] = useState({
    name: '',
    description: '',
    code: '',
    parameters: {},
    dataSource: 'okx',
    symbol: 'BTC-USDT',
    status: 'stopped'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [okxConnected, setOkxConnected] = useState(false);
  const [mode, setMode] = useState('create');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  useEffect(() => {
    checkOKXConnection();
    const params = $w.page.dataset.params || {};
    const editMode = params.mode || 'create';
    const strategyId = params.id;
    setMode(editMode);
    if (editMode === 'edit' && strategyId) {
      // 模拟加载现有策略
      setTimeout(() => {
        setStrategy({
          id: strategyId,
          name: '均线突破策略',
          description: '基于20日和50日均线的突破策略，使用OKX实时数据',
          code: `# OKX量化交易策略示例
import numpy as np
import pandas as pd

def initialize(context):
    # 初始化策略参数
    context.symbol = 'BTC-USDT'  # OKX交易对
    context.exchange = 'okx'     # 使用OKX数据源
    context.short_window = 20    # 短期均线窗口
    context.long_window = 50     # 长期均线窗口
    context.position_size = 0.8  # 仓位比例
    context.stop_loss = 0.05     # 止损比例
    context.take_profit = 0.1    # 止盈比例
    
def handle_data(context, data):
    # 获取OKX历史K线数据
    kline_data = data.history(
        context.symbol, 
        '1d',  # 日线数据
        max(context.short_window, context.long_window) + 1
    )
    
    if len(kline_data) < context.long_window:
        return
    
    # 计算移动平均线
    short_ma = kline_data['close'].rolling(window=context.short_window).mean()
    long_ma = kline_data['close'].rolling(window=context.long_window).mean()
    
    # 获取当前价格
    current_price = data.current(context.symbol, 'close')
    
    # 获取当前持仓
    current_position = context.portfolio.positions.get(context.symbol, {}).get('amount', 0)
    
    # 交易信号
    if short_ma.iloc[-1] > long_ma.iloc[-1] and current_position == 0:
        # 金叉买入
        order_target_percent(context.symbol, context.position_size)
        context.entry_price = current_price
        
    elif short_ma.iloc[-1] < long_ma.iloc[-1] and current_position > 0:
        # 死叉卖出
        order_target_percent(context.symbol, 0)
        
    elif current_position > 0:
        # 止损止盈检查
        pnl_pct = (current_price - context.entry_price) / context.entry_price
        
        if pnl_pct <= -context.stop_loss:
            # 止损
            order_target_percent(context.symbol, 0)
            context.log(f"止损平仓: {pnl_pct:.2%}")
            
        elif pnl_pct >= context.take_profit:
            # 止盈
            order_target_percent(context.symbol, 0)
            context.log(f"止盈平仓: {pnl_pct:.2%}")

def before_trading_start(context):
    # 每日开盘前运行
    context.log("策略开始运行")
    
def after_trading_end(context):
    # 每日收盘后运行
    context.log("策略运行结束")`,
          parameters: {
            short_window: 20,
            long_window: 50,
            position_size: 0.8,
            stop_loss: 0.05,
            take_profit: 0.1
          },
          dataSource: 'okx',
          symbol: 'BTC-USDT',
          status: 'running'
        });
        setLoading(false);
      }, 1000);
    } else {
      setStrategy({
        name: '',
        description: '',
        code: `# OKX量化交易策略模板
import numpy as np
import pandas as pd

def initialize(context):
    # 初始化策略参数
    context.symbol = 'BTC-USDT'  # OKX交易对
    context.exchange = 'okx'     # 使用OKX数据源
    context.position_size = 1.0  # 仓位比例
    
def handle_data(context, data):
    # 获取OKX市场数据
    kline_data = data.history(context.symbol, '1d', 100)
    current_price = data.current(context.symbol, 'close')
    
    # 在这里编写你的交易逻辑
    # 示例：简单的均线策略
    if len(kline_data) >= 20:
        ma20 = kline_data['close'].rolling(window=20).mean()
        if current_price > ma20.iloc[-1]:
            order_target_percent(context.symbol, context.position_size)
        else:
            order_target_percent(context.symbol, 0)
    
def before_trading_start(context):
    # 每日开盘前运行
    pass
    
def after_trading_end(context):
    # 每日收盘后运行
    pass`,
        parameters: {},
        dataSource: 'okx',
        symbol: 'BTC-USDT',
        status: 'stopped'
      });
      setLoading(false);
    }
  }, []);
  const checkOKXConnection = async () => {
    try {
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'okx_config',
        methodName: 'wedaGetItemV2',
        params: {
          filter: {
            where: {
              userId: {
                $eq: $w.auth.currentUser?.userId || 'default'
              }
            }
          },
          select: {
            $master: true
          }
        }
      });
      setOkxConnected(!!result);
    } catch (error) {
      setOkxConnected(false);
    }
  };
  const handleBack = () => {
    $w.utils.navigateBack();
  };
  const handleSave = async () => {
    if (!strategy.name.trim()) {
      toast({
        title: '错误',
        description: '请输入策略名称',
        variant: 'destructive'
      });
      return;
    }
    setSaving(true);
    toast({
      title: '保存中...',
      description: '正在保存策略配置'
    });

    // 模拟保存过程
    setTimeout(() => {
      setSaving(false);
      toast({
        title: '保存成功',
        description: `策略 "${strategy.name}" 已成功保存`
      });
      $w.utils.navigateBack();
    }, 1500);
  };
  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };
  const handleDeleteConfirm = () => {
    toast({
      title: '策略已删除',
      description: `策略 "${strategy.name}" 已成功删除`,
      variant: 'destructive'
    });

    // 删除后返回列表页
    setTimeout(() => {
      $w.utils.navigateTo({
        pageId: 'index'
      });
    }, 1000);
  };
  const handleTest = () => {
    if (strategy.dataSource === 'okx' && !okxConnected) {
      toast({
        title: '需要配置OKX API',
        description: '请先配置OKX API密钥',
        variant: 'destructive'
      });
      return;
    }
    toast({
      title: '开始测试',
      description: '正在使用OKX数据测试策略...'
    });
  };
  const handleParameterChange = newParameters => {
    setStrategy(prev => ({
      ...prev,
      parameters: newParameters
    }));
  };
  const handleDataSourceChange = newValue => {
    setStrategy(prev => ({
      ...prev,
      ...newValue
    }));
  };
  if (loading) {
    return <div style={style} className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-700 rounded"></div>
              <div className="h-20 bg-gray-700 rounded"></div>
              <div className="h-64 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>;
  }
  return <div style={style} className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={handleBack} className="text-gray-300 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
            <h1 className="text-3xl font-bold text-white">
              {mode === 'create' ? '创建新策略' : '编辑策略'}
            </h1>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleTest} disabled={strategy.dataSource === 'okx' && !okxConnected} className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white">
              <Play className="w-4 h-4 mr-2" />
              测试策略
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              <Save className={`w-4 h-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
              {saving ? '保存中...' : '保存策略'}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">策略名称</label>
                <Input value={strategy.name} onChange={e => setStrategy(prev => ({
                ...prev,
                name: e.target.value
              }))} placeholder="输入策略名称" className="bg-gray-700 border-gray-600 text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">策略描述</label>
                <Textarea value={strategy.description} onChange={e => setStrategy(prev => ({
                ...prev,
                description: e.target.value
              }))} placeholder="描述策略逻辑和用途" className="bg-gray-700 border-gray-600 text-white" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">状态</label>
                <Select value={strategy.status} onValueChange={value => setStrategy(prev => ({
                ...prev,
                status: value
              }))}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="running">运行中</SelectItem>
                    <SelectItem value="stopped">已停止</SelectItem>
                    <SelectItem value="testing">测试中</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">数据源配置</CardTitle>
            </CardHeader>
            <CardContent>
              <DataSourceSelector value={{
              dataSource: strategy.dataSource,
              symbol: strategy.symbol
            }} onChange={handleDataSourceChange} okxConnected={okxConnected} />
            </CardContent>
          </Card>

          {strategy.dataSource === 'okx' && okxConnected && <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">实时行情</CardTitle>
              </CardHeader>
              <CardContent>
                <OKXMarketData symbol={strategy.symbol} />
              </CardContent>
            </Card>}

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">策略参数</CardTitle>
            </CardHeader>
            <CardContent>
              <StrategyParameters parameters={strategy.parameters} onChange={handleParameterChange} />
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">策略代码</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea value={strategy.code} onChange={e => setStrategy(prev => ({
              ...prev,
              code: e.target.value
            }))} placeholder="输入策略代码" className="bg-gray-700 border-gray-600 text-white font-mono text-sm" rows={20} />
            </CardContent>
          </Card>

          {mode === 'edit' && <div className="pt-4 border-t border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-white">危险操作</h3>
                  <p className="text-sm text-gray-400">删除策略后无法恢复，请谨慎操作</p>
                </div>
                <Button variant="outline" onClick={handleDelete} className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white">
                  <Trash2 className="w-4 h-4 mr-2" />
                  删除策略
                </Button>
              </div>
            </div>}
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-gray-800 border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">确认删除策略</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                确定要删除策略 "{strategy.name}" 吗？此操作不可撤销，策略的所有数据将被永久删除。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-700 text-gray-300 hover:bg-gray-600">取消</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white">
                确认删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>;
}