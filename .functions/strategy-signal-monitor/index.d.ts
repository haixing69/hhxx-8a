
    interface Signal {
      _id?: string;
      strategyId: string;
      strategyName: string;
      type: 'BUY' | 'SELL';
      price: number;
      strength: number;
      timestamp: string;
      status: 'active' | 'processed';
    }

    interface LiveRun {
      _id: string;
      name: string;
      status: 'running' | 'stopped';
      price: number;
      indicator: number;
      threshold: {
        upper: number;
        lower: number;
      };
    }

    interface WebSocketMessage {
      type: string;
      data: any;
    }

    interface StartMonitorData {}
    interface GetActiveSignalsData {}
    interface MarkSignalProcessedData {
      signalId: string;
    }

    type EventAction = 
      | 'startMonitor'
      | 'getActiveSignals'
      | 'markSignalProcessed';

    interface CloudFunctionEvent {
      action: EventAction;
      data?: StartMonitorData | GetActiveSignalsData | MarkSignalProcessedData;
    }

    export declare function main(event: CloudFunctionEvent, context: any): Promise<any>;
  