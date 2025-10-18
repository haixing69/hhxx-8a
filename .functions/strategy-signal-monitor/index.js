
    'use strict';

    const cloudbase = require('@cloudbase/node-sdk');
    const WebSocket = require('ws');

    // 初始化云开发
    const app = cloudbase.init({
      env: cloudbase.SYMBOL_CURRENT_ENV,
    });
    const models = app.models;

    // WebSocket 服务器
    let wss = null;
    let isInitialized = false;

    // 初始化 WebSocket 服务器
    async function initWebSocketServer() {
      if (isInitialized) return;
      
      wss = new WebSocket.Server({ port: 9000 });
      
      wss.on('connection', (ws) => {
        console.log('新的 WebSocket 连接建立');
        
        ws.on('message', (message) => {
          console.log('收到消息:', message.toString());
        });
        
        ws.on('close', () => {
          console.log('WebSocket 连接关闭');
        });
      });
      
      isInitialized = true;
      console.log('WebSocket 服务器启动在端口 9000');
    }

    // 广播消息给所有连接的客户端
    function broadcastSignal(signal) {
      if (!wss) return;
      
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'NEW_SIGNAL',
            data: signal
          }));
        }
      });
    }

    // 计算交易信号
    function calculateSignal(strategyData) {
      // 这里实现具体的信号计算逻辑
      // 示例：基于价格和指标计算买卖信号
      const { price, indicator, threshold } = strategyData;
      
      let signal = null;
      
      if (indicator > threshold.upper) {
        signal = {
          type: 'SELL',
          price: price,
          strength: Math.min((indicator - threshold.upper) / threshold.upper, 1),
          timestamp: new Date().toISOString()
        };
      } else if (indicator < threshold.lower) {
        signal = {
          type: 'BUY',
          price: price,
          strength: Math.min((threshold.lower - indicator) / threshold.lower, 1),
          timestamp: new Date().toISOString()
        };
      }
      
      return signal;
    }

    // 监听 live_run 数据模型变化
    async function monitorLiveRun() {
      try {
        // 查询所有状态为 running 的策略
        const runningStrategies = await models.live_run.findMany({
          where: {
            status: 'running'
          }
        });

        for (const strategy of runningStrategies) {
          // 计算信号
          const signal = calculateSignal(strategy);
          
          if (signal) {
            // 创建信号记录
            const signalRecord = await models.signal.create({
              data: {
                strategyId: strategy._id,
                strategyName: strategy.name,
                type: signal.type,
                price: signal.price,
                strength: signal.strength,
                timestamp: signal.timestamp,
                status: 'active'
              }
            });

            // 通过 WebSocket 推送给前端
            broadcastSignal({
              ...signal,
              strategyId: strategy._id,
              strategyName: strategy.name,
              signalId: signalRecord._id
            });

            console.log(`生成新信号: ${signal.type} - ${strategy.name}`);
          }
        }
      } catch (error) {
        console.error('监控策略时出错:', error);
      }
    }

    // 主函数
    exports.main = async (event, context) => {
      const { action } = event;

      switch (action) {
        case 'startMonitor':
          // 初始化 WebSocket
          await initWebSocketServer();
          
          // 设置定时监控（每5秒检查一次）
          setInterval(monitorLiveRun, 5000);
          
          return {
            success: true,
            message: '策略监控已启动'
          };

        case 'getActiveSignals':
          // 获取活跃信号
          const activeSignals = await models.signal.findMany({
            where: {
              status: 'active'
            },
            orderBy: {
              timestamp: 'desc'
            },
            limit: 50
          });
          
          return {
            success: true,
            data: activeSignals
          };

        case 'markSignalProcessed':
          // 标记信号为已处理
          const { signalId } = event.data;
          await models.signal.update({
            where: {
              _id: signalId
            },
            data: {
              status: 'processed'
            }
          });
          
          return {
            success: true,
            message: '信号已标记为已处理'
          };

        default:
          return {
            success: false,
            message: '未知的操作类型'
          };
      }
    };
  