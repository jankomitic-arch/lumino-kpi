import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Calendar, TrendingUp, ArrowRight } from 'lucide-react';

const months = [
  'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
  'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i);

export default function HomePage() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  const handleStart = () => {
    if (selectedMonth) {
      const monthIndex = months.indexOf(selectedMonth) + 1;
      navigate(`/dashboard/${selectedYear}/${monthIndex}`);
    }
  };

  return (
    <div 
      className="w-full min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-8"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className="max-w-2xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl mb-6 shadow-xl">
            <TrendingUp className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Lumino KPI Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Izaberite godinu i mesec za automatski generisan izveštaj
          </p>
        </div>

        {/* Selection Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Calendar className="w-7 h-7" />
              Odaberi period
            </h2>
            <p className="text-purple-100 mt-2">
              Sve nedelje i datumi će biti automatski popunjeni
            </p>
          </div>

          {/* Selection Form */}
          <div className="p-8 space-y-8">
            {/* Year Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Godina
              </label>
              <div className="grid grid-cols-5 gap-3">
                {years.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`p-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${
                      selectedYear === year
                        ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            {/* Month Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Mesec
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {months.map((month) => (
                  <button
                    key={month}
                    onClick={() => setSelectedMonth(month)}
                    className={`p-4 rounded-xl font-medium text-sm transition-all transform hover:scale-105 ${
                      selectedMonth === month
                        ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Preview */}
            {selectedMonth && (
              <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl border-2 border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Izabrani period:</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedMonth} {selectedYear}
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md">
                    <Calendar className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>
            )}

            {/* Start Button */}
            <button
              onClick={handleStart}
              disabled={!selectedMonth}
              className={`w-full py-5 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform ${
                selectedMonth
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Pokreni Dashboard
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="bg-white/80 backdrop-blur rounded-xl p-4 text-center shadow-md">
            <div className="text-3xl font-bold text-purple-600">📊</div>
            <p className="text-xs text-gray-600 mt-2">Auto tracking</p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-xl p-4 text-center shadow-md">
            <div className="text-3xl font-bold text-blue-600">⚡</div>
            <p className="text-xs text-gray-600 mt-2">Brza analiza</p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-xl p-4 text-center shadow-md">
            <div className="text-3xl font-bold text-teal-600">📈</div>
            <p className="text-xs text-gray-600 mt-2">Real-time podaci</p>
          </div>
        </div>
      </div>
    </div>
  );
}
