
import { z } from 'zod';

// Common validation patterns
const emailSchema = z.string().email('Invalid email address').min(1, 'Email is required');
const phoneSchema = z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number too long');
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

const positiveNumberSchema = z.number().positive('Value must be positive');
const nonNegativeNumberSchema = z.number().min(0, 'Value cannot be negative');

// User validation schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Confirm password is required')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// Product/Inventory validation schemas
export const inventorySchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').max(200, 'Product name too long'),
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU too long'),
  category: z.string().min(1, 'Category is required').max(100, 'Category name too long'),
  quantity: nonNegativeNumberSchema,
  price: positiveNumberSchema,
  unitPrice: positiveNumberSchema.optional(),
  reorderPoint: nonNegativeNumberSchema.optional().default(0),
  minStockLevel: nonNegativeNumberSchema.optional().default(0),
  maxStockLevel: positiveNumberSchema.optional(),
  shop: z.string().min(1, 'Shop is required'),
  description: z.string().max(1000, 'Description too long').optional(),
  unitOfMeasurement: z.string().min(1, 'Unit of measurement is required').max(20, 'Unit too long').optional(),
  supplier: z.string().max(200, 'Supplier name too long').optional(),
  costPrice: positiveNumberSchema.optional()
}).refine((data) => {
  if (data.maxStockLevel && data.minStockLevel && data.maxStockLevel <= data.minStockLevel) {
    return false;
  }
  return true;
}, {
  message: "Maximum stock level must be greater than minimum stock level",
  path: ["maxStockLevel"]
});

// Shop validation schemas
export const shopSchema = z.object({
  name: z.string().min(2, 'Shop name must be at least 2 characters').max(200, 'Shop name too long'),
  location: z.string().min(5, 'Location must be at least 5 characters').max(500, 'Location too long'),
  manager: z.string().min(1, 'Manager is required'),
  contact: phoneSchema,
  email: emailSchema.optional(),
  openingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
  closingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  address: z.string().max(500, 'Address too long').optional()
}).refine((data) => {
  if (data.openingTime && data.closingTime) {
    const opening = new Date(`2000-01-01T${data.openingTime}:00`);
    const closing = new Date(`2000-01-01T${data.closingTime}:00`);
    return opening < closing;
  }
  return true;
}, {
  message: "Opening time must be before closing time",
  path: ["closingTime"]
});

// Employee validation schemas
export const employeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: emailSchema,
  phone: phoneSchema,
  position: z.string().min(2, 'Position must be at least 2 characters').max(100, 'Position too long'),
  shop: z.string().min(1, 'Shop is required'),
  joinDate: z.string().datetime('Invalid date format').optional(),
  address: z.string().max(500, 'Address too long').optional(),
  isAdmin: z.boolean().optional().default(false),
  salary: positiveNumberSchema.optional(),
  emergencyContact: z.object({
    name: z.string().min(2, 'Emergency contact name required'),
    phone: phoneSchema,
    relationship: z.string().min(2, 'Relationship required')
  }).optional()
});

// Invoice/Billing validation schemas
export const invoiceSchema = z.object({
  customer: z.string().min(2, 'Customer name must be at least 2 characters').max(200, 'Customer name too long'),
  contactNumber: phoneSchema.optional(),
  shop: z.string().min(1, 'Shop is required'),
  invoiceDate: z.string().datetime('Invalid date format'),
  items: z.array(
    z.object({
      id: z.string().min(1, 'Item ID is required'),
      itemId: z.string().min(1, 'Item selection is required'),
      name: z.string().min(1, 'Item name is required'),
      quantity: positiveNumberSchema,
      price: positiveNumberSchema,
      unitPrice: positiveNumberSchema.optional(),
      totalPrice: positiveNumberSchema.optional()
    })
  ).min(1, 'At least one item is required'),
  subtotal: positiveNumberSchema.optional(),
  taxRate: nonNegativeNumberSchema.max(100, 'Tax rate cannot exceed 100%').optional().default(0),
  taxAmount: nonNegativeNumberSchema.optional().default(0),
  discount: nonNegativeNumberSchema.optional().default(0),
  total: positiveNumberSchema.optional(),
  paymentMethod: z.enum(['Cash', 'Card', 'Bank Transfer', 'Other']).optional(),
  paymentStatus: z.enum(['Pending', 'Paid', 'Partially Paid', 'Refunded']).optional().default('Pending'),
  notes: z.string().max(1000, 'Notes too long').optional()
}).refine((data) => {
  if (data.items && data.items.length > 0) {
    const calculatedTotal = data.items.reduce((sum, item) => sum + (item.totalPrice || item.quantity * item.price), 0);
    const taxAmount = calculatedTotal * (data.taxRate || 0) / 100;
    const finalTotal = calculatedTotal + taxAmount - (data.discount || 0);
    if (data.total && Math.abs(finalTotal - data.total) > 0.01) {
      return false;
    }
  }
  return true;
}, {
  message: "Total amount calculation is incorrect",
  path: ["total"]
});

// Shop Inventory validation schemas
export const shopInventorySchema = z.object({
  shopId: z.string().min(1, 'Shop is required'),
  productId: z.string().min(1, 'Product is required'),
  currentStock: nonNegativeNumberSchema.default(0),
  minStockPerItem: nonNegativeNumberSchema.optional(),
  lowStockAlertsEnabled: z.boolean().optional().default(true)
});

// Restock Request validation schemas
export const restockRequestSchema = z.object({
  shopId: z.string().min(1, 'Shop is required'),
  productId: z.string().min(1, 'Product is required'),
  requestedAmount: positiveNumberSchema,
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional().default('Medium'),
  reason: z.string().max(500, 'Reason too long').optional(),
  expectedDeliveryDate: z.string().datetime('Invalid date format').optional(),
  notes: z.string().max(1000, 'Notes too long').optional()
});

// Category validation schemas
export const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters').max(100, 'Category name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  parentCategoryId: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  sortOrder: nonNegativeNumberSchema.optional().default(0)
});

// Search validation schemas
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(200, 'Search query too long'),
  type: z.enum(['all', 'products', 'shops', 'employees', 'billings', 'inventory']).optional().default('all'),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0)
});

// Form validation helper
export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: z.ZodError } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
};

// Field validation helper
export const validateField = <T>(schema: z.ZodSchema<T>, value: unknown): { success: boolean; error?: string } => {
  try {
    schema.parse(value);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Invalid value' };
    }
    return { success: false, error: 'Validation error' };
  }
};
