
    # 策略信号监控云函数

    ## 功能说明
    该云函数用于实时监控 live_run 数据模型中状态为 running 的策略，计算交易信号并推送给前端。

    ## 使用方法

    ### 1. 启动监控
    ```javascript
    // 在云函数中启动监控
    await wx.cloud.callFunction({
      name: 'strategy-signal-monitor',
      data: {
        action: 'startMonitor'
      }
    });
    ```

    ### 2. 前端 WebSocket 连接
    ```javascript
    // 前端建立 WebSocket 连接
    const ws = new WebSocket('ws://localhost:9000');

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'NEW_SIGNAL') {
        console.log('收到新信号:', message.data);
        // 更新 StrategySignals 组件
      }
    };
    ```

    ### 3. 获取活跃信号
    ```javascript
    const res = await wx.cloud.callFunction({
      name: 'strategy-signal-monitor',
      data: {
        action: 'getActiveSignals'
      }
    });
    console.log(res.result.data); // 活跃信号列表
    ```

    ### 4. 标记信号为已处理
    ```javascript
    await wx.cloud.callFunction({
      name: 'strategy-signal-monitor',
      data: {
        action: 'markSignalProcessed',
        data: {
          signalId: '信号ID'
        }
      }
    });
    ```

    ## 数据模型结构

    ### live_run 模型
    - `_id`: 策略ID
    - `name`: 策略名称
    - `status`: 运行状态 (running/stopped)
    - `price`: 当前价格
    - `indicator`: 指标值
    - `threshold`: 阈值配置

    ### signal 模型
    - `_id`: 信号ID
    - `strategyId`: 关联的策略ID
    - `strategyName`: 策略名称
    - `type`: 信号类型 (BUY/SELL)
    - `price`: 触发价格
    - `strength`: 信号强度 (0-1)
    - `timestamp`: 时间戳
    - `status`: 状态 (active/processed)
  