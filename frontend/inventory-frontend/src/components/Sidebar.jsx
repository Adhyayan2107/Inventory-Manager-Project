import React from 'react'
import { Home, Package, FolderTree, Truck, ShoppingCart, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const menuItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/products', icon: Package, label: 'Products' },
    { path: '/categories', icon: FolderTree, label: 'Categories' },
    { path: '/suppliers', icon: Truck, label: 'Suppliers' },
    { path: '/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/profile', icon: User, label: 'Profile' }
  ];

  return (
    <aside className="w-64 bg-gradient-to-b from-indigo-600 to-purple-700 text-white shadow-2xl">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <Package className="w-8 h-8" />
          <h1 className="text-xl font-bold">IMS Pro</h1>
        </div>
        
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-white bg-opacity-20 shadow-lg'
                    : 'hover:bg-white hover:bg-opacity-10'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}