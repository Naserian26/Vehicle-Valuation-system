import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, Edit, CarFront, Search, Fuel, Gauge,
  ChevronLeft, ChevronRight, AlertCircle, Calculator, X
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
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    make: '', model: '', engineCc: '', fuelType: 'GASOLINE', crsp: '', bodyType: '', driveType: '', year: '2025'
  });

  useEffect(() => { fetchInitialData(); }, []);
  useEffect(() => { fetchVehicles(); }, [page, search, dataYear]);

  const fetchInitialData = async () => {
    try {
      const res = await axios.get('/api/auth/matrix');
      setMatrix(res.data || {});
    } catch (err) { console.error(err); }
  };

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/vehicles', { params: { page, search, year: dataYear } });
      setVehicles(res.data.vehicles || []);
      setTotalPages(res.data.pages || 1);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/vehicles/${id}`);
      fetchVehicles();
      setShowDeleteConfirm(null);
    } catch { alert('Failed to delete vehicle'); }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVehicle) {
        await axios.put(`/api/vehicles/${editingVehicle._id}`, formData);
      } else {
        await axios.post('/api/vehicles', formData);
      }
      setShowModal(false);
      fetchVehicles();
    } catch (err) { alert(err.response?.data?.message || 'Failed to save vehicle'); }
  };

  const role = (user?.role?.toLowerCase() === 'user' ? 'viewer' : user?.role?.toLowerCase()) || 'viewer';
  const canAdd = matrix.add_vehicles?.[role];
  const canEditDelete = matrix.edit_vehicles?.[role];
  const canCalculateTax = matrix.calculate_taxes?.[role];

  const yearFilters = ['ALL', '2025', '2020'];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-[10px] font-black text-[#DA3832] uppercase tracking-widest mb-1">Kenya Revenue Authority</p>
          <h1 className="text-3xl font-black text-black dark:text-white uppercase tracking-tight">Vehicle Directory</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
            {dataYear ? `${dataYear} Inventory` : 'All Years'}
          </p>
        </div>

        {/* Year Filter */}
        <div className="flex border-2 border-black dark:border-gray-700 overflow-hidden">
          {yearFilters.map((y) => (
            <button
              key={y}
              onClick={() => { setDataYear(y === 'ALL' ? '' : y); setPage(1); }}
              className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-colors border-r-2 border-black dark:border-gray-700 last:border-r-0
                ${(dataYear === '' && y === 'ALL') || dataYear === y
                  ? 'bg-[#DA3832] text-white'
                  : 'bg-white dark:bg-gray-900 text-black dark:text-gray-400 hover:bg-black hover:text-white'}`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Search + Add */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by make or model..."
            className="w-full bg-white dark:bg-gray-900 border-2 border-black dark:border-gray-700
              focus:border-[#DA3832] dark:focus:border-[#DA3832]
              pl-11 pr-4 py-3 text-sm font-bold outline-none transition-all
              text-black dark:text-white placeholder:text-gray-300 placeholder:font-normal"
          />
        </div>
        {canAdd && dataYear === "2025" && (
          <button
            onClick={() => {
              setEditingVehicle(null);
              setFormData({ make: '', model: '', engineCc: '', fuelType: 'GASOLINE', crsp: '', bodyType: '', driveType: '', year: '2025' });
              setShowModal(true);
            }}
            className="bg-black dark:bg-gray-800 hover:bg-[#DA3832] text-white px-6 py-3 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all border-2 border-black dark:border-gray-700"
          >
            <Plus size={16} /> Add Vehicle
          </button>
        )}
      </div>

      {/* Vehicle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="border-2 border-black dark:border-gray-700 p-6 animate-pulse space-y-4 bg-white dark:bg-gray-900">
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
              <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded w-2/3" />
              <div className="h-20 bg-gray-50 dark:bg-gray-800 rounded" />
              <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded" />
            </div>
          ))
        ) : vehicles.length === 0 ? (
          <div className="col-span-full py-20 border-2 border-dashed border-black dark:border-gray-700 flex flex-col items-center justify-center gap-4">
            <CarFront size={40} className="text-gray-200 dark:text-gray-700" />
            <p className="font-black text-sm uppercase tracking-widest text-gray-400">No vehicles found</p>
          </div>
        ) : (
          vehicles.map(v => (
            <div key={v._id} className="bg-white dark:bg-gray-900 border-2 border-black dark:border-gray-700 flex flex-col group hover:border-[#DA3832] transition-colors">
              {/* Card Top Bar */}
              <div className="flex items-center justify-between px-4 py-2 bg-black dark:bg-gray-800 border-b-2 border-black dark:border-gray-700">
                <span className="text-[10px] font-black text-[#DA3832] uppercase tracking-widest">{v.year} Model</span>
                <div className="flex gap-1">
                  {canEditDelete && (
                    <>
                      <button
                        onClick={() => {
                          setEditingVehicle(v);
                          setFormData({
                            make: v.make || '', model: v.model || '',
                            engineCc: v.engineCc || v.engine_cc || '',
                            fuelType: v.fuelType || 'GASOLINE',
                            crsp: v.crsp || '', bodyType: v.bodyType || '',
                            driveType: v.driveType || '', year: v.year || '2025'
                          });
                          setShowModal(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-white transition-colors"
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(v._id)}
                        className="p-1.5 text-gray-400 hover:text-[#DA3832] transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="text-lg font-black text-black dark:text-white uppercase mb-4 leading-tight">
                  {v.make} <span className="text-gray-400 font-bold">{v.model}</span>
                </h3>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { icon: Gauge, label: 'Capacity', val: `${v.engineCc || v.engine_cc || '-'} CC` },
                    { icon: Fuel, label: 'Fuel', val: v.fuelType || v.fuel_type || '-' },
                    { icon: CarFront, label: 'Body', val: v.bodyType || v.body_type || '-' },
                    { icon: Gauge, label: 'Drive', val: v.driveType || v.drive_type || '-' },
                  ].map(({ icon: Icon, label, val }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className="p-1.5 bg-black dark:bg-gray-800 shrink-0">
                        <Icon size={11} className="text-[#DA3832]" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-300 dark:text-gray-600 uppercase">{label}</p>
                        <p className="text-xs font-bold text-black dark:text-gray-300 uppercase">{val}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-4 border-t-2 border-black dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">CRSP Value</p>
                    <p className="text-lg font-black text-[#DA3832]">
                      <span className="text-xs mr-0.5">KES</span>
                      {v.crsp?.toLocaleString() || v.crsp_value?.toLocaleString() || '-'}
                    </p>
                  </div>
                  {canCalculateTax && (
                    <button
                      onClick={() => navigate('/valuation', { state: { vehicle: v } })}
                      className="flex items-center gap-2 bg-black dark:bg-gray-800 hover:bg-[#DA3832] text-white px-4 py-2 font-black text-xs uppercase tracking-widest transition-all"
                    >
                      <Calculator size={12} /> Valuation
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-1 mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2.5 border-2 border-black dark:border-gray-700 text-black dark:text-gray-400 disabled:opacity-30 hover:bg-black hover:text-white transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          {[...Array(Math.min(5, totalPages))].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-10 h-10 font-black text-xs border-2 transition-all
                ${page === i + 1
                  ? 'bg-[#DA3832] border-[#DA3832] text-white'
                  : 'border-black dark:border-gray-700 text-black dark:text-gray-400 hover:bg-black hover:text-white'}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2.5 border-2 border-black dark:border-gray-700 text-black dark:text-gray-400 disabled:opacity-30 hover:bg-black hover:text-white transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70">
          <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-gray-700 p-8 w-full max-w-sm">
            <div className="w-12 h-12 bg-[#DA3832] flex items-center justify-center mb-5">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-black text-black dark:text-white uppercase mb-2">Delete Vehicle?</h2>
            <p className="text-gray-500 text-sm mb-6 font-medium">This will permanently remove the vehicle from the directory.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3 border-2 border-black dark:border-gray-700 text-black dark:text-gray-300 font-black text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 py-3 bg-[#DA3832] text-white font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70">
          <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-gray-700 w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 bg-black dark:bg-gray-800 border-b-2 border-black dark:border-gray-700">
              <h2 className="text-sm font-black text-white uppercase tracking-widest">
                {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Make', key: 'make', placeholder: 'TOYOTA', span: 1 },
                  { label: 'Model', key: 'model', placeholder: 'COROLLA', span: 1 },
                  { label: 'Engine CC', key: 'engineCc', placeholder: '1500', type: 'number', span: 1 },
                ].map(({ label, key, placeholder, type, span }) => (
                  <div key={key} className={span === 2 ? 'col-span-2' : ''}>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{label}</label>
                    <input
                      required type={type || 'text'}
                      value={formData[key]}
                      onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                      placeholder={placeholder}
                      className="w-full border-2 border-black dark:border-gray-700 p-2.5 text-sm font-bold bg-white dark:bg-gray-800 text-black dark:text-white focus:border-[#DA3832] outline-none transition-colors"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Fuel Type</label>
                  <select
                    value={formData.fuelType}
                    onChange={e => setFormData({ ...formData, fuelType: e.target.value })}
                    className="w-full border-2 border-black dark:border-gray-700 p-2.5 text-sm font-bold bg-white dark:bg-gray-800 text-black dark:text-white focus:border-[#DA3832] outline-none"
                  >
                    {['GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC'].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">CRSP Value (KES)</label>
                  <input
                    required type="number" step="0.01"
                    value={formData.crsp}
                    onChange={e => setFormData({ ...formData, crsp: e.target.value })}
                    placeholder="2500000"
                    className="w-full border-2 border-black dark:border-gray-700 p-2.5 text-sm font-bold bg-white dark:bg-gray-800 text-black dark:text-white focus:border-[#DA3832] outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border-2 border-black dark:border-gray-700 text-black dark:text-gray-300 font-black text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-3 bg-[#DA3832] text-white font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-colors">
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleDB;