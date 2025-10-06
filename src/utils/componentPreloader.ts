// Component preloader for critical components
import { preloadComponent } from './lazyLoading';

// Preload critical components on app initialization
export const preloadCriticalComponents = () => {
  // Preload dashboard components
  preloadComponent(() => import('../pages/Dashboard'))();
  preloadComponent(() => import('../pages/inventory/InventoryList'))();
  preloadComponent(() => import('../pages/employees/EmployeeList'))();
  preloadComponent(() => import('../pages/shops/ShopList'))();
  
  // Preload common forms
  preloadComponent(() => import('../pages/inventory/InventoryForm'))();
  preloadComponent(() => import('../pages/employees/EmployeeForm'))();
  preloadComponent(() => import('../pages/shops/ShopForm'))();
  
  // Preload frequently used pages
  preloadComponent(() => import('../pages/ShopInventory/ShopInventoryList'))();
  preloadComponent(() => import('../pages/invoices/InvoiceList'))();
  preloadComponent(() => import('../pages/Notifications'))();
};

// Preload components based on user role
export const preloadComponentsByRole = (userRole: string) => {
  const commonComponents = [
    () => import('../pages/Dashboard'),
    () => import('../pages/Notifications'),
    () => import('../pages/inventory/InventoryList'),
  ];

  const adminComponents = [
    () => import('../pages/employees/EmployeeList'),
    () => import('../pages/shops/ShopList'),
    () => import('../pages/RestockManagement'),
    () => import('../pages/AuditLog'),
    () => import('../pages/LowStockAlerts'),
    () => import('../pages/DatabaseMonitoring'),
    () => import('../pages/CacheManagement'),
  ];

  const shopOwnerComponents = [
    () => import('../pages/ShopInventory/ShopInventoryList'),
    () => import('../pages/invoices/InvoiceList'),
    () => import('../pages/shops/ShopList'),
  ];

  // Preload common components
  commonComponents.forEach(component => preloadComponent(component)());

  // Preload role-specific components
  if (userRole === 'Admin') {
    adminComponents.forEach(component => preloadComponent(component)());
  } else if (userRole === 'Shop Owner') {
    shopOwnerComponents.forEach(component => preloadComponent(component)());
  }
};

// Preload components on route hover
export const preloadOnHover = (importFn: () => Promise<any>) => {
  let hasPreloaded = false;
  
  return {
    onMouseEnter: () => {
      if (!hasPreloaded) {
        hasPreloaded = true;
        preloadComponent(importFn)();
      }
    }
  };
};

// Preload components on route focus
export const preloadOnFocus = (importFn: () => Promise<any>) => {
  let hasPreloaded = false;
  
  return {
    onFocus: () => {
      if (!hasPreloaded) {
        hasPreloaded = true;
        preloadComponent(importFn)();
      }
    }
  };
};

// Preload components with intersection observer
export const preloadOnVisible = (importFn: () => Promise<any>, threshold = 0.1) => {
  let hasPreloaded = false;
  
  return {
    ref: (node: HTMLElement | null) => {
      if (node && !hasPreloaded) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                hasPreloaded = true;
                preloadComponent(importFn)();
                observer.disconnect();
              }
            });
          },
          { threshold }
        );
        
        observer.observe(node);
      }
    }
  };
};

// Preload components with delay
export const preloadWithDelay = (importFn: () => Promise<any>, delay = 2000) => {
  setTimeout(() => {
    preloadComponent(importFn)();
  }, delay);
};

// Preload components based on user behavior
export const preloadBasedOnBehavior = () => {
  // Preload search page if user types in search box
  const searchInputs = document.querySelectorAll('input[type="search"], input[placeholder*="search" i]');
  searchInputs.forEach(input => {
    input.addEventListener('focus', () => {
      preloadComponent(() => import('../pages/SearchPage'))();
    });
  });

  // Preload forms when user hovers over "Add" buttons
  const addButtons = document.querySelectorAll('button[class*="add"], a[href*="add"]');
  addButtons.forEach(button => {
    button.addEventListener('mouseenter', () => {
      const href = button.getAttribute('href');
      if (href?.includes('inventory/add')) {
        preloadComponent(() => import('../pages/inventory/InventoryForm'))();
      } else if (href?.includes('employees/add')) {
        preloadComponent(() => import('../pages/employees/EmployeeForm'))();
      } else if (href?.includes('shops/add')) {
        preloadComponent(() => import('../pages/shops/ShopForm'))();
      }
    });
  });
};

// Initialize preloading strategies
export const initializePreloading = (userRole?: string) => {
  // Preload critical components immediately
  preloadCriticalComponents();
  
  // Preload role-specific components
  if (userRole) {
    preloadWithDelay(() => preloadComponentsByRole(userRole), 1000);
  }
  
  // Preload based on user behavior
  preloadWithDelay(() => preloadBasedOnBehavior(), 2000);
  
  // Preload additional components after initial load
  preloadWithDelay(() => {
    preloadComponent(() => import('../pages/ShopInventory/ShopInventoryForm'))();
    preloadComponent(() => import('../pages/invoices/InvoiceForm'))();
    preloadComponent(() => import('../pages/RestockManagement'))();
  }, 5000);
};

export default {
  preloadCriticalComponents,
  preloadComponentsByRole,
  preloadOnHover,
  preloadOnFocus,
  preloadOnVisible,
  preloadWithDelay,
  preloadBasedOnBehavior,
  initializePreloading
};
