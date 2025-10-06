export interface DiscountCode {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: 'percentage' | 'flat' | 'per_item' | 'on_bill';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  isFactoryWide: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscountApplication {
  code: string;
  orderAmount: number;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface DiscountResult {
  isValid: boolean;
  discountAmount: number;
  finalAmount: number;
  error?: string;
  appliedCode?: DiscountCode;
}

export interface CreateDiscountCodeRequest {
  code: string;
  name: string;
  description?: string;
  discountType: 'percentage' | 'flat' | 'per_item' | 'on_bill';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  validFrom: Date;
  validUntil: Date;
  isFactoryWide: boolean;
}

export class DiscountService {
  /**
   * Validate and apply a discount code
   */
  static applyDiscount(application: DiscountApplication, availableCodes: DiscountCode[]): DiscountResult {
    const code = availableCodes.find(c => c.code.toLowerCase() === application.code.toLowerCase());
    
    if (!code) {
      return {
        isValid: false,
        discountAmount: 0,
        finalAmount: application.orderAmount,
        error: 'Invalid discount code'
      };
    }

    // Check if code is active
    if (!code.isActive) {
      return {
        isValid: false,
        discountAmount: 0,
        finalAmount: application.orderAmount,
        error: 'Discount code is not active'
      };
    }

    // Check validity period
    const now = new Date();
    if (now < code.validFrom || now > code.validUntil) {
      return {
        isValid: false,
        discountAmount: 0,
        finalAmount: application.orderAmount,
        error: 'Discount code has expired'
      };
    }

    // Check usage limit
    if (code.usageLimit && code.usedCount >= code.usageLimit) {
      return {
        isValid: false,
        discountAmount: 0,
        finalAmount: application.orderAmount,
        error: 'Discount code usage limit exceeded'
      };
    }

    // Check minimum order amount
    if (code.minOrderAmount && application.orderAmount < code.minOrderAmount) {
      return {
        isValid: false,
        discountAmount: 0,
        finalAmount: application.orderAmount,
        error: `Minimum order amount of ₹${code.minOrderAmount} required`
      };
    }

    // Calculate discount amount
    let discountAmount = 0;

    switch (code.discountType) {
      case 'percentage':
        discountAmount = (application.orderAmount * code.discountValue) / 100;
        break;
      
      case 'flat':
        discountAmount = code.discountValue;
        break;
      
      case 'per_item':
        const totalItems = application.items.reduce((sum, item) => sum + item.quantity, 0);
        discountAmount = totalItems * code.discountValue;
        break;
      
      case 'on_bill':
        discountAmount = code.discountValue;
        break;
    }

    // Apply maximum discount limit
    if (code.maxDiscount && discountAmount > code.maxDiscount) {
      discountAmount = code.maxDiscount;
    }

    // Ensure discount doesn't exceed order amount
    if (discountAmount > application.orderAmount) {
      discountAmount = application.orderAmount;
    }

    const finalAmount = application.orderAmount - discountAmount;

    return {
      isValid: true,
      discountAmount,
      finalAmount,
      appliedCode: code
    };
  }

  /**
   * Generate a unique discount code
   */
  static generateDiscountCode(prefix: string = 'DISCOUNT'): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Validate discount code format
   */
  static validateDiscountCode(code: string): { isValid: boolean; error?: string } {
    if (!code || code.trim().length === 0) {
      return { isValid: false, error: 'Discount code is required' };
    }

    if (code.length < 3) {
      return { isValid: false, error: 'Discount code must be at least 3 characters long' };
    }

    if (code.length > 20) {
      return { isValid: false, error: 'Discount code must be less than 20 characters' };
    }

    if (!/^[A-Z0-9_]+$/.test(code.toUpperCase())) {
      return { isValid: false, error: 'Discount code can only contain letters, numbers, and underscores' };
    }

    return { isValid: true };
  }

  /**
   * Calculate discount for a specific item
   */
  static calculateItemDiscount(
    item: { productId: string; quantity: number; unitPrice: number },
    discountCode: DiscountCode
  ): number {
    if (discountCode.discountType === 'per_item') {
      return item.quantity * discountCode.discountValue;
    }
    
    if (discountCode.discountType === 'percentage') {
      const itemTotal = item.quantity * item.unitPrice;
      return (itemTotal * discountCode.discountValue) / 100;
    }
    
    if (discountCode.discountType === 'flat' || discountCode.discountType === 'on_bill') {
      const itemTotal = item.quantity * item.unitPrice;
      return Math.min(discountCode.discountValue, itemTotal);
    }
    
    return 0;
  }

  /**
   * Get discount code summary
   */
  static getDiscountSummary(discountCode: DiscountCode): string {
    let summary = '';
    
    switch (discountCode.discountType) {
      case 'percentage':
        summary = `${discountCode.discountValue}% off`;
        break;
      case 'flat':
        summary = `₹${discountCode.discountValue} off`;
        break;
      case 'per_item':
        summary = `₹${discountCode.discountValue} off per item`;
        break;
      case 'on_bill':
        summary = `₹${discountCode.discountValue} off on bill`;
        break;
    }
    
    if (discountCode.minOrderAmount) {
      summary += ` (min order ₹${discountCode.minOrderAmount})`;
    }
    
    if (discountCode.maxDiscount) {
      summary += ` (max ₹${discountCode.maxDiscount})`;
    }
    
    if (discountCode.usageLimit) {
      const remaining = discountCode.usageLimit - discountCode.usedCount;
      summary += ` (${remaining} uses left)`;
    }
    
    return summary;
  }

  /**
   * Check if discount code is applicable for factory-wide use
   */
  static isFactoryWideApplicable(discountCode: DiscountCode, isFactoryWide: boolean): boolean {
    return discountCode.isFactoryWide === isFactoryWide;
  }

  /**
   * Get discount code status
   */
  static getDiscountStatus(discountCode: DiscountCode): {
    status: 'active' | 'expired' | 'inactive' | 'limit_reached';
    message: string;
  } {
    const now = new Date();
    
    if (!discountCode.isActive) {
      return {
        status: 'inactive',
        message: 'Discount code is inactive'
      };
    }
    
    if (now < discountCode.validFrom) {
      return {
        status: 'inactive',
        message: 'Discount code is not yet active'
      };
    }
    
    if (now > discountCode.validUntil) {
      return {
        status: 'expired',
        message: 'Discount code has expired'
      };
    }
    
    if (discountCode.usageLimit && discountCode.usedCount >= discountCode.usageLimit) {
      return {
        status: 'limit_reached',
        message: 'Discount code usage limit reached'
      };
    }
    
    return {
      status: 'active',
      message: 'Discount code is active'
    };
  }

  /**
   * Format discount code for display
   */
  static formatDiscountCode(discountCode: DiscountCode): string {
    return `${discountCode.code} - ${discountCode.name}`;
  }

  /**
   * Get discount type display name
   */
  static getDiscountTypeDisplayName(discountType: DiscountCode['discountType']): string {
    switch (discountType) {
      case 'percentage':
        return 'Percentage';
      case 'flat':
        return 'Flat Amount';
      case 'per_item':
        return 'Per Item';
      case 'on_bill':
        return 'On Bill';
      default:
        return 'Unknown';
    }
  }

  /**
   * Calculate potential savings for a given order
   */
  static calculatePotentialSavings(
    orderAmount: number,
    discountCode: DiscountCode
  ): { maxSavings: number; effectiveRate: number } {
    let maxSavings = 0;
    
    switch (discountCode.discountType) {
      case 'percentage':
        maxSavings = (orderAmount * discountCode.discountValue) / 100;
        break;
      case 'flat':
      case 'on_bill':
        maxSavings = discountCode.discountValue;
        break;
      case 'per_item':
        // This would need item details to calculate accurately
        maxSavings = discountCode.discountValue;
        break;
    }
    
    // Apply maximum discount limit
    if (discountCode.maxDiscount && maxSavings > discountCode.maxDiscount) {
      maxSavings = discountCode.maxDiscount;
    }
    
    // Ensure discount doesn't exceed order amount
    if (maxSavings > orderAmount) {
      maxSavings = orderAmount;
    }
    
    const effectiveRate = orderAmount > 0 ? (maxSavings / orderAmount) * 100 : 0;
    
    return { maxSavings, effectiveRate };
  }
}

export default DiscountService;
