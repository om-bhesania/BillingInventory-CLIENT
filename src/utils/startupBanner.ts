import { color } from 'console-log-colors';
import React from 'react';

export const printFrontendBanner = () => {
  console.log('\n');
  console.log(color.blue.bold('╔══════════════════════════════════════════════════════════════╗'));
  console.log(color.blue.bold('║                                                              ║'));
  console.log(color.blue.bold('║') + color.white.bold('  🍦 Bliss Frontend - React Application 🍦') + color.blue.bold('                ║'));
  console.log(color.blue.bold('║') + color.gray('  Modern UI for ice cream shop management') + color.blue.bold('            ║'));
  console.log(color.blue.bold('║') + color.gray('  Built with React, TypeScript & Tailwind CSS') + color.blue.bold('        ║'));
  console.log(color.blue.bold('║                                                              ║'));
  console.log(color.blue.bold('╠══════════════════════════════════════════════════════════════╣'));
  console.log(color.blue.bold('║') + color.yellow('  🎨 UI Framework: shadcn/ui components') + color.blue.bold('                    ║'));
  console.log(color.blue.bold('║') + color.yellow('  🔐 Auth: JWT with automatic token refresh') + color.blue.bold('              ║'));
  console.log(color.blue.bold('║') + color.yellow('  🛡️  RBAC: Dynamic role-based access control') + color.blue.bold('            ║'));
  console.log(color.blue.bold('║') + color.yellow('  📊 State: React Context + TanStack Query') + color.blue.bold('              ║'));
  console.log(color.blue.bold('║') + color.yellow('  🎯 Forms: Formik with Yup validation') + color.blue.bold('                  ║'));
  console.log(color.blue.bold('║                                                              ║'));
  console.log(color.blue.bold('╠══════════════════════════════════════════════════════════════╣'));
  console.log(color.blue.bold('║') + color.green('  👥 User Roles: Admin | Shop Owner') + color.blue.bold('                          ║'));
  console.log(color.blue.bold('║') + color.green('  🏪 Features: Dashboard, Inventory, Invoices') + color.blue.bold('              ║'));
  console.log(color.blue.bold('║') + color.green('  📱 Responsive: Mobile-first design') + color.blue.bold('                      ║'));
  console.log(color.blue.bold('║                                                              ║'));
  console.log(color.blue.bold('╚══════════════════════════════════════════════════════════════╝'));
  console.log('\n');
};

export const printFrontendInfo = () => {
  console.log(color.cyan.bold('📋 Frontend Information:'));
  console.log(color.cyan(`   Environment: ${import.meta.env.MODE}`));
  console.log(color.cyan(`   API URL: ${import.meta.env.VITE_API_URL}`));
  console.log(color.cyan(`   React Version: ${React.version}`));
  console.log(color.cyan(`   TypeScript: Enabled`));
  console.log(color.cyan(`   Tailwind CSS: Enabled`));
  console.log('\n');
};

export const printRoutesInfo = () => {
  console.log(color.magenta.bold('🧭 Available Routes:'));
  console.log(color.magenta(`   🏠 Dashboard: /`));
  console.log(color.magenta(`   🔐 Login: /login`));
  console.log(color.magenta(`   📦 Inventory: /inventory`));
  console.log(color.magenta(`   🧾 Invoices: /invoices`));
  console.log(color.magenta(`   👥 Employees: /employees (Admin only)`));
  console.log(color.magenta(`   🏪 Shops: /shops`));
  console.log('\n');
};
