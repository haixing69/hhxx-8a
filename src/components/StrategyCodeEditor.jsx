// @ts-ignore;
import React, { useState, useRef, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, Badge } from '@/components/ui';
// @ts-ignore;
import { Copy, Check, AlertCircle, Code2, Settings } from 'lucide-react';

export function StrategyCodeEditor({
  code,
  onChange,
  language = 'python',
  height = 400,
  readOnly = false,
  showLineNumbers = true,
  theme = 'dark'
}) {
  const [localCode, setLocalCode] = useState(code || '');
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [lineCount, setLineCount] = useState(1);
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);
  useEffect(() => {
    setLocalCode(code || '');
    updateLineCount(code || '');
  }, [code]);
  useEffect(() => {
    validateCode(localCode);
  }, [localCode]);
  const updateLineCount = text => {
    const count = text.split('\n').length || 1;
    setLineCount(count);
  };
  const validateCode = code => {
    const newErrors = [];
    const newWarnings = [];

    // 基础语法检查
    if (!code.trim()) {
      newErrors.push('策略代码不能为空');
    }
    if (!code.includes('class') || !code.includes('bt.Strategy')) {
      newErrors.push('策略类必须继承自 bt.Strategy');
    }
    if (!code.includes('__init__')) {
      newWarnings.push('建议实现 __init__ 方法进行初始化');
    }
    if (!code.includes('next')) {
      newErrors.push('必须实现 next 方法作为策略主逻辑');
    }
    if (!code.includes('params') && !code.includes('self.params')) {
      newWarnings.push('建议使用 params 定义策略参数，便于配置管理');
    }

    // 检查缩进
    const lines = code.split('\n');
    let hasIndentationError = false;
    lines.forEach((line, index) => {
      if (line.trim() && line.startsWith(' ') && line.length - line.trimStart().length % 4 !== 0) {
        newWarnings.push(`第 ${index + 1} 行缩进不规范，建议使用4个空格`);
      }
    });

    // 检查导入
    if (!code.includes('import backtrader') && !code.includes('import bt')) {
      newWarnings.push('建议显式导入 backtrader 库');
    }
    setErrors(newErrors);
    setWarnings(newWarnings);
  };
  const handleCodeChange = newCode => {
    setLocalCode(newCode);
    updateLineCount(newCode);
    if (onChange) {
      onChange(newCode);
    }
  };
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(localCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };
  const handleKeyDown = e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = localCode.substring(0, start) + '    ' + localCode.substring(end);
      handleCodeChange(newCode);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }

    // 处理括号自动补全
    if (e.key === '(' || e.key === '[' || e.key === '{') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const pairs = {
        '(': ')',
        '[': ']',
        '{': '}'
      };
      const newCode = localCode.substring(0, start) + e.key + pairs[e.key] + localCode.substring(end);
      handleCodeChange(newCode);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1;
        }
      }, 0);
    }
  };
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };
  const getLineNumbers = () => {
    const lines = [];
    for (let i = 1; i <= lineCount; i++) {
      lines.push(i);
    }
    return lines;
  };
  const renderLineNumbers = () => {
    return getLineNumbers().map(num => <div key={num} className="text-gray-500 text-sm leading-6 text-right pr-2">
        {num}
      </div>);
  };
  const renderStatusBar = () => {
    return <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
        <div className="flex items-center space-x-4">
          <span>行数: {lineCount}</span>
          <span>字符数: {localCode.length}</span>
        </div>
        <div className="flex items-center space-x-2">
          {errors.length > 0 && <Badge variant="destructive" className="text-xs">
              <AlertCircle className="w-3 h-3 mr-1" />
              {errors.length} 个错误
            </Badge>}
          {warnings.length > 0 && <Badge variant="warning" className="text-xs">
              <AlertCircle className="w-3 h-3 mr-1" />
              {warnings.length} 个警告
            </Badge>}
        </div>
      </div>;
  };
  const renderErrorPanel = () => {
    if (errors.length === 0 && warnings.length === 0) return null;
    return <Card className="mt-4 bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="space-y-2">
            {errors.map((error, index) => <div key={`error-${index}`} className="flex items-center text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>)}
            {warnings.map((warning, index) => <div key={`warning-${index}`} className="flex items-center text-yellow-400 text-sm">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{warning}</span>
              </div>)}
          </div>
        </CardContent>
      </Card>;
  };
  return <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Code2 className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-gray-300">策略代码编辑器</span>
          <Badge variant="outline" className="text-xs">
            {language}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={handleCopy} className="text-gray-400 hover:text-white h-8">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="relative">
        <div className="flex border border-gray-700 rounded-lg overflow-hidden">
          {showLineNumbers && <div ref={lineNumbersRef} className="bg-gray-900 border-r border-gray-700 overflow-y-hidden" style={{
          width: '50px',
          height: `${height}px`
        }}>
              <div className="p-2">
                {renderLineNumbers()}
              </div>
            </div>}

          <div className="flex-1 relative">
            <textarea ref={textareaRef} value={localCode} onChange={e => handleCodeChange(e.target.value)} onKeyDown={handleKeyDown} onScroll={handleScroll} readOnly={readOnly} className={`w-full p-4 font-mono text-sm bg-gray-900 text-white border-0 focus:outline-none resize-none ${readOnly ? 'cursor-not-allowed opacity-75' : ''}`} style={{
            height: `${height}px`,
            lineHeight: '1.5rem',
            tabSize: 4
          }} placeholder={`# 在此输入您的策略代码
# 示例策略框架：
import backtrader as bt

class MyStrategy(bt.Strategy):
    def __init__(self):
        # 初始化指标
        pass
    
    def next(self):
        # 策略主逻辑
        pass
`} spellCheck={false} />
          </div>
        </div>
      </div>

      {renderStatusBar()}
      {renderErrorPanel()}
    </div>;
}