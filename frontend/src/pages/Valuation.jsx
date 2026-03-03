import React, { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Calculator, Share2, Printer, CheckCircle } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const calculateTaxLogic = (data) => {
  const crsp = parseFloat(data.crsp);
  if (!crsp || isNaN(crsp)) return null;

  const currentYear = 2026;
  const inputYear = parseInt(data.year) || 2025;
  const age = currentYear - inputYear;
  const cc = parseInt(data.cc) || 0;

  let depRate = 0.70;
  if (age < 1) depRate = 0.10;
  else if (age < 2) depRate = 0.15;
  else if (age < 3) depRate = 0.20;
  else if (age < 4) depRate = 0.30;
  else if (age < 5) depRate = 0.40;
  else if (age < 6) depRate = 0.50;
  else if (age < 7) depRate = 0.60;

  const customsValue = crsp * (1 - depRate);
  const importDuty = customsValue * 0.25;
  const exciseRate = cc > 2500 ? 0.35 : (cc > 1500 ? 0.25 : 0.20);
  const exciseDuty = (customsValue + importDuty) * exciseRate;
  const vat = (customsValue + importDuty + exciseDuty) * 0.16;
  const idf = customsValue * 0.0225;
  const rdl = customsValue * 0.015;

  return {
    customsValue,
    importDuty,
    exciseDuty,
    vat,
    idf,
    rdl,
    totalTaxes: importDuty + exciseDuty + vat + idf + rdl
  };
};

const Valuation = () => {
  const location = useLocation();
  const vehicle = location.state?.vehicle;

  const [inputs, setInputs] = useState({
    crsp: vehicle?.crsp || vehicle?.crsp_value || '',
    year: String(vehicle?.year || '2025'),
    cc: vehicle?.engineCc || vehicle?.engine_cc || vehicle?.cc || '',
    fuel: vehicle?.fuelType || vehicle?.fuel_type || 'Petrol'
  });

  const results = useMemo(() => calculateTaxLogic(inputs), [inputs]);

  const handleInputChange = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleWhatsAppCopy = () => {
    if (!results) return;
    const message = `*VEHICLE TAX QUOTE*\nModel: ${vehicle?.make || 'Custom'} ${vehicle?.model || ''}\nYear: ${inputs.year}\nTotal Tax: KES ${Math.round(results.totalTaxes).toLocaleString()}`;
    navigator.clipboard.writeText(message);
    alert("✅ Quote copied to clipboard!");
  };

  const chartData = results ? {
    labels: ['Import Duty', 'Excise', 'VAT', 'IDF', 'RDL'],
    datasets: [{
      data: [results.importDuty, results.exciseDuty, results.vat, results.idf, results.rdl],
      backgroundColor: ['#DA3832', '#333333', '#666666', '#999999', '#CCCCCC'],
      borderWidth: 1,
      borderColor: '#ffffff'
    }]
  } : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase transition-colors">Tax Valuation</h1>
        {vehicle && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-4 py-2 rounded-lg transition-colors">
            <span className="text-red-600 dark:text-red-400 font-bold text-xs uppercase">Vehicle: {vehicle.make} {vehicle.model}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-xl shadow-sm space-y-6 transition-colors">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Calculate Taxes</h3>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Base CRSP (KES)</label>
            <input
              type="number"
              value={inputs.crsp}
              onChange={(e) => handleInputChange('crsp', e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white p-4 rounded-xl text-xl font-bold focus:ring-1 focus:ring-red-600 dark:focus:ring-red-500 outline-none transition-colors"
              placeholder="Enter CRSP value"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Year</label>
              <input
                type="number"
                value={inputs.year}
                onChange={(e) => handleInputChange('year', e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white p-4 rounded-xl font-bold focus:ring-1 focus:ring-red-600 dark:focus:ring-red-500 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Engine CC</label>
              <input
                type="number"
                value={inputs.cc}
                onChange={(e) => handleInputChange('cc', e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white p-4 rounded-xl font-bold focus:ring-1 focus:ring-red-600 dark:focus:ring-red-500 outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 shadow-sm transition-colors">
          {results ? (
            <div className="space-y-8 text-center lg:text-left">
              <div className="relative h-48 w-48 mx-auto lg:mx-0">
                <Doughnut
                  data={chartData}
                  options={{
                    cutout: '75%',
                    plugins: { legend: { display: false } },
                    maintainAspectRatio: false
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Tax</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white transition-colors">KES {Math.round(results.totalTaxes).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <ResultRow label="Import Duty" value={results.importDuty} />
                <ResultRow label="Excise Duty" value={results.exciseDuty} />
                <ResultRow label="VAT (16%)" value={results.vat} />
                <ResultRow label="IDF (2.25%)" value={results.idf} />
                <ResultRow label="RDL (1.5%)" value={results.rdl} />
              </div>

              <div className="pt-6 flex gap-3">
                <button
                  onClick={handleWhatsAppCopy}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-xl font-bold text-xs uppercase hover:opacity-90 transition-all"
                >
                  <Share2 size={16} /> WhatsApp
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-900 dark:bg-gray-800 text-white py-3 rounded-xl font-bold text-xs uppercase hover:bg-gray-800 dark:hover:bg-gray-700 transition-all shadow-sm"
                >
                  <Printer size={16} /> Print
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <Calculator size={48} className="opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest">Enter details to calculate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ResultRow = ({ label, value }) => (
  <div className="flex justify-between items-center text-sm border-b border-gray-50 dark:border-gray-800 pb-2 transition-colors">
    <span className="text-gray-500 dark:text-gray-400 font-medium">{label}</span>
    <span className="text-gray-900 dark:text-white font-bold transition-colors">KES {Math.round(value).toLocaleString()}</span>
  </div>
);

export default Valuation;