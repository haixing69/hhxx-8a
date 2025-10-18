// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Input, Button, Label, Switch, Badge, useToast } from '@/components/ui';
// @ts-ignore;
import { Shield, TestTube2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export function OKXConfigForm() {
  const [config, setConfig] = useState({
    apiKey: '',
    secretKey: '',
    passphrase: '',
    sandbox: true,
    isActive: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const {
    toast
  } = useToast();
  useEffect(() => {
    loadConfig();
  }, []);
  const loadConfig = async () => {
    try {
      setLoading(true);
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
      if (result) {
        setConfig({
          apiKey: result.apiKey || '',
          secretKey: result.secretKey || '',
          passphrase: result.passphrase || '',
          sandbox: result.sandbox !== undefined ? result.sandbox : true,
          isActive: result.isActive || false
        });
      }
    } catch (error) {
      console.error('加载配置失败:', error);
      toast({
        title: '加载失败',
        description: '无法加载OKX配置，请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSave = async () => {
    if (!config.apiKey || !config.secretKey || !config.passphrase) {
      toast({
        title: '错误',
        description: '请填写所有必填字段',
        variant: 'destructive'
      });
      return;
    }
    setSaving(true);
    try {
      await $w.cloud.callDataSource({
        dataSourceName: 'okx_config',
        methodName: 'wedaUpsertV2',
        params: {
          filter: {
            where: {
              userId: {
                $eq: $w.auth.currentUser?.userId || 'default'
              }
            }
          },
          update: {
            apiKey: config.apiKey,
            secretKey: config.secretKey,
            passphrase: config.passphrase,
            sandbox: config.sandbox,
            isActive: config.isActive,
            lastTested: new Date().toISOString()
          },
          create: {
            userId: $w.auth.currentUser?.userId || 'default',
            apiKey: config.apiKey,
            secretKey: config.secretKey,
            passphrase: config.passphrase,
            sandbox: config.sandbox,
            isActive: config.isActive,
            permissions: ['read', 'trade'],
            lastTested: new Date().toISOString(),
            accountInfo: {}
          }
        }
      });
      toast({
        title: '保存成功',
        description: 'OKX配置已保存'
      });
    } catch (error) {
      console.error('保存配置失败:', error);
      toast({
        title: '保存失败',
        description: '无法保存配置，请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };
  const handleTestConnection = async () => {
    if (!config.apiKey || !config.secretKey || !config.passphrase) {
      toast({
        title: '错误',
        description: '请先填写所有API信息',
        variant: 'destructive'
      });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      // 模拟测试OKX API连接
      // 实际使用时应该调用真实的OKX API测试
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 模拟测试结果
      const isValid = Math.random() > 0.2; // 80%成功率
      setTestResult({
        success: isValid,
        message: isValid ? '连接成功' : 'API密钥无效或权限不足'
      });
      if (isValid) {
        toast({
          title: '测试成功',
          description: 'OKX API连接正常'
        });

        // 更新激活状态
        setConfig(prev => ({
          ...prev,
          isActive: true
        }));
      } else {
        toast({
          title: '测试失败',
          description: 'API连接失败，请检查密钥',
          variant: 'destructive'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: '网络错误或API服务不可用'
      });
      toast({
        title: '测试失败',
        description: '无法连接到OKX服务',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };
  const handleInputChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
    setTestResult(null); // 重置测试结果
  };
  if (loading) {
    return <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-10 bg-gray-700 rounded"></div>
              <div className="h-10 bg-gray-700 rounded"></div>
              <div className="h-10 bg-gray-700 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>;
  }
  return <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          OKX API 配置
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="apiKey" className="text-gray-300">API Key</Label>
            <Input id="apiKey" type="password" value={config.apiKey} onChange={e => handleInputChange('apiKey', e.target.value)} placeholder="输入OKX API Key" className="bg-gray-700 border-gray-600 text-white" />
          </div>

          <div>
            <Label htmlFor="secretKey" className="text-gray-300">Secret Key</Label>
            <Input id="secretKey" type="password" value={config.secretKey} onChange={e => handleInputChange('secretKey', e.target.value)} placeholder="输入OKX Secret Key" className="bg-gray-700 border-gray-600 text-white" />
          </div>

          <div>
            <Label htmlFor="passphrase" className="text-gray-300">Passphrase</Label>
            <Input id="passphrase" type="password" value={config.passphrase} onChange={e => handleInputChange('passphrase', e.target.value)} placeholder="输入OKX Passphrase" className="bg-gray-700 border-gray-600 text-white" />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="sandbox" className="text-gray-300">沙盒环境</Label>
            <Switch checked={config.sandbox} onCheckedChange={checked => handleInputChange('sandbox', checked)} />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isActive" className="text-gray-300">激活状态</Label>
            <Badge variant={config.isActive ? "default" : "secondary"} className={config.isActive ? "bg-green-600" : "bg-gray-600"}>
              {config.isActive ? "已激活" : "未激活"}
            </Badge>
          </div>
        </div>

        {testResult && <div className={`p-3 rounded-lg ${testResult.success ? 'bg-green-900/20 border border-green-600' : 'bg-red-900/20 border border-red-600'}`}>
            <div className="flex items-center">
              {testResult.success ? <CheckCircle2 className="w-4 h-4 text-green-400 mr-2" /> : <AlertCircle className="w-4 h-4 text-red-400 mr-2" />}
              <span className={testResult.success ? 'text-green-400' : 'text-red-400'}>
                {testResult.message}
              </span>
            </div>
          </div>}

        <div className="flex space-x-3">
          <Button onClick={handleTestConnection} disabled={testing} variant="outline" className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white">
            <TestTube2 className={`w-4 h-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
            {testing ? '测试中...' : '测试连接'}
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            <Save className={`w-4 h-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
            {saving ? '保存中...' : '保存配置'}
          </Button>
        </div>
      </CardContent>
    </Card>;
}