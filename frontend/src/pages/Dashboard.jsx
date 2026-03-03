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
import { CarFront, Calculator, Users as UsersIcon } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // 1. ADDED top_vehicles TO INITIAL STATE
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
          axios.get('http://localhost:5000/api/dashboard-stats'),
          axios.get('http://localhost:5000/api/auth/matrix')
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

  // 2. UPDATED CHART DATA TO MAP THROUGH TOP VEHICLES
  const chartData = {
    labels: stats.top_vehicles?.map(v => v._id) || [],
    datasets: [
      {
        label: 'Vehicle Count',
        data: stats.top_vehicles?.map(v => v.count) || [],
        backgroundColor: '#DA3832', // KRA Red
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase transition-colors">Dashboard Overview</h1>
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 transition-colors">
          Logged in as: <span className="text-gray-900 dark:text-white font-bold">{user?.email}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Vehicles" value={stats.total_vehicles} />
        <StatCard title="2025 Vehicles" value={stats.vehicles_by_year?.['2025'] || 0} />
        <StatCard title="2020 Vehicles" value={stats.vehicles_by_year?.['2020'] || 0} />
        <StatCard title="Total Users" value={stats.total_users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm transition-colors">
          
          {/* 3. UPDATED CHART TITLE */}
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 transition-colors">Top Vehicles by Volume</h3>
          
          <div className="h-64">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">Loading charts...</div>
            ) : (
              <Bar
                data={chartData}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, grid: { color: '#374151' }, ticks: { color: '#9ca3af' } },
                    x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
                  }
                }}
              />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Quick Actions</h3>
          {canManageDB && (
            <button
              onClick={() => navigate('/database')}
              className="w-full flex items-center gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-red-600 dark:hover:border-red-500 p-4 rounded-xl transition-all group"
            >
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 transition-colors">
                <CarFront size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm text-gray-900 dark:text-white transition-colors">Vehicle Search</p>
                <p className="text-xs text-gray-400 transition-colors">Search global directory</p>
              </div>
            </button>
          )}

          {canValue && (
            <button
              onClick={() => navigate('/valuation')}
              className="w-full flex items-center gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-red-600 dark:hover:border-red-500 p-4 rounded-xl transition-all group"
            >
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 transition-colors">
                <Calculator size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm text-gray-900 dark:text-white transition-colors">Run Valuation</p>
                <p className="text-xs text-gray-400 transition-colors">Calculate vehicle taxes</p>
              </div>
            </button>
          )}

          {canManageUsers && (
            <button
              onClick={() => navigate('/users')}
              className="w-full flex items-center gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-red-600 dark:hover:border-red-500 p-4 rounded-xl transition-all group"
            >
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 transition-colors">
                <UsersIcon size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm text-gray-900 dark:text-white transition-colors">User Management</p>
                <p className="text-xs text-gray-400 transition-colors">Manage access levels</p>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-xl shadow-sm transition-colors">
    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 transition-colors">{title}</p>
    <p className="text-2xl font-black text-gray-900 dark:text-white transition-colors">{value?.toLocaleString() || 0}</p>
  </div>
);

export default Dashboard;