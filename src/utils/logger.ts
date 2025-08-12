// Frontend Logger Utility
const getCallerInfo = () => {
  const error = new Error();
  const stack = error.stack?.split('\n')[3]; // Skip 3 lines to get to the actual caller
  const match = stack?.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
  if (match) {
    const [_, functionName, filePath, line, column] = match;
    const fileName = filePath.split('\\').pop() || filePath;
    return `[${fileName}:${line}]`;
  }
  return '[unknown location]';
};

// Frontend Logger Utility
class FrontendLogger {
  // Authentication logs
  auth = {
    login: (message: string, data?: any) => {
      const location = getCallerInfo();
      console.log(`${location} 🔐 AUTH LOGIN: ${message}`);
      if (data) console.log(`${location} Data:`, data);
    },
    logout: (message: string) => {
      const location = getCallerInfo();
      console.log(`${location} 🚪 AUTH LOGOUT: ${message}`);
    },
    tokenRefresh: (message: string, data?: any) => {
      const location = getCallerInfo();
      console.log(`${location} 🔄 TOKEN REFRESH: ${message}`);
      if (data) console.log(`${location} Data:`, data);
    },
    tokenExpired: (message: string) => {
      const location = getCallerInfo();
      console.log(`${location} ⏰ TOKEN EXPIRED: ${message}`);
    },
    roleCheck: (role: string, hasAccess: boolean) => {
      const location = getCallerInfo();
      const status = hasAccess ? '✅ ACCESS GRANTED' : '❌ ACCESS DENIED';
      console.log(`${location} 🔒 ROLE CHECK: ${role} - ${status}`);
    }
  };

  // API logs
  api = {
    request: (method: string, url: string, data?: any) => {
      const location = getCallerInfo();
      console.log(`${location} 📡 API REQUEST: ${method} ${url}`);
      if (data) console.log(`${location} Payload:`, data);
    },
    response: (method: string, url: string, status: number, data?: any) => {
      const location = getCallerInfo();
      const statusIcon = status >= 200 && status < 300 ? '✅' : '❌';
      console.log(`${location} 📡 API RESPONSE: ${method} ${url} - ${status} ${statusIcon}`);
      if (data) console.log(`${location} Data:`, data);
    },
    error: (method: string, url: string, error: any) => {
      const location = getCallerInfo();
      console.log(`${location} ❌ API ERROR: ${method} ${url}`);
      console.log(`${location} Error:`, error);
    }
  };

  // Component logs
  component = {
    mount: (componentName: string, props?: any) => {
      const location = getCallerInfo();
      console.log(`${location} 🧩 COMPONENT MOUNT: ${componentName}`);
      if (props) console.log(`${location} Props:`, props);
    },
    unmount: (componentName: string) => {
      const location = getCallerInfo();
      console.log(`${location} 🧩 COMPONENT UNMOUNT: ${componentName}`);
    },
    render: (componentName: string, data?: any) => {
      const location = getCallerInfo();
      console.log(`${location} 🎨 COMPONENT RENDER: ${componentName}`);
      if (data) console.log(`${location} Data:`, data);
    }
  };

  // Form logs
  form = {
    submit: (formName: string, data: any) => {
      const location = getCallerInfo();
      console.log(`${location} 📝 FORM SUBMIT: ${formName}`);
      console.log(`${location} Data:`, data);
    },
    validation: (formName: string, errors: any) => {
      const location = getCallerInfo();
      console.log(`${location} ⚠️ FORM VALIDATION: ${formName}`);
      console.log(`${location} Errors:`, errors);
    },
    success: (formName: string, message: string) => {
      const location = getCallerInfo();
      console.log(`${location} ✅ FORM SUCCESS: ${formName} - ${message}`);
    }
  };

  // Navigation logs
  navigation = {
    routeChange: (from: string, to: string) => {
      const location = getCallerInfo();
      console.log(`${location} 🧭 ROUTE CHANGE: ${from} → ${to}`);
    },
    protectedRoute: (route: string, hasAccess: boolean) => {
      const location = getCallerInfo();
      const status = hasAccess ? '✅ ACCESS GRANTED' : '❌ ACCESS DENIED';
      console.log(`${location} 🛡️ PROTECTED ROUTE: ${route} - ${status}`);
    }
  };

  // Data fetching logs
  data = {
    fetch: (endpoint: string, params?: any) => {
      const location = getCallerInfo();
      console.log(`${location} 📊 DATA FETCH: ${endpoint}`);
      if (params) console.log(`${location} Params:`, params);
    },
    success: (endpoint: string, data: any) => {
      const location = getCallerInfo();
      console.log(`${location} ✅ DATA SUCCESS: ${endpoint}`);
      console.log(`${location} Data:`, data);
    },
    error: (endpoint: string, error: any) => {
      const location = getCallerInfo();
      console.log(`${location} ❌ DATA ERROR: ${endpoint}`);
      console.log(`${location} Error:`, error);
    }
  };

  // General logs
  info = (message: string, data?: any) => {
    const location = getCallerInfo();
    console.log(`${location} ℹ️ INFO: ${message}`);
    if (data) console.log(`${location} Data:`, data);
  };

  warn = (message: string, data?: any) => {
    const location = getCallerInfo();
    console.log(`${location} ⚠️ WARNING: ${message}`);
    if (data) console.log(`${location} Data:`, data);
  };

  error = (message: string, error?: any) => {
    const location = getCallerInfo();
    console.log(`${location} ❌ ERROR: ${message}`);
    if (error) console.log(`${location} Error:`, error);
  };

  success = (message: string, data?: any) => {
    const location = getCallerInfo();
    console.log(`${location} ✅ SUCCESS: ${message}`);
    if (data) console.log(`${location} Data:`, data);
  };

  debug = (message: string, data?: any) => {
    const location = getCallerInfo();
    console.log(`${location} 🐛 DEBUG: ${message}`);
    if (data) console.log(`${location} Data:`, data);
  };
}

// Create and export a singleton instance
export const logger = new FrontendLogger();

// Export individual loggers for convenience
export const { auth, api, component, form, navigation, data } = logger;
