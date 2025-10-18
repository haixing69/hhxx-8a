// @ts-ignore;
import React, { useState } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, useToast, Badge, Alert, AlertDescription } from '@/components/ui';
// @ts-ignore;
import { Play, Save, ArrowLeft, Settings, TrendingUp, Zap, RefreshCw } from 'lucide-react';

// @ts-ignore;
import { StrategyParameters } from '@/components/StrategyParameters';
// @ts-ignore;
import { OKXConfigForm } from '@/components/OKXConfigForm';
// @ts-ignore;
import { DataSourceSelector } from '@/components/DataSourceSelector';
export default function StrategyCreateLivePage(props) {
  const {
    $w,
    style
  } = props;
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState({
    name: '',
    description: '',
    type: 'live',
    status: 'stopped',
    symbol: 'BTC-USDT',
    dataSource: 'okx',
    parameters: {
      positionSize: 0.1,
      maxPosition: 1,
      stopLoss: 0.05,
      takeProfit: 0.1,
      initialCapital: 10000
    },
    okxConfig: {
      apiKey: '',
      secretKey: '',
      passphrase: '',
      sandbox: false
    }
  });
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
  const handleOKXConfigChange = config => {
    setStrategy(prev => ({
      ...prev,
      okxConfig: {
        ...prev.okxConfig,
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
    if (!strategy.okxConfig.apiKey || !strategy.okxConfig.secretKey || !strategy.okxConfig.passphrase) {
      toast({
        title: '验证失败',
        description: '请完成OKX交易所配置',
        variant: 'destructive'
      });
      return false;
    }
    return true;
  };
  const handleCreateAndStart = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      // 1. 创建策略
      const strategyResult = await $w.cloud.callDataSource({
        dataSourceName: 'strategy',
        methodName: 'wedaCreateV2',
        params: {
          data: {
            name: strategy.name,
            description: strategy.description,
            type: 'live',
            status: 'stopped',
            symbol: strategy.symbol,
            dataSource: strategy.dataSource,
            parameters: strategy.parameters,
            okxConfig: strategy.okxConfig,
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
        }
      });
      const strategyId = strategyResult.id;

      // 2. 创建实盘运行记录 - 使用 Unix 时间戳
      await $w.cloud.callDataSource({
        dataSourceName: 'live_run',
        methodName: 'wedaCreateV2',
        params: {
          data: {
            strategyId: strategyId,
            status: 'ready',
            startTime: null,
            stopTime: null,
            parameters: strategy.parameters,
            currentCash: strategy.parameters.initialCapital,
            currentValue: strategy.parameters.initialCapital,
            totalReturn: 0,
            totalTrades: 0,
            winRate: 0,
            trades: [],
            lastTradeTime: null,
            createdAt: Date.now()
          }
        }
      });

      // 3. 启动实盘
      await $w.cloud.callDataSource({
        dataSourceName: 'strategy',
        methodName: 'wedaUpdateV2',
        params: {
          data: {
            status: 'running'
          },
          filter: {
            where: {
              _id: {
                $eq: strategyId
              }
            }
          }
        }
      });

      // 4. 更新实盘运行记录状态 - 使用 Unix 时间戳
      await $w.cloud.callDataSource({
        dataSourceName: 'live_run',
        methodName: 'wedaUpdateV2',
        params: {
          data: {
            status: 'running',
            startTime: Date.now()
          },
          filter: {
            where: {
              strategyId: {
                $eq: strategyId
              }
            }
          }
        }
      });
      toast({
        title: '创建成功',
        description: '实盘策略已创建并启动'
      });

      // 5. 跳转到策略详情页
      $w.utils.navigateTo({
        pageId: 'strategy-detail',
        params: {
          id: strategyId
        }
      });
    } catch (error) {
      console.error('创建失败:', error);
      toast({
        title: '创建失败',
        description: error.message || '无法创建实盘策略',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const handleBack = () => {
    $w.utils.navigateBack();
  };
  return <div style={style} className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 页面头部 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={handleBack} className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5 mr-2" />
              返回
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <Zap className="w-8 h-8 mr-3 text-green-400" />
                创建实盘策略
              </h1>
              <p className="text-gray-400 mt-1">配置您的实盘交易策略，立即开始真实交易</p>
            </div>
          </div>
          <Badge className="bg-green-500 text-white">实盘</Badge>
        </div>

        <div className="space-y-6">
          {/* 基本信息 */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                策略基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">策略名称</label>
                <Input value={strategy.name} onChange={e => handleInputChange('name', e.target.value)} placeholder="例如：BTC趋势跟踪策略" className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">策略描述</label>
                <Textarea value={strategy.description} onChange={e => handleInputChange('description', e.target.value)} placeholder="简要描述您的策略逻辑和特点..." className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 min-h-[80px]" />
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

          {/* 交易参数 */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                交易参数配置
              </CardTitle>
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

          {/* OKX交易所配置 */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                OKX交易所配置
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4 bg-blue-900/20 border-blue-800">
                <AlertDescription className="text-blue-200">
                  请确保您的OKX API密钥已开启现货交易权限，并设置了合适的IP白名单
                </AlertDescription>
              </Alert>
              <OKXConfigForm config={strategy.okxConfig} onSave={handleOKXConfigChange} />
            </CardContent>
          </Card>

          {/* 数据源选择 */}
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

          {/* 操作按钮 */}
          <div className="flex space-x-4 pt-6">
            <Button onClick={handleBack} variant="outline" className="border-gray-600 text-gray-300 hover:text-white">
              取消
            </Button>
            <Button onClick={handleCreateAndStart} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
              {loading ? <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  创建中...
                </> : <>
                  <Play className="w-4 h-4 mr-2" />
                  启动实盘
                </>}
            </Button>
          </div>
        </div>
      </div>
    </div>;
}