import React from 'react'
export default function StatCard({ title, value, icon: Icon, color, subtitle }) {
    const colorClasses = {
      blue: 'from-blue-400 to-blue-600',
      green: 'from-green-400 to-green-600',
      purple: 'from-purple-400 to-purple-600',
      red: 'from-red-400 to-red-600',
      yellow: 'from-yellow-400 to-yellow-600',
      indigo: 'from-indigo-400 to-indigo-600'
    };
  
    return (
      <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-6 text-white shadow-lg transform transition hover:scale-105 hover:shadow-xl`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium opacity-90">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs opacity-75 mt-1">{subtitle}</p>}
          </div>
          {Icon && <Icon className="w-12 h-12 opacity-80" />}
        </div>
      </div>
    );
  }
  