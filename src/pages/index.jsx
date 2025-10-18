// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, useToast, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
// @ts-ignore;
import { Plus, Play, Pause, Trash2, Settings, Filter, RefreshCw, BarChart3, TrendingUp, Zap, Clock, Key, CheckCircle, AlertCircle } from 'lucide-react';

export default function StrategyListPage(props) {
  const {
    $w,
    style
  } = props;
  const {
    toast
  } = useToast();
  const [strategies, setStrategies] = useState({
    backtest: [],
    live: []
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'running', 'stopped'
  const [activeTab, setActiveTab] = useState('backtest'); // 'backtest', 'live'
  const [refreshing, setRefreshing] = useState(false);
  const [apiConfigStatus, setApiConfigStatus] = useState('checking'); // 'checking', 'configured', 'missing'

  useEffect(() => {
    loadStrategies();
    checkApiConfig();
  }, []);
  const loadStrategies = async () => {
    try {
      setLoading(true);
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'strategy',
        methodName: 'wedaGetRecordsV2',
        params: {
          select: {
            $master: true
          },
          orderBy: [{
            createdAt: 'desc'
          }]
        }
      });
      if (result && result.records) {
        const backtestStrategies = result.records.filter(s => s.type === 'backtest');
        const liveStrategies = result.records.filter(s => s.type === 'live');
        setStrategies({
          backtest: backtestStrategies,
          live: liveStrategies
        });
      }
    } catch (error) {
      console.error('加载策略失败:', error);
      toast({
        title: '加载失败',
        description: '无法加载策略数据，请稍后重试',
        variant: 'destructive'
      });
      setStrategies({
        backtest: [],
        live: []
      });
    } finally {
      setLoading(false);
    }
  };
  const checkApiConfig = async () => {
    try {
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'okx_config',
        methodName: 'wedaGetRecordsV2',
        params: {
          limit: 1
        }
      });
      if (result.records && result.records.length > 0) {
        const config = result.records[0];
        if (config.apiKey && config.secretKey && config.passphrase) {
          setApiConfigStatus('configured');
        } else {
          setApiConfigStatus('missing');
        }
      } else {
        setApiConfigStatus('missing');
      }
    } catch (error) {
      console.error('检查API配置失败:', error);
      setApiConfigStatus('missing');
    }
  };
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStrategies();
    await checkApiConfig();
    setRefreshing(false);
    toast({
      title: '刷新成功',
      description: '策略列表已更新'
    });
  };
  const handleCreateStrategy = () => {
    $w.utils.navigateTo({
      pageId: 'strategy-edit',
      params: {
        mode: 'create'
      }
    });
  };
  const handleCreateLiveStrategy = () => {
    $w.utils.navigateTo({
      pageId: 'strategy-create-live',
      params: {}
    });
  };
  const handleCreateBacktestStrategy = () => {
    $w.utils.navigateTo({
      pageId: 'strategy-create-backtest',
      params: {}
    });
  };
  const handleApiConfig = () => {
    $w.utils.navigateTo({
      pageId: 'api-config',
      params: {}
    });
  };
  const handleStrategyClick = strategy => {
    $w.utils.navigateTo({
      pageId: 'strategy-detail',
      params: {
        id: strategy._id || strategy.id
      }
    });
  };
  const handleEditStrategy = (e, strategy) => {
    e.stopPropagation();
    $w.utils.navigateTo({
      pageId: 'strategy-edit',
      params: {
        id: strategy._id || strategy.id,
        mode: 'edit'
      }
    });
  };
  const handleToggleStatus = async (e, strategy) => {
    e.stopPropagation();
    const newStatus = strategy.status === 'running' ? 'stopped' : 'running';
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'strategy',
        methodName: 'wedaUpdateV2',
        params: {
          data: {
            status: newStatus,
            updatedAt: new Date().toISOString()
          },
          filter: {
            where: {
              _id: {
                $eq: strategy._id || strategy.id
              }
            }
          }
        }
      });
      setStrategies(prev => ({
        ...prev,
        [activeTab]: prev[activeTab].map(s => s._id === strategy._id || s.id === strategy.id ? {
          ...s,
          status: newStatus
        } : s)
      }));
      toast({
        title: '状态更新',
        description: `策略 "${strategy.name}" 已${newStatus === 'running' ? '启动' : '停止'}`
      });
    } catch (error) {
      console.error('更新状态失败:', error);
      toast({
        title: '更新失败',
        description: '无法更新策略状态',
        variant: 'destructive'
      });
    }
  };
  const handleDeleteStrategy = async (e, strategy) => {
    e.stopPropagation();
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'strategy',
        methodName: 'wedaDeleteV2',
        params: {
          filter: {
            where: {
              _id: {
                $eq: strategy._id || strategy.id
              }
            }
          }
        }
      });
      setStrategies(prev => ({
        ...prev,
        [activeTab]: prev[activeTab].filter(s => s._id !== strategy._id && s.id !== strategy.id)
      }));
      toast({
        title: '策略已删除',
        description: `策略 "${strategy.name}" 已成功删除`,
        variant: 'destructive'
      });
    } catch (error) {
      console.error('删除策略失败:', error);
      toast({
        title: '删除失败',
        description: '无法删除策略',
        variant: 'destructive'
      });
    }
  };
  const getStatusColor = status => {
    switch (status) {
      case 'running':
        return 'bg-green-500';
      case 'stopped':
        return 'bg-red-500';
      case 'testing':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };
  const getStatusText = status => {
    switch (status) {
      case 'running':
        return '运行中';
      case 'stopped':
        return '已停止';
      case 'testing':
        return '测试中';
      default:
        return '未知';
    }
  };
  const getTypeColor = type => {
    switch (type) {
      case 'backtest':
        return 'bg-blue-500';
      case 'live':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };
  const getTypeText = type => {
    switch (type) {
      case 'backtest':
        return '回测';
      case 'live':
        return '实盘';
      default:
        return '未知';
    }
  };
  const formatDate = dateString => {
    if (!dateString) return '未知';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };
  const filteredStrategies = strategies[activeTab]?.filter(strategy => {
    if (filterStatus === 'all') return true;
    return strategy.status === filterStatus;
  }) || [];
  const stats = {
    total: (strategies.backtest?.length || 0) + (strategies.live?.length || 0),
    running: [...(strategies.backtest || []), ...(strategies.live || [])].filter(s => s.status === 'running').length,
    stopped: [...(strategies.backtest || []), ...(strategies.live || [])].filter(s => s.status === 'stopped').length,
    backtest: strategies.backtest?.length || 0,
    live: strategies.live?.length || 0,
    totalReturn: [...(strategies.backtest || []), ...(strategies.live || [])].reduce((sum, s) => sum + (s.totalReturn || 0), 0)
  };
  const StrategyStats = ({
    stats
  }) => <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-gray-400">总策略数</div>
        </CardContent>
      </Card>
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-green-400">{stats.running}</div>
          <div className="text-sm text-gray-400">运行中</div>
        </CardContent>
      </Card>
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-red-400">{stats.stopped}</div>
          <div className="text-sm text-gray-400">已停止</div>
        </CardContent>
      </Card>
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className={`text-2xl font-bold ${stats.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.totalReturn >= 0 ? '+' : ''}{stats.totalReturn.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-400">总收益</div>
        </CardContent>
      </Card>
    </div>;
  if (loading) {
    return <div style={style} className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 bg-gray-700 rounded"></div>)}
            </div>
          </div>
        </div>
      </div>;
  }
  return <div style={style} className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">量化交易策略</h1>
            <p className="text-gray-400 mt-1">管理您的量化交易策略</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="border-gray-600 text-gray-300 hover:text-white">
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? '刷新中...' : '刷新'}
            </Button>
            <Button onClick={handleCreateStrategy} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              创建策略
            </Button>
          </div>
        </div>

        {/* 新增：API配置状态卡片 */}
        <Card className={`mb-6 cursor-pointer transition-all ${apiConfigStatus === 'configured' ? 'bg-gradient-to-r from-green-600 to-green-700 border-green-500' : 'bg-gradient-to-r from-yellow-600 to-yellow-700 border-yellow-500'} hover:opacity-90`} onClick={handleApiConfig}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Key className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">API配置管理</h3>
                  <p className="text-white/90 mt-1">
                    {apiConfigStatus === 'configured' ? 'API已配置，可以开始实盘交易' : '请先配置交易所API密钥'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {apiConfigStatus === 'configured' ? <CheckCircle className="w-6 h-6 text-white" /> : <AlertCircle className="w-6 h-6 text-white" />}
                <span className="text-white font-medium">
                  {apiConfigStatus === 'configured' ? '已配置' : '待配置'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 创建策略入口卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-600 to-green-700 border-green-500 hover:from-green-700 hover:to-green-800 transition-all cursor-pointer" onClick={handleCreateLiveStrategy}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-500 rounded-lg">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">创建实盘策略</h3>
                  <p className="text-green-100 mt-1">立即运行，真金白银实战交易</p>
                  <p className="text-green-200 text-sm mt-2">连接交易所，实时下单，体验真实交易环境</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-blue-500 hover:from-blue-700 hover:to-blue-800 transition-all cursor-pointer" onClick={handleCreateBacktestStrategy}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">创建回测策略</h3>
                  <p className="text-blue-100 mt-1">用历史数据验证策略效果</p>
                  <p className="text-blue-200 text-sm mt-2">零风险测试，优化策略参数，找到最佳配置</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <StrategyStats stats={stats} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-700">
            <TabsTrigger value="backtest" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" />
              回测策略 ({stats.backtest})
            </TabsTrigger>
            <TabsTrigger value="live" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <TrendingUp className="w-4 h-4 mr-2" />
              实盘策略 ({stats.live})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="backtest" className="space-y-6">
            <div className="mb-6">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">筛选:</span>
                <div className="flex space-x-2">
                  <Button variant={filterStatus === 'all' ? "default" : "outline"} onClick={() => setFilterStatus('all')} className={filterStatus === 'all' ? "bg-blue-600" : "border-gray-600 text-gray-300 hover:text-white"}>
                    全部 ({strategies.backtest?.length || 0})
                  </Button>
                  <Button variant={filterStatus === 'running' ? "default" : "outline"} onClick={() => setFilterStatus('running')} className={filterStatus === 'running' ? "bg-green-600" : "border-gray-600 text-gray-300 hover:text-white"}>
                    运行中 ({strategies.backtest?.filter(s => s.status === 'running').length || 0})
                  </Button>
                  <Button variant={filterStatus === 'stopped' ? "default" : "outline"} onClick={() => setFilterStatus('stopped')} className={filterStatus === 'stopped' ? "bg-red-600" : "border-gray-600 text-gray-300 hover:text-white"}>
                    已停止 ({strategies.backtest?.filter(s => s.status === 'stopped').length || 0})
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStrategies.map(strategy => <Card key={strategy._id || strategy.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer" onClick={() => handleStrategyClick(strategy)}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">{strategy.name}</CardTitle>
                      <div className="flex space-x-1">
                        <Badge className={`${getStatusColor(strategy.status)} text-white`}>
                          {getStatusText(strategy.status)}
                        </Badge>
                        <Badge className={`${getTypeColor(strategy.type)} text-white`}>
                          {getTypeText(strategy.type)}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm">{strategy.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">总收益</span>
                        <span className={`font-bold ${(strategy.totalReturn || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {(strategy.totalReturn || 0) >= 0 ? '+' : ''}{strategy.totalReturn || 0}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">夏普比率</span>
                        <span className="text-white font-bold">{strategy.sharpeRatio || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">胜率</span>
                        <span className="text-white font-bold">{strategy.winRate || 0}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">创建时间</span>
                        <span className="text-gray-400 text-sm">{formatDate(strategy.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-700">
                      <Button variant="outline" size="sm" onClick={e => handleEditStrategy(e, strategy)} className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white">
                        <Settings className="w-3 h-3 mr-1" />
                        编辑
                      </Button>
                      <Button variant="outline" size="sm" onClick={e => handleToggleStatus(e, strategy)} className={strategy.status === 'running' ? 'border-red-600 text-red-400 hover:bg-red-600 hover:text-white' : 'border-green-600 text-green-400 hover:bg-green-600 hover:text-white'}>
                        {strategy.status === 'running' ? '停止' : '启动'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={e => handleDeleteStrategy(e, strategy)} className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white">
                        删除
                      </Button>
                    </div>
                  </CardContent>
                </Card>)}
            </div>

            {filteredStrategies.length === 0 && <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">没有找到回测策略</p>
                  <p className="text-sm mt-2">尝试调整筛选条件或创建新策略</p>
                </div>
                <Button onClick={() => setFilterStatus('all')} variant="outline" className="border-gray-600 text-gray-300 hover:text-white">
                  显示全部
                </Button>
              </div>}
          </TabsContent>

          <TabsContent value="live" className="space-y-6">
            <div className="mb-6">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">筛选:</span>
                <div className="flex space-x-2">
                  <Button variant={filterStatus === 'all' ? "default" : "outline"} onClick={() => setFilterStatus('all')} className={filterStatus === 'all' ? "bg-blue-600" : "border-gray-600 text-gray-300 hover:text-white"}>
                    全部 ({strategies.live?.length || 0})
                  </Button>
                  <Button variant={filterStatus === 'running' ? "default" : "outline"} onClick={() => setFilterStatus('running')} className={filterStatus === 'running' ? "bg-green-600" : "border-gray-600 text-gray-300 hover:text-white"}>
                    运行中 ({strategies.live?.filter(s => s.status === 'running').length || 0})
                  </Button>
                  <Button variant={filterStatus === 'stopped' ? "default" : "outline"} onClick={() => setFilterStatus('stopped')} className={filterStatus === 'stopped' ? "bg-red-600" : "border-gray-600 text-gray-300 hover:text-white"}>
                    已停止 ({strategies.live?.filter(s => s.status === 'stopped').length || 0})
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStrategies.map(strategy => <Card key={strategy._id || strategy.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer" onClick={() => handleStrategyClick(strategy)}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">{strategy.name}</CardTitle>
                      <div className="flex space-x-1">
                        <Badge className={`${getStatusColor(strategy.status)} text-white`}>
                          {getStatusText(strategy.status)}
                        </Badge>
                        <Badge className={`${getTypeColor(strategy.type)} text-white`}>
                          {getTypeText(strategy.type)}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm">{strategy.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">总收益</span>
                        <span className={`font-bold ${(strategy.totalReturn || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {(strategy.totalReturn || 0) >= 0 ? '+' : ''}{strategy.totalReturn || 0}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">夏普比率</span>
                        <span className="text-white font-bold">{strategy.sharpeRatio || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">胜率</span>
                        <span className="text-white font-bold">{strategy.winRate || 0}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">创建时间</span>
                        <span className="text-gray-400 text-sm">{formatDate(strategy.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-700">
                      <Button variant="outline" size="sm" onClick={e => handleEditStrategy(e, strategy)} className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white">
                        <Settings className="w-3 h-3 mr-1" />
                        编辑
                      </Button>
                      <Button variant="outline" size="sm" onClick={e => handleToggleStatus(e, strategy)} className={strategy.status === 'running' ? 'border-red-600 text-red-400 hover:bg-red-600 hover:text-white' : 'border-green-600 text-green-400 hover:bg-green-600 hover:text-white'}>
                        {strategy.status === 'running' ? '停止' : '启动'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={e => handleDeleteStrategy(e, strategy)} className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white">
                        删除
                      </Button>
                    </div>
                  </CardContent>
                </Card>)}
            </div>

            {filteredStrategies.length === 0 && <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">没有找到实盘策略</p>
                  <p className="text-sm mt-2">尝试调整筛选条件或创建新策略</p>
                </div>
                <Button onClick={() => setFilterStatus('all')} variant="outline" className="border-gray-600 text-gray-300 hover:text-white">
                  显示全部
                </Button>
              </div>}
          </TabsContent>
        </Tabs>
      </div>
    </div>;
}