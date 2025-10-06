import { getRealtimeMetricsService, RealtimeMetric, LiveInsight } from '@/services/realtimeMetricsService';
import { getSmartWebSocketService, WebSocketMessage } from '@/services/smartWebSocketService';

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  type: 'connection' | 'metrics' | 'insights' | 'performance' | 'stress';
  duration: number; // in milliseconds
  expectedResults: {
    minMessagesReceived?: number;
    maxLatency?: number;
    minSuccessRate?: number;
    maxErrorRate?: number;
  };
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
  validate?: (results: TestResults) => boolean;
}

export interface TestResults {
  scenarioId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  success: boolean;
  metrics: {
    messagesSent: number;
    messagesReceived: number;
    messagesFailed: number;
    averageLatency: number;
    maxLatency: number;
    minLatency: number;
    errorRate: number;
    successRate: number;
  };
  errors: string[];
  warnings: string[];
}

export interface TestSuite {
  id: string;
  name: string;
  description: string;
  scenarios: TestScenario[];
  parallel: boolean;
  timeout: number;
}

class RealtimeTestingFramework {
  private realtimeService = getRealtimeMetricsService();
  private smartWsService = getSmartWebSocketService();
  private testResults: TestResults[] = [];
  private isRunning = false;
  private currentTest: TestScenario | null = null;

  // Predefined test scenarios
  public getPredefinedScenarios(): TestScenario[] {
    return [
      {
        id: 'connection-stability',
        name: 'Connection Stability Test',
        description: 'Tests WebSocket connection stability over time',
        type: 'connection',
        duration: 30000, // 30 seconds
        expectedResults: {
          minSuccessRate: 95,
          maxErrorRate: 5
        },
        setup: async () => {
          this.smartWsService.connect();
          await this.waitForConnection();
        },
        teardown: async () => {
          this.smartWsService.disconnect();
        }
      },
      {
        id: 'metrics-streaming',
        name: 'Metrics Streaming Test',
        description: 'Tests real-time metrics streaming performance',
        type: 'metrics',
        duration: 15000, // 15 seconds
        expectedResults: {
          minMessagesReceived: 10,
          maxLatency: 1000
        },
        setup: async () => {
          this.realtimeService.startStreaming('revenue');
          this.realtimeService.startStreaming('orders');
        },
        teardown: async () => {
          this.realtimeService.stopStreaming('revenue');
          this.realtimeService.stopStreaming('orders');
        }
      },
      {
        id: 'insights-generation',
        name: 'Insights Generation Test',
        description: 'Tests AI-powered insights generation',
        type: 'insights',
        duration: 10000, // 10 seconds
        expectedResults: {
          minMessagesReceived: 5
        },
        setup: async () => {
          this.realtimeService.startInsightsStreaming();
        },
        teardown: async () => {
          this.realtimeService.stopInsightsStreaming();
        }
      },
      {
        id: 'message-batching',
        name: 'Message Batching Test',
        description: 'Tests smart message batching functionality',
        type: 'performance',
        duration: 20000, // 20 seconds
        expectedResults: {
          minSuccessRate: 90
        },
        setup: async () => {
          // Configure batching
          this.smartWsService.setBatchConfig({
            maxBatchSize: 5,
            maxWaitTime: 100,
            priorityThreshold: 'medium'
          });
        }
      },
      {
        id: 'stress-test',
        name: 'Stress Test',
        description: 'Tests system under high load',
        type: 'stress',
        duration: 60000, // 60 seconds
        expectedResults: {
          minSuccessRate: 80,
          maxErrorRate: 20
        }
      }
    ];
  }

  // Run a single test scenario
  public async runScenario(scenario: TestScenario): Promise<TestResults> {
    console.log(`🧪 Starting test: ${scenario.name}`);
    
    const startTime = new Date();
    const results: TestResults = {
      scenarioId: scenario.id,
      startTime,
      endTime: new Date(),
      duration: 0,
      success: false,
      metrics: {
        messagesSent: 0,
        messagesReceived: 0,
        messagesFailed: 0,
        averageLatency: 0,
        maxLatency: 0,
        minLatency: Infinity,
        errorRate: 0,
        successRate: 0
      },
      errors: [],
      warnings: []
    };

    try {
      this.currentTest = scenario;
      
      // Setup
      if (scenario.setup) {
        await scenario.setup();
      }

      // Run test
      await this.executeTest(scenario, results);

      // Validate results
      if (scenario.validate) {
        results.success = scenario.validate(results);
      } else {
        results.success = this.validateDefault(results, scenario.expectedResults);
      }

    } catch (error) {
      results.errors.push(error instanceof Error ? error.message : 'Unknown error');
      results.success = false;
    } finally {
      // Teardown
      if (scenario.teardown) {
        try {
          await scenario.teardown();
        } catch (error) {
          results.errors.push(`Teardown error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      results.endTime = new Date();
      results.duration = results.endTime.getTime() - results.startTime.getTime();
      
      this.testResults.push(results);
      this.currentTest = null;
      
      console.log(`✅ Test completed: ${scenario.name} - ${results.success ? 'PASSED' : 'FAILED'}`);
    }

    return results;
  }

  // Run a test suite
  public async runTestSuite(suite: TestSuite): Promise<TestResults[]> {
    console.log(`🚀 Starting test suite: ${suite.name}`);
    
    const results: TestResults[] = [];
    
    if (suite.parallel) {
      // Run scenarios in parallel
      const promises = suite.scenarios.map(scenario => this.runScenario(scenario));
      const scenarioResults = await Promise.allSettled(promises);
      
      scenarioResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // Create failed result
          const scenario = suite.scenarios[index];
          results.push({
            scenarioId: scenario.id,
            startTime: new Date(),
            endTime: new Date(),
            duration: 0,
            success: false,
            metrics: {
              messagesSent: 0,
              messagesReceived: 0,
              messagesFailed: 0,
              averageLatency: 0,
              maxLatency: 0,
              minLatency: 0,
              errorRate: 100,
              successRate: 0
            },
            errors: [result.reason instanceof Error ? result.reason.message : 'Unknown error'],
            warnings: []
          });
        }
      });
    } else {
      // Run scenarios sequentially
      for (const scenario of suite.scenarios) {
        const result = await this.runScenario(scenario);
        results.push(result);
        
        // Stop on first failure if configured
        if (!result.success && suite.timeout > 0) {
          break;
        }
      }
    }

    console.log(`🏁 Test suite completed: ${suite.name}`);
    return results;
  }

  // Execute test based on type
  private async executeTest(scenario: TestScenario, results: TestResults): Promise<void> {
    const startTime = Date.now();
    const endTime = startTime + scenario.duration;
    
    // Set up monitoring
    const initialStats = this.smartWsService.getStats();
    const initialRealtimeState = this.realtimeService.getState();
    
    let messageCount = 0;
    let errorCount = 0;
    const latencies: number[] = [];
    
    // Monitor for messages and errors
    const unsubscribe = this.smartWsService.subscribe((state) => {
      const currentStats = state.stats;
      messageCount = currentStats.messagesReceived;
      errorCount = currentStats.messagesFailed;
      
      if (state.connectionStatus.latency > 0) {
        latencies.push(state.connectionStatus.latency);
      }
    });

    // Generate test data based on scenario type
    switch (scenario.type) {
      case 'connection':
        await this.testConnectionStability(scenario, endTime);
        break;
      case 'metrics':
        await this.testMetricsStreaming(scenario, endTime);
        break;
      case 'insights':
        await this.testInsightsGeneration(scenario, endTime);
        break;
      case 'performance':
        await this.testPerformance(scenario, endTime);
        break;
      case 'stress':
        await this.testStress(scenario, endTime);
        break;
    }

    // Wait for test duration
    await this.wait(scenario.duration);

    // Calculate final metrics
    const finalStats = this.smartWsService.getStats();
    const finalRealtimeState = this.realtimeService.getState();
    
    results.metrics = {
      messagesSent: finalStats.messagesSent - initialStats.messagesSent,
      messagesReceived: finalStats.messagesReceived - initialStats.messagesReceived,
      messagesFailed: finalStats.messagesFailed - initialStats.messagesFailed,
      averageLatency: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
      maxLatency: latencies.length > 0 ? Math.max(...latencies) : 0,
      minLatency: latencies.length > 0 ? Math.min(...latencies) : 0,
      errorRate: messageCount > 0 ? (errorCount / messageCount) * 100 : 0,
      successRate: messageCount > 0 ? ((messageCount - errorCount) / messageCount) * 100 : 0
    };

    unsubscribe();
  }

  private async testConnectionStability(scenario: TestScenario, endTime: number): Promise<void> {
    // Test connection stability by sending periodic pings
    const pingInterval = setInterval(() => {
      if (Date.now() < endTime) {
        this.smartWsService.sendMessage('ping', { timestamp: Date.now() }, { priority: 'low' });
      } else {
        clearInterval(pingInterval);
      }
    }, 1000);
  }

  private async testMetricsStreaming(scenario: TestScenario, endTime: number): Promise<void> {
    // Generate mock metrics data
    const metricsInterval = setInterval(() => {
      if (Date.now() < endTime) {
        this.realtimeService.generateMockData('revenue', 1);
        this.realtimeService.generateMockData('orders', 1);
      } else {
        clearInterval(metricsInterval);
      }
    }, 2000);
  }

  private async testInsightsGeneration(scenario: TestScenario, endTime: number): Promise<void> {
    // Generate mock insights
    const insightsInterval = setInterval(() => {
      if (Date.now() < endTime) {
        this.realtimeService.generateMockInsights(1);
      } else {
        clearInterval(insightsInterval);
      }
    }, 3000);
  }

  private async testPerformance(scenario: TestScenario, endTime: number): Promise<void> {
    // Test message batching performance
    const batchInterval = setInterval(() => {
      if (Date.now() < endTime) {
        // Send batchable messages
        this.smartWsService.sendBatchMessage('test:batch', 
          Array.from({ length: 5 }, (_, i) => ({ id: i, data: `test-${i}` })),
          { priority: 'medium' }
        );
      } else {
        clearInterval(batchInterval);
      }
    }, 500);
  }

  private async testStress(scenario: TestScenario, endTime: number): Promise<void> {
    // High-frequency message sending
    const stressInterval = setInterval(() => {
      if (Date.now() < endTime) {
        // Send high priority messages
        for (let i = 0; i < 10; i++) {
          this.smartWsService.sendMessage('stress:test', { id: i }, { 
            priority: 'high',
            requiresAck: true 
          });
        }
        
        // Generate mock data
        this.realtimeService.generateMockData('revenue', 5);
        this.realtimeService.generateMockInsights(2);
      } else {
        clearInterval(stressInterval);
      }
    }, 100);
  }

  private validateDefault(results: TestResults, expected: TestScenario['expectedResults']): boolean {
    if (expected.minMessagesReceived && results.metrics.messagesReceived < expected.minMessagesReceived) {
      results.warnings.push(`Expected at least ${expected.minMessagesReceived} messages, got ${results.metrics.messagesReceived}`);
      return false;
    }

    if (expected.maxLatency && results.metrics.maxLatency > expected.maxLatency) {
      results.warnings.push(`Expected max latency ${expected.maxLatency}ms, got ${results.metrics.maxLatency}ms`);
      return false;
    }

    if (expected.minSuccessRate && results.metrics.successRate < expected.minSuccessRate) {
      results.warnings.push(`Expected success rate ${expected.minSuccessRate}%, got ${results.metrics.successRate}%`);
      return false;
    }

    if (expected.maxErrorRate && results.metrics.errorRate > expected.maxErrorRate) {
      results.warnings.push(`Expected error rate ${expected.maxErrorRate}%, got ${results.metrics.errorRate}%`);
      return false;
    }

    return true;
  }

  private async waitForConnection(): Promise<void> {
    return new Promise((resolve) => {
      const checkConnection = () => {
        if (this.smartWsService.getConnectionStatus().isConnected) {
          resolve();
        } else {
          setTimeout(checkConnection, 100);
        }
      };
      checkConnection();
    });
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility methods
  public getTestResults(): TestResults[] {
    return [...this.testResults];
  }

  public getLastTestResult(): TestResults | null {
    return this.testResults.length > 0 ? this.testResults[this.testResults.length - 1] : null;
  }

  public clearResults(): void {
    this.testResults = [];
  }

  public isRunning(): boolean {
    return this.isRunning;
  }

  public getCurrentTest(): TestScenario | null {
    return this.currentTest;
  }

  // Generate test report
  public generateReport(): string {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    let report = `# Real-time Testing Report\n\n`;
    report += `## Summary\n`;
    report += `- Total Tests: ${totalTests}\n`;
    report += `- Passed: ${passedTests}\n`;
    report += `- Failed: ${failedTests}\n`;
    report += `- Success Rate: ${successRate.toFixed(1)}%\n\n`;

    report += `## Test Results\n\n`;
    this.testResults.forEach((result, index) => {
      report += `### Test ${index + 1}: ${result.scenarioId}\n`;
      report += `- **Status**: ${result.success ? '✅ PASSED' : '❌ FAILED'}\n`;
      report += `- **Duration**: ${result.duration}ms\n`;
      report += `- **Messages Sent**: ${result.metrics.messagesSent}\n`;
      report += `- **Messages Received**: ${result.metrics.messagesReceived}\n`;
      report += `- **Success Rate**: ${result.metrics.successRate.toFixed(1)}%\n`;
      report += `- **Average Latency**: ${result.metrics.averageLatency.toFixed(1)}ms\n`;
      
      if (result.errors.length > 0) {
        report += `- **Errors**:\n`;
        result.errors.forEach(error => report += `  - ${error}\n`);
      }
      
      if (result.warnings.length > 0) {
        report += `- **Warnings**:\n`;
        result.warnings.forEach(warning => report += `  - ${warning}\n`);
      }
      
      report += `\n`;
    });

    return report;
  }
}

// Singleton instance
let testingFramework: RealtimeTestingFramework | null = null;

export const getRealtimeTestingFramework = (): RealtimeTestingFramework => {
  if (!testingFramework) {
    testingFramework = new RealtimeTestingFramework();
  }
  return testingFramework;
};

export default RealtimeTestingFramework;
