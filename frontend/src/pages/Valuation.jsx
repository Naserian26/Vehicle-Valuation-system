import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Calculator, Share2, Printer, ChevronLeft, ChevronRight } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const CURRENT_YEAR = 2026;
const MIN_YEAR = CURRENT_YEAR - 8;
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const calculateTaxLogic = (data) => {
  const crsp = parseFloat(data.crsp);
  if (!crsp || isNaN(crsp)) return null;
  const inputYear = parseInt(data.year) || 2025;
  const age = CURRENT_YEAR - inputYear;
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
  return { customsValue, importDuty, exciseDuty, vat, idf, rdl, totalTaxes: importDuty + exciseDuty + vat + idf + rdl };
};

const YearMonthPicker = ({ value, month, onChangeYear, onChangeMonth }) => {
  const [open, setOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(parseInt(value) || CURRENT_YEAR);
  const pickerYearRef = useRef(pickerYear);
  const ref = useRef(null);

  useEffect(() => { pickerYearRef.current = pickerYear; }, [pickerYear]);
  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const displayValue = month !== null && month !== undefined
    ? `${MONTHS[month]} ${value}` : value ? `${value}` : 'Select year & month';

  const handleMonthSelect = (monthIdx) => {
    onChangeYear(String(pickerYearRef.current));
    onChangeMonth(monthIdx);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button" onClick={() => setOpen(!open)}
        className="w-full border-2 border-black dark:border-gray-700 focus:border-[#DA3832] bg-white dark:bg-gray-800 text-black dark:text-white p-4 font-bold outline-none text-left transition-colors text-sm"
      >
        {displayValue}
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-72 bg-black border-2 border-[#DA3832] shadow-2xl p-4">
          {/* Year Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => {
                if (pickerYear > MIN_YEAR) {
                  const y = pickerYear - 1;
                  setPickerYear(y);
                  pickerYearRef.current = y;
                  onChangeYear(String(y));
                }
              }}
              disabled={pickerYear <= MIN_YEAR}
              className="w-8 h-8 flex items-center justify-center border-2 border-[#DA3832] text-white hover:bg-[#DA3832] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="font-black text-[#DA3832] text-xl tracking-widest">{pickerYear}</span>

            <button
              type="button"
              onClick={() => {
                if (pickerYear < CURRENT_YEAR) {
                  const y = pickerYear + 1;
                  setPickerYear(y);
                  pickerYearRef.current = y;
                  onChangeYear(String(y));
                }
              }}
              disabled={pickerYear >= CURRENT_YEAR}
              className="w-8 h-8 flex items-center justify-center border-2 border-[#DA3832] text-white hover:bg-[#DA3832] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#DA3832] mb-4 opacity-40" />

          {/* Month Grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {MONTHS.map((m, idx) => {
              const isDisabled = pickerYear === CURRENT_YEAR && idx > new Date().getMonth();
              const isSelected = month === idx && parseInt(value) === pickerYear;
              return (
                <button
                  key={m} type="button" disabled={isDisabled}
                  onClick={() => !isDisabled && handleMonthSelect(idx)}
                  className={`py-2.5 text-sm font-black uppercase tracking-widest transition-colors
                    ${isSelected ? 'bg-[#DA3832] text-white' : ''}
                    ${!isSelected && !isDisabled ? 'text-white hover:bg-[#DA3832] hover:text-white border border-white/10 hover:border-[#DA3832]' : ''}
                    ${isDisabled ? 'text-gray-700 cursor-not-allowed border border-transparent' : ''}
                  `}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="h-px bg-[#DA3832] mt-4 mb-3 opacity-40" />
          <p className="text-[10px] text-[#DA3832] text-center font-black uppercase tracking-widest">
            {MIN_YEAR} – {CURRENT_YEAR}
          </p>
        </div>
      )}
    </div>
  );
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
  const [selectedMonth, setSelectedMonth] = useState(null);
  const results = useMemo(() => calculateTaxLogic(inputs), [inputs]);

  const handleInputChange = (field, value) => setInputs(prev => ({ ...prev, [field]: value }));

  const handleWhatsAppCopy = () => {
    if (!results) return;
    const monthStr = selectedMonth !== null ? `${MONTHS[selectedMonth]} ` : '';
    const message = `*VEHICLE TAX QUOTE*\nModel: ${vehicle?.make || 'Custom'} ${vehicle?.model || ''}\nYear: ${monthStr}${inputs.year}\nTotal Tax: KES ${Math.round(results.totalTaxes).toLocaleString()}`;
    navigator.clipboard.writeText(message);
    alert("✅ Quote copied to clipboard!");
  };

  const chartData = results ? {
    labels: ['Import Duty', 'Excise', 'VAT', 'IDF', 'RDL'],
    datasets: [{
      data: [results.importDuty, results.exciseDuty, results.vat, results.idf, results.rdl],
      backgroundColor: ['#DA3832', '#000000', '#444444', '#777777', '#AAAAAA'],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  } : null;

  const lockedClass = 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed';
  const editableClass = 'bg-white dark:bg-gray-800 border-black dark:border-gray-700 text-black dark:text-white focus:border-[#DA3832]';

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-[10px] font-black text-[#DA3832] uppercase tracking-widest mb-1">Kenya Revenue Authority</p>
          <h1 className="text-3xl font-black text-black dark:text-white uppercase tracking-tight">Tax Valuation</h1>
        </div>
        {vehicle && (
          <div className="bg-black dark:bg-gray-800 px-5 py-2.5 border-2 border-black dark:border-gray-700">
            <p className="text-[10px] text-[#DA3832] font-black uppercase tracking-widest">Vehicle</p>
            <p className="text-white font-black text-sm uppercase">{vehicle.make} {vehicle.model}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Input Panel */}
        <div className="border-2 border-black dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="bg-black dark:bg-gray-800 px-6 py-4 border-b-2 border-black dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Calculator size={16} className="text-[#DA3832]" />
              <p className="text-xs font-black text-white uppercase tracking-widest">Calculate Taxes</p>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Base CRSP (KES)</label>
              <input
                type="number" value={inputs.crsp} readOnly={!!vehicle}
                onChange={(e) => !vehicle && handleInputChange('crsp', e.target.value)}
                className={`w-full border-2 p-4 text-xl font-black outline-none transition-colors ${vehicle ? lockedClass : editableClass}`}
                placeholder="Enter CRSP value"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Year & Month</label>
                <YearMonthPicker
                  value={inputs.year} month={selectedMonth}
                  onChangeYear={(val) => handleInputChange('year', val)}
                  onChangeMonth={(m) => setSelectedMonth(m)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Engine CC</label>
                <input
                  type="number" value={inputs.cc} readOnly={!!vehicle}
                  onChange={(e) => !vehicle && handleInputChange('cc', e.target.value)}
                  className={`w-full border-2 p-4 font-black outline-none transition-colors ${vehicle ? lockedClass : editableClass}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="border-2 border-black dark:border-gray-700 bg-white dark:bg-gray-900">
          {results ? (
            <>
              <div className="bg-black dark:bg-gray-800 px-6 py-4 border-b-2 border-black dark:border-gray-700">
                <p className="text-[10px] font-black text-[#DA3832] uppercase tracking-widest">Total Tax</p>
                <p className="text-2xl font-black text-white">KES {Math.round(results.totalTaxes).toLocaleString()}</p>
              </div>
              <div className="p-6">
                <div className="relative h-40 w-40 mx-auto mb-6">
                  <Doughnut data={chartData} options={{ cutout: '72%', plugins: { legend: { display: false } }, maintainAspectRatio: false }} />
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: 'Import Duty', value: results.importDuty },
                    { label: 'Excise Duty', value: results.exciseDuty },
                    { label: 'VAT (16%)', value: results.vat },
                    { label: 'IDF (2.25%)', value: results.idf },
                    { label: 'RDL (1.5%)', value: results.rdl },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center border-b border-black/5 dark:border-gray-800 pb-2">
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</span>
                      <span className="text-sm font-black text-black dark:text-white">KES {Math.round(value).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-5 flex gap-3">
                  <button onClick={handleWhatsAppCopy}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all">
                    <Share2 size={14} /> WhatsApp
                  </button>
                  <button onClick={() => window.print()}
                    className="flex-1 flex items-center justify-center gap-2 bg-black dark:bg-gray-800 text-white py-3 font-black text-xs uppercase tracking-widest hover:bg-[#DA3832] transition-all">
                    <Printer size={14} /> Print
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 border-2 border-black dark:border-gray-700 flex items-center justify-center mb-4">
                <Calculator size={28} className="text-gray-200 dark:text-gray-700" />
              </div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Enter details to calculate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Valuation;