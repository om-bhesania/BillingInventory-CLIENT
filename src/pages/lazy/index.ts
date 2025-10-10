// Lazy-loaded page components
import { lazy } from 'react';

// Main pages
export const Dashboard = lazy(() => import('../Dashboard'));
export const InventoryList = lazy(() => import('../inventory/InventoryList'));
export const InventoryForm = lazy(() => import('../inventory/InventoryForm'));
export const InventoryView = lazy(() => import('../inventory/InventoryView'));
export const Tickets = lazy(() => import('../Tickets'));
export const InvoiceList = lazy(() => import('../invoices/InvoiceList'));
export const InvoiceForm = lazy(() => import('../invoices/InvoiceForm'));
export const EmployeeList = lazy(() => import('../employees/EmployeeList'));
export const EmployeeForm = lazy(() => import('../employees/EmployeeForm'));
export const ShopList = lazy(() => import('../shops/ShopList'));
export const ShopForm = lazy(() => import('../shops/ShopForm'));
export const ShopInventoryList = lazy(() => import('../ShopInventory/ShopInventoryList'));
export const ShopInventoryForm = lazy(() => import('../ShopInventory/ShopInventoryForm'));
export const RestockManagement = lazy(() => import('../RestockManagement'));
export const Notifications = lazy(() => import('../Notifications'));
export const AuditLog = lazy(() => import('../AuditLog'));
export const LowStockAlerts = lazy(() => import('../LowStockAlerts'));
export const SearchPage = lazy(() => import('../SearchPage'));
export const DatabaseMonitoring = lazy(() => import('../DatabaseMonitoring'));
export const CacheManagement = lazy(() => import('../CacheManagement'));
export const EnhancedDatePickerDemo = lazy(() => import('../EnhancedDatePickerDemo'));

// Auth pages
export const Login = lazy(() => import('../auth/Login'));

// Error pages
export const NotFound = lazy(() => import('../NotFound'));
export const UnauthorizedAccess = lazy(() => import('../UnauthorizedAccess'));
