import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, Edit, CarFront, Search, Fuel, Gauge,
  Calendar, ChevronLeft, ChevronRight, AlertCircle, Calculator
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const VehicleDB = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [dataYear, setDataYear] = useState("2025");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [matrix, setMatrix] = useState({});
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // NEW: State for Add/Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({ 
    make: '', model: '', engineCc: '', fuelType: 'GASOLINE', crsp: '', bodyType: '', driveType: '', year: '2025'
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [page, search, dataYear]);

  const fetchInitialData = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/auth/matrix');
      setMatrix(res.data || {});
    } catch (err) {
      console.error('Error fetching matrix:', err);
    }
  };

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/vehicles`, {
        params: {
          page,
          search,
          year: dataYear
        }
      });
      setVehicles(res.data.vehicles || []);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/vehicles/${id}`);
      fetchVehicles();
      setShowDeleteConfirm(null);
    } catch (err) {
      alert('Failed to delete vehicle');
    }
  };

  // NEW: Submit handler for the Add/Edit Modal
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVehicle) {
        await axios.put(`http://localhost:5000/api/vehicles/${editingVehicle._id}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/vehicles', formData);
      }
      setShowModal(false);
      fetchVehicles(); // Refresh the directory
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save vehicle');
    }
  };

  const role = (user?.role?.toLowerCase() === 'user' ? 'viewer' : user?.role?.toLowerCase()) || 'viewer';
  const canAdd = matrix.add_vehicles?.[role];
  const canEditDelete = matrix.edit_vehicles?.[role];
  const canCalculateTax = matrix.calculate_taxes?.[role];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase transition-colors">Vehicle Directory</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
            Active Global Inventory {dataYear ? `(${dataYear})` : '(All Years)'}
          </p>
        </div>

        <div className="flex bg-white dark:bg-gray-900 p-1 rounded-lg border border-gray-200 dark:border-gray-800 transition-colors">
          <button
            onClick={() => { setDataYear(''); setPage(1); }}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${dataYear === '' ? 'bg-red-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
          >
            ALL
          </button>
          <button
            onClick={() => { setDataYear('2025'); setPage(1); }}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${dataYear === '2025' ? 'bg-red-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
          >
            2025
          </button>
          <button
            onClick={() => { setDataYear('2020'); setPage(1); }}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${dataYear === '2020' ? 'bg-red-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
          >
            2020
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by Make or Model..."
            className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus:border-red-600 dark:focus:border-red-500 pl-12 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all placeholder:italic text-gray-900 dark:text-white"
          />
        </div>
        {canAdd && dataYear === "2025" && (
          <button 
            onClick={() => {
              setEditingVehicle(null);
              setFormData({ make: '', model: '', engineCc: '', fuelType: 'GASOLINE', crsp: '', bodyType: '', driveType: '', year: '2025' });
              setShowModal(true);
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
          >
            <Plus size={18} /> Add New
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm animate-pulse space-y-4">
              <div className="h-4 bg-gray-100 rounded w-3/4 mx-auto"></div>
              <div className="h-10 bg-gray-50 rounded"></div>
              <div className="h-6 bg-gray-100 rounded w-1/2 mx-auto"></div>
            </div>
          ))
        ) : vehicles.length === 0 ? (
          <div className="col-span-full py-20 bg-white border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 space-y-4">
            <CarFront size={48} className="opacity-20" />
            <p className="font-bold uppercase tracking-widest text-sm text-center">
              No vehicles found in the directory <br />
              <span className="text-gray-300 font-medium lowercase">
                {dataYear ? `matching filters for ${dataYear}` : 'matching current filters'}
              </span>
            </p>
          </div>
        ) : (
          vehicles.map(v => (
            <div key={v._id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col">
              {/* Card Header */}
              <div className="mb-4 border-b border-gray-50 pb-4">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded tracking-widest uppercase transition-colors">
                    {v.year} Model
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canEditDelete && (
                      <button 
                        onClick={() => {
                          setEditingVehicle(v);
                          setFormData({
                            make: v.make || '',
                            model: v.model || '',
                            engineCc: v.engineCc || v.engine_cc || v.cc || '',
                            fuelType: v.fuelType || v.fuel_type || 'GASOLINE',
                            crsp: v.crsp || v.crsp_value || '',
                            bodyType: v.bodyType || v.body_type || '',
                            driveType: v.driveType || v.drive_type || '',
                            year: v.year || '2025'
                          });
                          setShowModal(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors bg-gray-50 rounded-lg"
                      >
                        <Edit size={14} />
                      </button>
                    )}
                    {canEditDelete && (
                      <button
                        onClick={() => setShowDeleteConfirm(v._id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors bg-gray-50 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase truncate leading-tight transition-colors">
                  {v.make} <span className="text-gray-400 dark:text-gray-500 font-bold">{v.model}</span>
                </h3>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gray-50 rounded text-gray-400">
                    <Gauge size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-tighter transition-colors">Capacity</span>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors">{v.engineCc || v.engine_cc || v.cc || '-'} CC</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gray-50 rounded text-gray-400">
                    <Fuel size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-tighter transition-colors">Fuel</span>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 capitalize transition-colors">{v.fuelType || v.fuel_type || '-'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gray-50 rounded text-gray-400">
                    <CarFront size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-tighter transition-colors">Body Type</span>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase transition-colors">{v.bodyType || v.body_type || '-'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gray-50 rounded text-gray-400">
                    <Gauge size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-tighter transition-colors">Drive</span>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase transition-colors">{v.driveType || v.drive_type || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-auto border-t border-gray-50 dark:border-gray-800 pt-4 flex items-center justify-between transition-colors">
                <div>
                  <p className="text-[9px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-widest leading-none transition-colors">CRSP Value</p>
                  <p className="text-lg font-black text-red-600 dark:text-red-500 transition-colors">
                    <span className="text-xs mr-0.5">KES</span>
                    {v.crsp?.toLocaleString() || v.crsp_value?.toLocaleString() || '-'}
                  </p>
                </div>
                {canCalculateTax && (
                  <button
                    onClick={() => navigate('/valuation', { state: { vehicle: v } })}
                    className="flex items-center gap-2 bg-gray-900 dark:bg-gray-800 hover:bg-red-600 dark:hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase transition-all shadow-sm"
                  >
                    <Calculator size={14} />
                    Valuation
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 border border-gray-200 text-gray-400 rounded-lg disabled:opacity-30 hover:bg-white transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex gap-1">
            {[...Array(Math.min(5, totalPages))].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-10 h-10 rounded-lg font-bold text-xs transition-all ${page === i + 1 ? 'bg-red-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-red-600'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 border border-gray-200 text-gray-400 rounded-lg disabled:opacity-30 hover:bg-white transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Record</h2>
            <p className="text-gray-500 text-sm mb-6">Are you sure you want to delete this vehicle from the directory?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold text-sm">Cancel</button>
              <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: ADD / EDIT MODAL UI */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase mb-6">
              {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
            </h2>
            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Make</label>
                  <input required type="text" value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm bg-transparent dark:text-white" placeholder="e.g. TOYOTA" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Model</label>
                  <input required type="text" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm bg-transparent dark:text-white" placeholder="e.g. COROLLA" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Engine CC</label>
                  <input required type="number" value={formData.engineCc} onChange={e => setFormData({...formData, engineCc: e.target.value})} className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm bg-transparent dark:text-white" placeholder="e.g. 1500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fuel Type</label>
                  <select value={formData.fuelType} onChange={e => setFormData({...formData, fuelType: e.target.value})} className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm bg-transparent dark:text-white">
                    <option value="GASOLINE">Gasoline</option>
                    <option value="DIESEL">Diesel</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="ELECTRIC">Electric</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CRSP Value (KES)</label>
                  <input required type="number" step="0.01" value={formData.crsp} onChange={e => setFormData({...formData, crsp: e.target.value})} className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm bg-transparent dark:text-white" placeholder="e.g. 2500000" />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-sm transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-colors">Save Vehicle</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Badge = ({ icon: Icon, text }) => (
  <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 px-3 py-1.5 rounded-lg">
    <Icon className="w-3.5 h-3.5 text-gray-500" />
    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{text}</span>
  </div>
);

export default VehicleDB;