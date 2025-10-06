export interface BulkOperationRequest {
  operation: 'approve' | 'reject' | 'fulfill' | 'cancel';
  requestIds: string[];
  reason?: string;
  notes?: string;
}

export interface BulkOperationResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors: Array<{
    requestId: string;
    error: string;
  }>;
  successIds: string[];
  failedIds: string[];
}

export interface BulkOperationSummary {
  totalSelected: number;
  canApprove: number;
  canReject: number;
  canFulfill: number;
  canCancel: number;
  totalValue: number;
  shopsAffected: number;
  estimatedProcessingTime: number; // in minutes
}

export interface RestockRequestSummary {
  id: string;
  shopName: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled' | 'cancelled';
  paymentStatus: 'pending' | 'verified' | 'failed';
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
  canApprove: boolean;
  canReject: boolean;
  canFulfill: boolean;
  canCancel: boolean;
}

export class BulkOperationsService {
  /**
   * Get summary of selected requests for bulk operations
   */
  static getBulkOperationSummary(selectedRequests: RestockRequestSummary[]): BulkOperationSummary {
    const totalSelected = selectedRequests.length;
    const canApprove = selectedRequests.filter(r => r.canApprove).length;
    const canReject = selectedRequests.filter(r => r.canReject).length;
    const canFulfill = selectedRequests.filter(r => r.canFulfill).length;
    const canCancel = selectedRequests.filter(r => r.canCancel).length;
    
    const totalValue = selectedRequests.reduce((sum, r) => sum + r.totalAmount, 0);
    const shopsAffected = new Set(selectedRequests.map(r => r.shopName)).size;
    
    // Estimate processing time based on number of requests
    const estimatedProcessingTime = Math.max(1, Math.ceil(totalSelected / 10));

    return {
      totalSelected,
      canApprove,
      canReject,
      canFulfill,
      canCancel,
      totalValue,
      shopsAffected,
      estimatedProcessingTime
    };
  }

  /**
   * Validate bulk operation request
   */
  static validateBulkOperation(
    operation: BulkOperationRequest['operation'],
    selectedRequests: RestockRequestSummary[]
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (selectedRequests.length === 0) {
      errors.push('No requests selected');
      return { isValid: false, errors };
    }

    const summary = this.getBulkOperationSummary(selectedRequests);

    switch (operation) {
      case 'approve':
        if (summary.canApprove === 0) {
          errors.push('No requests can be approved');
        }
        break;
      
      case 'reject':
        if (summary.canReject === 0) {
          errors.push('No requests can be rejected');
        }
        break;
      
      case 'fulfill':
        if (summary.canFulfill === 0) {
          errors.push('No requests can be fulfilled');
        }
        break;
      
      case 'cancel':
        if (summary.canCancel === 0) {
          errors.push('No requests can be cancelled');
        }
        break;
    }

    if (operation === 'reject' && !selectedRequests.some(r => r.canReject)) {
      errors.push('At least one request must be rejectable');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Execute bulk operation
   */
  static async executeBulkOperation(
    operation: BulkOperationRequest
  ): Promise<BulkOperationResult> {
    try {
      // In a real application, this would make API calls to your backend
      // For now, we'll simulate the operation
      
      const result: BulkOperationResult = {
        success: true,
        processedCount: 0,
        failedCount: 0,
        errors: [],
        successIds: [],
        failedIds: []
      };

      // Simulate processing each request
      for (const requestId of operation.requestIds) {
        try {
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Simulate some failures (10% chance)
          if (Math.random() < 0.1) {
            throw new Error('Simulated processing error');
          }
          
          result.successIds.push(requestId);
          result.processedCount++;
        } catch (error) {
          result.failedIds.push(requestId);
          result.failedCount++;
          result.errors.push({
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      result.success = result.failedCount === 0;
      return result;
    } catch (error) {
      return {
        success: false,
        processedCount: 0,
        failedCount: operation.requestIds.length,
        errors: [{
          requestId: 'all',
          error: error instanceof Error ? error.message : 'Unknown error'
        }],
        successIds: [],
        failedIds: operation.requestIds
      };
    }
  }

  /**
   * Get operation confirmation message
   */
  static getOperationConfirmationMessage(
    operation: BulkOperationRequest['operation'],
    summary: BulkOperationSummary
  ): string {
    const { totalSelected, totalValue, shopsAffected } = summary;
    
    const operationText = {
      approve: 'approve',
      reject: 'reject',
      fulfill: 'fulfill',
      cancel: 'cancel'
    }[operation];

    const valueText = totalValue > 0 ? ` worth ₹${totalValue.toLocaleString()}` : '';
    
    return `Are you sure you want to ${operationText} ${totalSelected} request${totalSelected > 1 ? 's' : ''}${valueText} from ${shopsAffected} shop${shopsAffected > 1 ? 's' : ''}?`;
  }

  /**
   * Get operation success message
   */
  static getOperationSuccessMessage(
    operation: BulkOperationRequest['operation'],
    result: BulkOperationResult
  ): string {
    const { processedCount, failedCount } = result;
    const operationText = {
      approve: 'approved',
      reject: 'rejected',
      fulfill: 'fulfilled',
      cancel: 'cancelled'
    }[operation];

    if (failedCount === 0) {
      return `Successfully ${operationText} ${processedCount} request${processedCount > 1 ? 's' : ''}.`;
    } else {
      return `${operationText} ${processedCount} request${processedCount > 1 ? 's' : ''}, ${failedCount} failed.`;
    }
  }

  /**
   * Get operation error message
   */
  static getOperationErrorMessage(
    operation: BulkOperationRequest['operation'],
    result: BulkOperationResult
  ): string {
    const { failedCount, errors } = result;
    const operationText = {
      approve: 'approval',
      reject: 'rejection',
      fulfill: 'fulfillment',
      cancel: 'cancellation'
    }[operation];

    if (errors.length > 0) {
      return `Failed to ${operationText}: ${errors[0].error}`;
    }
    
    return `Failed to ${operationText} ${failedCount} request${failedCount > 1 ? 's' : ''}.`;
  }

  /**
   * Filter requests by status
   */
  static filterRequestsByStatus(
    requests: RestockRequestSummary[],
    status: RestockRequestSummary['status']
  ): RestockRequestSummary[] {
    return requests.filter(request => request.status === status);
  }

  /**
   * Filter requests by shop
   */
  static filterRequestsByShop(
    requests: RestockRequestSummary[],
    shopName: string
  ): RestockRequestSummary[] {
    return requests.filter(request => 
      request.shopName.toLowerCase().includes(shopName.toLowerCase())
    );
  }

  /**
   * Filter requests by date range
   */
  static filterRequestsByDateRange(
    requests: RestockRequestSummary[],
    startDate: Date,
    endDate: Date
  ): RestockRequestSummary[] {
    return requests.filter(request => 
      request.createdAt >= startDate && request.createdAt <= endDate
    );
  }

  /**
   * Sort requests by priority
   */
  static sortRequestsByPriority(
    requests: RestockRequestSummary[]
  ): RestockRequestSummary[] {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return requests.sort((a, b) => 
      priorityOrder[b.priority] - priorityOrder[a.priority]
    );
  }

  /**
   * Sort requests by amount
   */
  static sortRequestsByAmount(
    requests: RestockRequestSummary[],
    ascending: boolean = false
  ): RestockRequestSummary[] {
    return requests.sort((a, b) => 
      ascending ? a.totalAmount - b.totalAmount : b.totalAmount - a.totalAmount
    );
  }

  /**
   * Get operation statistics
   */
  static getOperationStatistics(requests: RestockRequestSummary[]): {
    totalRequests: number;
    totalValue: number;
    averageValue: number;
    statusDistribution: Record<string, number>;
    priorityDistribution: Record<string, number>;
    topShops: Array<{ shopName: string; count: number; value: number }>;
  } {
    const totalRequests = requests.length;
    const totalValue = requests.reduce((sum, r) => sum + r.totalAmount, 0);
    const averageValue = totalRequests > 0 ? totalValue / totalRequests : 0;

    const statusDistribution = requests.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const priorityDistribution = requests.reduce((acc, r) => {
      acc[r.priority] = (acc[r.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const shopStats = requests.reduce((acc, r) => {
      if (!acc[r.shopName]) {
        acc[r.shopName] = { count: 0, value: 0 };
      }
      acc[r.shopName].count++;
      acc[r.shopName].value += r.totalAmount;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);

    const topShops = Object.entries(shopStats)
      .map(([shopName, stats]) => ({ shopName, ...stats }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      totalRequests,
      totalValue,
      averageValue,
      statusDistribution,
      priorityDistribution,
      topShops
    };
  }
}

export default BulkOperationsService;
