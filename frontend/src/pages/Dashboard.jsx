import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useAuth } from '../contexts/AuthContext';
import { CarFront, Calculator, Users as UsersIcon, TrendingUp, ArrowRight } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total_vehicles: 0,
    vehicles_by_year: {},
    total_users: 0,
    users_by_role: {},
    top_vehicles: []
  });
  const [matrix, setMatrix] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [statsRes, matrixRes] = await Promise.all([
          axios.get('/api/dashboard-stats'),
          axios.get('/api/auth/matrix')
        ]);
        setStats(statsRes.data);
        setMatrix(matrixRes.data || {});
      } catch (err) {
        console.error('Dashboard Data Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const role = user?.role || 'viewer';
  const canValue = matrix.calculate_taxes?.[role];
  const canManageDB = matrix.search_vehicle_db?.[role];
  const canManageUsers = matrix.create_users?.[role] || matrix.assign_user_roles?.[role];

  const actions = [
    canManageDB && { icon: CarFront, label: 'Vehicle Search', sub: 'Search global directory', path: '/database' },
    canValue && { icon: Calculator, label: 'Run Valuation', sub: 'Calculate vehicle taxes', path: '/valuation' },
    canManageUsers && { icon: UsersIcon, label: 'User Management', sub: 'Manage access levels', path: '/users' },
  ].filter(Boolean);

  const chartData = {
    labels: stats.top_vehicles?.map(v => v._id) || [],
    datasets: [{
      label: 'Vehicles',
      data: stats.top_vehicles?.map(v => v.count) || [],
      backgroundColor: '#DA3832',
      hoverBackgroundColor: '#000000',
      borderWidth: 0,
      borderRadius: 0,
    }]
  };

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#000000',
        titleColor: '#DA3832',
        bodyColor: '#ffffff',
        borderColor: '#DA3832',
        borderWidth: 1,
        padding: 10,
        titleFont: { weight: 'bold', size: 11 },
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.06)' },
        ticks: { color: '#000000', font: { weight: 'bold', size: 10 } },
        border: { color: '#000000', width: 2 }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#000000', font: { weight: 'bold', size: 10 } },
        border: { color: '#000000', width: 2 }
      }
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-[10px] font-black text-[#DA3832] uppercase tracking-widest mb-1">Kenya Revenue Authority</p>
          <h1 className="text-3xl font-black text-black dark:text-white uppercase tracking-tight">
            Dashboard Overview
          </h1>
        </div>
        <div className="bg-black dark:bg-gray-900 px-5 py-2.5">
          <p className="text-[10px] text-[#DA3832] font-black uppercase tracking-widest">Logged in as</p>
          <p className="text-white font-bold text-sm">{user?.email}</p>
        </div>
      </div>

      {/* Stat Cards — lighter dividers, no outer border overlap */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Vehicles" value={stats.total_vehicles} />
        <StatCard title="2025 Vehicles" value={stats.vehicles_by_year?.['2025'] || 0} />
        <StatCard title="2020 Vehicles" value={stats.vehicles_by_year?.['2020'] || 0} />
        <StatCard title="Total Users" value={stats.total_users} />
      </div>

      {/* Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chart */}
        <div className="lg:col-span-2 border-2 border-black dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black dark:border-gray-700 bg-black dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <TrendingUp size={16} className="text-[#DA3832]" />
              <h3 className="text-xs font-black text-white uppercase tracking-widest">Top Vehicles by Volume</h3>
            </div>
            <div className="w-2 h-2 bg-[#DA3832]" />
          </div>
          <div className="p-6 h-64">
            {loading ? (
              <div className="h-full flex items-center justify-center gap-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-2 h-8 bg-[#DA3832] animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            ) : (
              <Bar data={chartData} options={chartOptions} />
            )}
          </div>
        </div>

        {/* Quick Actions — always filled, no empty space */}
        <div className="border-2 border-black dark:border-gray-700 flex flex-col">
          <div className="px-5 py-4 bg-black dark:bg-gray-800 border-b-2 border-black dark:border-gray-700 shrink-0">
            <p className="text-xs font-black text-white uppercase tracking-widest">Quick Actions</p>
          </div>

          <div className="flex flex-col flex-1">
            {actions.length > 0 ? (
              <>
                {actions.map(({ icon: Icon, label, sub, path }, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(path)}
                    className={`flex items-center gap-4 px-5 py-5 flex-1
                      ${i < actions.length - 1 ? 'border-b border-black/10 dark:border-gray-700' : ''}
                      bg-white dark:bg-gray-900
                      hover:bg-[#DA3832] dark:hover:bg-[#DA3832]
                      group transition-all duration-200`}
                  >
                    <div className="p-2.5 bg-black dark:bg-gray-800 group-hover:bg-white transition-colors shrink-0">
                      <Icon size={18} className="text-[#DA3832] group-hover:text-[#DA3832]" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-black text-sm text-black dark:text-white group-hover:text-white transition-colors uppercase tracking-wide">{label}</p>
                      <p className="text-xs text-gray-400 group-hover:text-white/70 transition-colors mt-0.5">{sub}</p>
                    </div>
                    <ArrowRight size={14} className="text-gray-300 group-hover:text-white transition-colors shrink-0" />
                  </button>
                ))}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 bg-white dark:bg-gray-900">
                <div className="w-8 h-8 border-2 border-black dark:border-gray-600 flex items-center justify-center mb-3">
                  <div className="w-2 h-2 bg-[#DA3832]" />
                </div>
                <p className="text-xs font-black text-black dark:text-gray-400 uppercase tracking-widest text-center">No actions available</p>
                <p className="text-xs text-gray-400 mt-1 text-center">Contact your administrator</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-gray-700 p-6 relative
    group hover:bg-black dark:hover:bg-gray-800 transition-colors duration-200">
    <div className="absolute top-0 left-0 w-full h-1 bg-[#DA3832]" />
    <p className="text-[10px] font-black text-gray-400 group-hover:text-[#DA3832] uppercase tracking-widest mb-2 transition-colors">{title}</p>
    <p className="text-3xl font-black text-black dark:text-white group-hover:text-white transition-colors">
      {value?.toLocaleString() || 0}
    </p>
  </div>
);

export default Dashboard;