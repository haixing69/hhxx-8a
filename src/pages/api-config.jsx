// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Switch, useToast, Alert, AlertDescription, AlertTitle } from '@/components/ui';
// @ts-ignore;
import { Save, Shield, Key, Settings, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function ApiConfigPage(props) {
  const {
    $w,
    style
  } = props;
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState({
    apiKey: '',
    secretKey: '',
    passphrase: '',
    sandbox: true
  });
  const [existingConfig, setExistingConfig] = useState(null);
  const [testResult, setTestResult] = useState(null);
  useEffect(() => {
    loadConfig();
  }, []);
  const loadConfig = async () => {
    setLoading(true);
    try {
      const result = await $w.cloud.callDataSource({
        dataSourceName: 'okx_config',
        methodName: 'wedaGetRecordsV2',
        params: {
          select: {
            $master: true
          },
          limit: 1
        }
      });
      if (result.records && result.records.length > 0) {
        const configData = result.records[0];
        setExistingConfig(configData);
        setConfig({
          apiKey: configData.apiKey || '',
          secretKey: configData.secretKey || '',
          passphrase: configData.passphrase || '',
          sandbox: configData.sandbox !== undefined ? configData.sandbox : true
        });
      }
    } catch (error) {
      console.error('加载配置失败:', error);
      toast({
        title: '加载失败',
        description: '无法加载API配置，请检查网络连接',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const handleInputChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setTestResult(null); // 重置测试结果
  };
  const validateConfig = () => {
    if (!config.apiKey.trim()) {
      toast({
        title: '验证失败',
        description: '请输入API密钥',
        variant: 'destructive'
      });
      return false;
    }
    if (!config.secretKey.trim()) {
      toast({
        title: '验证失败',
        description: '请输入密钥',
        variant: 'destructive'
      });
      return false;
    }
    if (!config.passphrase.trim()) {
      toast({
        title: '验证失败',
        description: '请输入密码短语',
        variant: 'destructive'
      });
      return false;
    }
    return true;
  };
  const handleSave = async () => {
    if (!validateConfig()) return;
    setSaving(true);
    try {
      const configData = {
        apiKey: config.apiKey.trim(),
        secretKey: config.secretKey.trim(),
        passphrase: config.passphrase.trim(),
        sandbox: config.sandbox,
        updatedAt: Date.now()
      };
      if (existingConfig) {
        await $w.cloud.callDataSource({
          dataSourceName: 'okx_config',
          methodName: 'wedaUpdateV2',
          params: {
            data: configData,
            filter: {
              where: {
                _id: {
                  $eq: existingConfig._id
                }
              }
            }
          }
        });
      } else {
        await $w.cloud.callDataSource({
          dataSourceName: 'okx_config',
          methodName: 'wedaCreateV2',
          params: {
            data: {
              ...configData,
              createdAt: Date.now()
            }
          }
        });
      }
      toast({
        title: '保存成功',
        description: 'API配置已保存',
        variant: 'default'
      });
      await loadConfig();
    } catch (error) {
      console.error('保存配置失败:', error);
      toast({
        title: '保存失败',
        description: error.message || '无法保存API配置，请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };
  const handleTestConnection = async () => {
    if (!validateConfig()) return;
    setTesting(true);
    setTestResult(null);
    try {
      // 使用 backtrader 云函数测试OKX连接
      const result = await $w.cloud.callFunction({
        name: 'backtrader',
        data: {
          action: 'test_okx_connection',
          config: {
            apiKey: config.apiKey,
            secretKey: config.secretKey,
            passphrase: config.passphrase,
            sandbox: config.sandbox
          }
        }
      });
      setTestResult(result);
      if (result.success) {
        toast({
          title: '连接成功',
          description: `API连接测试通过，账户余额: ${result.balance || '未知'}`,
          variant: 'default'
        });
      } else {
        toast({
          title: '连接失败',
          description: result.message || 'API连接测试失败，请检查配置',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('测试连接失败:', error);
      setTestResult({
        success: false,
        message: '无法连接到交易所，请检查网络配置'
      });
      toast({
        title: '测试失败',
        description: '无法测试API连接，请检查网络配置',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };
  if (loading) {
    return <div style={style} className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              <div className="h-20 bg-gray-700 rounded"></div>
              <div className="h-20 bg-gray-700 rounded"></div>
              <div className="h-20 bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>;
  }
  return <div style={style} className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center">
              <Settings className="w-8 h-8 mr-3 text-blue-400" />
              API配置管理
            </h1>
            <p className="text-gray-400 mt-1">配置您的交易所API密钥</p>
          </div>
          <Button variant="outline" onClick={loadConfig} disabled={loading} className="border-gray-600 text-gray-300 hover:text-white">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              OKX交易所配置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="bg-blue-900/20 border-blue-800">
              <AlertTitle className="text-blue-200">安全提示</AlertTitle>
              <AlertDescription className="text-blue-200">
                请确保您的API密钥已开启现货交易权限，并设置了合适的IP白名单。建议启用沙盒模式进行测试。
              </AlertDescription>
            </Alert>

            {testResult && <Alert className={testResult.success ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}>
                <AlertTitle className={testResult.success ? 'text-green-200' : 'text-red-200'}>
                  {testResult.success ? '连接成功' : '连接失败'}
                </AlertTitle>
                <AlertDescription className={testResult.success ? 'text-green-200' : 'text-red-200'}>
                  {testResult.message || (testResult.success ? 'API连接正常' : '连接测试失败')}
                </AlertDescription>
              </Alert>}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block flex items-center">
                  <Key className="w-4 h-4 mr-2" />
                  API密钥
                </label>
                <Input type="password" value={config.apiKey} onChange={e => handleInputChange('apiKey', e.target.value)} placeholder="请输入您的OKX API密钥" className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block flex items-center">
                  <Key className="w-4 h-4 mr-2" />
                  密钥
                </label>
                <Input type="password" value={config.secretKey} onChange={e => handleInputChange('secretKey', e.target.value)} placeholder="请输入您的OKX密钥" className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block flex items-center">
                  <Key className="w-4 h-4 mr-2" />
                  密码短语
                </label>
                <Input type="password" value={config.passphrase} onChange={e => handleInputChange('passphrase', e.target.value)} placeholder="请输入您的OKX密码短语" className="bg-gray-700 border-gray-600 text-white placeholder-gray-400" />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">沙盒模式</label>
                <Switch checked={config.sandbox} onCheckedChange={checked => handleInputChange('sandbox', checked)} />
              </div>
            </div>

            <div className="flex space-x-4 pt-4 border-t border-gray-700">
              <Button onClick={handleTestConnection} disabled={testing || saving} variant="outline" className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white">
                {testing ? <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    测试中...
                  </> : <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    测试连接
                  </>}
              </Button>
              
              <Button onClick={handleSave} disabled={saving || testing} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                {saving ? <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    保存中...
                  </> : <>
                    <Save className="w-4 h-4 mr-2" />
                    保存配置
                  </>}
              </Button>
            </div>

            {existingConfig && <div className="pt-4 border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                    最后更新: {new Date(existingConfig.updatedAt).toLocaleString('zh-CN')}
                  </div>
                </div>
              </div>}
          </CardContent>
        </Card>
      </div>
    </div>;
}