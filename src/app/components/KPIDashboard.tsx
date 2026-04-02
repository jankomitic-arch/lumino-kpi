import { useState, useEffect, useCallback } from 'react';
import { MapPin, Zap, Calendar, TrendingUp, Award, AlertCircle, Download, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toSvg } from 'html-to-image';

interface WeekData {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
}

interface DayEntry {
  location: string;
  power: string;
  points: string;
}

interface TeamWeekData {
  [weekId: string]: {
    [day: string]: DayEntry;
  };
}

interface KPIDashboardProps {
  initialMonth?: string;
  initialWeeks?: WeekData[];
  year?: number;
  month?: number;
}

// Function to calculate ISO week number
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const initialWeeks: WeekData[] = [
  { id: 'CW01', label: 'CW01', startDate: '2026-01-05', endDate: '2026-01-11' },
  { id: 'CW02', label: 'CW02', startDate: '2026-01-12', endDate: '2026-01-18' },
  { id: 'CW03', label: 'CW03', startDate: '2026-01-19', endDate: '2026-01-25' },
  { id: 'CW04', label: 'CW04', startDate: '2026-01-26', endDate: '2026-02-01' },
  { id: 'CW05', label: 'CW05', startDate: '2026-02-02', endDate: '2026-02-08' }
];

const days = ['Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota'];

const months = [
  'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
  'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
];

export function KPIDashboard({ initialMonth = 'Januar', initialWeeks = initialWeeks as WeekData[], year, month }: KPIDashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [weeks, setWeeks] = useState<WeekData[]>(initialWeeks);
  const [panonijaData, setPanonijaData] = useState<TeamWeekData>({});
  const [sumadijaData, setSumadijaData] = useState<TeamWeekData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!year || !month) { setLoading(false); return; }
    setLoading(true);
    fetch('/api/kpi?year=' + year + '&month=' + month)
      .then(r => r.json())
      .then(data => {
        if (data.panonija) setPanonijaData(data.panonija);
        if (data.sumadija) setSumadijaData(data.sumadija);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [year, month]);

  const saveToDB = useCallback(async (team, weekId, day, entry) => {
    if (!year || !month) return;
    setSaving(true);
    try {
      await fetch('/api/kpi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month, team, weekId, day, location: entry.location, power: entry.power, points: parseFloat(entry.points) || 0 })
      });
    } catch(e) { console.error(e); }
    finally { setSaving(false); }
  }, [year, month]);

  const updateWeekDates = (weekId: string, newDates: string) => {
    setWeeks(weeks.map(w => w.id === weekId ? { ...w, dates: newDates } : w));
  };

  const updateWeekStartDate = (weekId: string, newStartDate: string) => {
    setWeeks(weeks.map(w => {
      if (w.id === weekId) {
        const startDate = new Date(newStartDate);
        const weekNumber = getWeekNumber(startDate);
        const label = `CW${weekNumber.toString().padStart(2, '0')}`;
        return { ...w, startDate: newStartDate, label };
      }
      return w;
    }));
  };

  const updateWeekEndDate = (weekId: string, newEndDate: string) => {
    setWeeks(weeks.map(w => w.id === weekId ? { ...w, endDate: newEndDate } : w));
  };

  const formatDateDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const updateTeamData = (
    team: 'panonija' | 'sumadija',
    weekId: string,
    day: string,
    field: 'location' | 'power' | 'points',
    value: string
  ) => {
    const setData = team === 'panonija' ? setPanonijaData : setSumadijaData;
    setData(prev => {
      const currentDayData = prev[weekId]?.[day] || { location: '', power: '', points: '' };
      const updated = { ...currentDayData, [field]: value };
      saveToDB(team, weekId, day, updated);
      return {
        ...prev,
        [weekId]: {
          ...prev[weekId],
          [day]: updated
        }
      };
    });
  };

  const getTeamData = (team: 'panonija' | 'sumadija', weekId: string, day: string): DayEntry => {
    const data = team === 'panonija' ? panonijaData : sumadijaData;
    return data[weekId]?.[day] || { location: '', power: '', points: '' };
  };

  const calculateTotalPoints = (team: 'panonija' | 'sumadija'): number => {
    const data = team === 'panonija' ? panonijaData : sumadijaData;
    let total = 0;
    Object.values(data).forEach(weekData => {
      Object.values(weekData).forEach(dayEntry => {
        const points = parseFloat(dayEntry.points);
        if (!isNaN(points)) {
          total += points;
        }
      });
    });
    return total;
  };

  const getMonthlyResult = (total: number): { emoji: string; color: string; label: string } => {
    if (total >= 12) return { emoji: '😊', color: 'green', label: 'zeleno' };
    if (total >= 10) return { emoji: '😐', color: 'yellow', label: 'žuto' };
    return { emoji: '😢', color: 'red', label: 'crveno' };
  };

  const panonijaTotal = calculateTotalPoints('panonija');
  const sumadijaTotal = calculateTotalPoints('sumadija');
  const panonijaResult = getMonthlyResult(panonijaTotal);
  const sumadijaResult = getMonthlyResult(sumadijaTotal);

  const downloadDashboard = async () => {
    const dashboardElement = document.getElementById('dashboard-container');
    if (!dashboardElement) {
      alert('Greška: Dashboard element nije pronađen');
      return;
    }

    try {
      // Prikaži loading state
      const button = document.querySelector('.download-button');
      if (button) {
        button.textContent = 'Generišem SVG...';
      }

      // Konvertuj u SVG
      const dataUrl = await toSvg(dashboardElement, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      });

      // Kreiraj link za download
      const link = document.createElement('a');
      link.download = `Lumino-KPI-Dashboard-${selectedMonth}-${new Date().getTime()}.svg`;
      link.href = dataUrl;
      link.click();

      // Vrati button state
      if (button) {
        button.textContent = '✓ Preuzeto!';
        setTimeout(() => {
          button.textContent = 'Preuzmi SVG';
        }, 2000);
      }
    } catch (error) {
      console.error('Greška pri generisanju SVG:', error);
      alert('Greška pri generisanju SVG fajla. Pokušajte ponovo.');
    }
  };

  // Helper function to get the date for each day of the week from the first week
  const getWeekDayDate = (week: WeekData, dayIndex: number): string => {
    const startDate = new Date(week.startDate);
    const targetDate = new Date(startDate);
    targetDate.setDate(targetDate.getDate() + dayIndex);
    const day = targetDate.getDate().toString().padStart(2, '0');
    const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
    return `${day}.${month}`;
  };

  const getDateForDay = (dayIndex: number): string => {
    if (weeks.length === 0) return '';
    const firstWeek = weeks[0];
    const startDate = new Date(firstWeek.startDate);
    const targetDate = new Date(startDate);
    targetDate.setDate(targetDate.getDate() + dayIndex);
    const day = targetDate.getDate().toString().padStart(2, '0');
    const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
    return `${day}.${month}`;
  };

  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-8" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-[1600px] mx-auto" id="dashboard-container">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-purple-100 rounded-lg transition-colors no-export"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div className="w-1 h-8 bg-gradient-to-b from-purple-600 to-blue-600 rounded-full"></div>
              <h1 className="text-3xl font-bold text-gray-900">Lumino KPI Dashboard</h1>
            </div>
            <button
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-shadow flex items-center gap-2 download-button no-export"
              onClick={downloadDashboard}
            >
              <Download className="w-4 h-4" />
              Preuzmi SVG
            </button>
          </div>
          <div className="ml-16 mt-2 flex items-center gap-2">
            <span className="text-gray-600">Mesec →</span>
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold">
              {selectedMonth}
            </div>
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  <th className="p-4 text-left font-semibold text-sm border-r border-purple-500/30">Mesec</th>
                  <th className="p-4 text-left font-semibold text-sm border-r border-purple-500/30 min-w-[140px]"></th>
                  {days.map((day, idx) => (
                    <th key={day} colSpan={day !== 'Subota' ? 2 : 1} className={`p-4 text-center font-semibold text-sm ${idx < days.length - 1 ? 'border-r border-purple-500/30' : ''}`}>
                      <div>{day}</div>
                    </th>
                  ))}
                  <th className="p-4 text-center font-semibold text-sm">UKUPNO</th>
                </tr>
                <tr className="bg-purple-100 text-purple-900">
                  <th className="p-2 border-r border-gray-200"></th>
                  <th className="p-2 border-r border-gray-200"></th>
                  {days.flatMap((day, idx) => {
                    if (day !== 'Subota') {
                      return [
                        <th key={`${day}-location`} className="p-2 text-xs font-medium border-r border-gray-200"></th>,
                        <th key={`${day}-points`} className={`p-2 text-xs font-medium bg-purple-200/50 ${idx < days.length - 1 ? 'border-r border-gray-200' : ''}`}>Bodovi</th>
                      ];
                    } else {
                      return [
                        <th key={day} className={`p-2 text-xs font-medium ${idx < days.length - 1 ? 'border-r border-gray-200' : ''}`}></th>
                      ];
                    }
                  })}
                  <th className="p-2 text-xs font-medium bg-purple-200/50"></th>
                </tr>
              </thead>
              <tbody>
                {weeks.flatMap((week) => [
                  // Tim Panonija Row
                  <tr key={`${week.id}-panonija`} className="border-b-2 border-teal-300 bg-gradient-to-r from-teal-50 via-cyan-50 to-teal-50 hover:from-teal-100 hover:via-cyan-100 hover:to-teal-100 transition-all border-l-8 border-l-teal-500 shadow-sm">
                    <td rowSpan={2} className="p-4 border-r border-gray-200 align-top bg-white">
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold mb-2">
                        {week.label}
                      </div>
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-gray-500" />
                          <input
                            type="date"
                            value={week.startDate}
                            onChange={(e) => updateWeekStartDate(week.id, e.target.value)}
                            className="text-xs text-gray-600 bg-white border border-gray-300 rounded px-2 py-1 focus:border-purple-600 outline-none w-full"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-gray-500" />
                          <input
                            type="date"
                            value={week.endDate}
                            onChange={(e) => updateWeekEndDate(week.id, e.target.value)}
                            className="text-xs text-gray-600 bg-white border border-gray-300 rounded px-2 py-1 focus:border-purple-600 outline-none w-full"
                          />
                        </div>
                        <div className="text-xs text-gray-500 text-center">
                          {formatDateDisplay(week.startDate)} - {formatDateDisplay(week.endDate)}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 border-r border-gray-200 bg-gradient-to-r from-teal-100 to-cyan-100">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-8 bg-gradient-to-b from-teal-500 to-cyan-600 rounded-full shadow-md"></div>
                        <span className="text-sm font-bold text-teal-900">Tim: Panonija</span>
                      </div>
                    </td>
                    {days.flatMap((day, dayIdx) => {
                      const data = getTeamData('panonija', week.id, day);
                      if (day !== 'Subota') {
                        return [
                          <td key={`${day}-location`} className="border-r border-teal-200 p-2 bg-white/50 min-w-[180px]">
                            <div className="text-xs text-gray-400 text-center mb-1">{getWeekDayDate(week, days.indexOf(day))}</div>
                            <div className="space-y-2">
                              <div className="flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-1" />
                                <input
                                  type="text"
                                  value={data.location}
                                  onChange={(e) => updateTeamData('panonija', week.id, day, 'location', e.target.value)}
                                  className="text-xs text-gray-700 bg-transparent border-b border-teal-200 focus:border-teal-600 outline-none w-full"
                                  placeholder="Mesto"
                                />
                              </div>
                              <div className="flex items-start gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0 mt-1" />
                                <input
                                  type="text"
                                  value={data.power}
                                  onChange={(e) => updateTeamData('panonija', week.id, day, 'power', e.target.value)}
                                  className="text-xs text-gray-700 bg-transparent border-b border-teal-200 focus:border-cyan-600 outline-none w-full"
                                  placeholder="Snaga"
                                />
                              </div>
                            </div>
                          </td>,
                          <td key={`${day}-points`} className={`bg-gradient-to-br from-teal-100 to-cyan-100 p-2 w-16 ${dayIdx < days.length - 1 ? 'border-r border-teal-200' : ''}`}>
                            <input
                              type="number"
                              step="0.5"
                              value={data.points}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value)) {
                                  updateTeamData('panonija', week.id, day, 'points', Math.round(value * 100) / 100 + '');
                                } else {
                                  updateTeamData('panonija', week.id, day, 'points', e.target.value);
                                }
                              }}
                              className="w-full text-center font-bold text-teal-800 bg-white border-2 border-teal-300 rounded-lg px-1 py-1 focus:border-teal-600 focus:ring-2 focus:ring-teal-200 outline-none text-sm"
                              placeholder="0"
                            />
                          </td>
                        ];
                      } else {
                        return [
                          <td key={day} className={`p-2 bg-white/50 min-w-[180px] ${dayIdx < days.length - 1 ? 'border-r border-teal-200' : ''}`}>
                            <div className="space-y-2">
                              <div className="flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-1" />
                                <input
                                  type="text"
                                  value={data.location}
                                  onChange={(e) => updateTeamData('panonija', week.id, day, 'location', e.target.value)}
                                  className="text-xs text-gray-700 bg-transparent border-b border-teal-200 focus:border-teal-600 outline-none w-full"
                                  placeholder="Mesto"
                                />
                              </div>
                              <div className="flex items-start gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0 mt-1" />
                                <input
                                  type="text"
                                  value={data.power}
                                  onChange={(e) => updateTeamData('panonija', week.id, day, 'power', e.target.value)}
                                  className="text-xs text-gray-700 bg-transparent border-b border-teal-200 focus:border-cyan-600 outline-none w-full"
                                  placeholder="Snaga"
                                />
                              </div>
                            </div>
                          </td>
                        ];
                      }
                    })}
                    <td className="bg-gradient-to-br from-teal-100 to-cyan-100"></td>
                  </tr>,
                  // Tim Sumadija Row
                  <tr key={`${week.id}-sumadija`} className="border-b-2 border-orange-300 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 hover:from-orange-100 hover:via-amber-100 hover:to-orange-100 transition-all border-l-8 border-l-orange-500 shadow-sm">
                    <td className="p-4 border-r border-gray-200 bg-gradient-to-r from-orange-100 to-amber-100">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-8 bg-gradient-to-b from-orange-500 to-amber-600 rounded-full shadow-md"></div>
                        <span className="text-sm font-bold text-orange-900">Tim: Šumadija</span>
                      </div>
                    </td>
                    {days.flatMap((day, dayIdx) => {
                      const data = getTeamData('sumadija', week.id, day);
                      if (day !== 'Subota') {
                        return [
                          <td key={`${day}-location`} className="border-r border-orange-200 p-2 bg-white/50 min-w-[180px]">
                            <div className="text-xs text-gray-400 text-center mb-1">{getWeekDayDate(week, days.indexOf(day))}</div>
                            <div className="space-y-2">
                              <div className="flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-orange-600 flex-shrink-0 mt-1" />
                                <input
                                  type="text"
                                  value={data.location}
                                  onChange={(e) => updateTeamData('sumadija', week.id, day, 'location', e.target.value)}
                                  className="text-xs text-gray-700 bg-transparent border-b border-orange-200 focus:border-orange-600 outline-none w-full"
                                  placeholder="Mesto"
                                />
                              </div>
                              <div className="flex items-start gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-1" />
                                <input
                                  type="text"
                                  value={data.power}
                                  onChange={(e) => updateTeamData('sumadija', week.id, day, 'power', e.target.value)}
                                  className="text-xs text-gray-700 bg-transparent border-b border-orange-200 focus:border-amber-600 outline-none w-full"
                                  placeholder="Snaga"
                                />
                              </div>
                            </div>
                          </td>,
                          <td key={`${day}-points`} className={`bg-gradient-to-br from-orange-100 to-amber-100 p-2 w-16 ${dayIdx < days.length - 1 ? 'border-r border-orange-200' : ''}`}>
                            <input
                              type="number"
                              step="0.5"
                              value={data.points}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value)) {
                                  updateTeamData('sumadija', week.id, day, 'points', Math.round(value * 100) / 100 + '');
                                } else {
                                  updateTeamData('sumadija', week.id, day, 'points', e.target.value);
                                }
                              }}
                              className="w-full text-center font-bold text-orange-800 bg-white border-2 border-orange-300 rounded-lg px-1 py-1 focus:border-orange-600 focus:ring-2 focus:ring-orange-200 outline-none text-sm"
                              placeholder="0"
                            />
                          </td>
                        ];
                      } else {
                        return [
                          <td key={day} className={`p-2 bg-white/50 min-w-[180px] ${dayIdx < days.length - 1 ? 'border-r border-orange-200' : ''}`}>
                            <div className="space-y-2">
                              <div className="flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-orange-600 flex-shrink-0 mt-1" />
                                <input
                                  type="text"
                                  value={data.location}
                                  onChange={(e) => updateTeamData('sumadija', week.id, day, 'location', e.target.value)}
                                  className="text-xs text-gray-700 bg-transparent border-b border-orange-200 focus:border-orange-600 outline-none w-full"
                                  placeholder="Mesto"
                                />
                              </div>
                              <div className="flex items-start gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-1" />
                                <input
                                  type="text"
                                  value={data.power}
                                  onChange={(e) => updateTeamData('sumadija', week.id, day, 'power', e.target.value)}
                                  className="text-xs text-gray-700 bg-transparent border-b border-orange-200 focus:border-amber-600 outline-none w-full"
                                  placeholder="Snaga"
                                />
                              </div>
                            </div>
                          </td>
                        ];
                      }
                    })}
                    <td className="bg-gradient-to-br from-orange-100 to-amber-100"></td>
                  </tr>
                ])}
                {/* Ukupno Rows */}
                <tr className="bg-gradient-to-r from-purple-100 to-blue-100 font-semibold">
                  <td className="p-4 border-r border-gray-200">Ukupno:</td>
                  <td className="p-4 border-r border-gray-200">Tim: Panonija</td>
                  {days.flatMap((day, idx) => {
                    if (day !== 'Subota') {
                      return [
                        <td key={`${day}-total-loc`} className="border-r border-gray-200"></td>,
                        <td key={`${day}-total-pts`} className={`bg-purple-200/50 text-center text-purple-900 ${idx < days.length - 1 ? 'border-r border-gray-200' : ''}`}>
                          {Object.values(panonijaData).reduce((sum, weekData) => {
                            const points = parseFloat(weekData[day]?.points || '0');
                            return sum + (isNaN(points) ? 0 : points);
                          }, 0).toFixed(1)}
                        </td>
                      ];
                    } else {
                      return [<td key={day} className={idx < days.length - 1 ? 'border-r border-gray-200' : ''}></td>];
                    }
                  })}
                  <td className="bg-purple-200/50 text-center text-purple-900 font-bold text-lg">{panonijaTotal.toFixed(1)}</td>
                </tr>
                <tr className="bg-gradient-to-r from-purple-100 to-blue-100 font-semibold">
                  <td className="p-4 border-r border-gray-200"></td>
                  <td className="p-4 border-r border-gray-200">Tim: Šumadija</td>
                  {days.flatMap((day, idx) => {
                    if (day !== 'Subota') {
                      return [
                        <td key={`${day}-total-loc-2`} className="border-r border-gray-200"></td>,
                        <td key={`${day}-total-pts-2`} className={`bg-purple-200/50 text-center text-purple-900 ${idx < days.length - 1 ? 'border-r border-gray-200' : ''}`}>
                          {Object.values(sumadijaData).reduce((sum, weekData) => {
                            const points = parseFloat(weekData[day]?.points || '0');
                            return sum + (isNaN(points) ? 0 : points);
                          }, 0).toFixed(1)}
                        </td>
                      ];
                    } else {
                      return [<td key={`${day}-2`} className={idx < days.length - 1 ? 'border-r border-gray-200' : ''}></td>];
                    }
                  })}
                  <td className="bg-purple-200/50 text-center text-purple-900 font-bold text-lg">{sumadijaTotal.toFixed(1)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Skala bodova */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-purple-600 rounded-full"></div>
              Skala bodova
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">0 - 10 kW</span>
                <span className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 text-white font-bold rounded-lg shadow-sm">0.5</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">10 - 25 kW</span>
                <span className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold rounded-lg shadow-sm">1</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">25 - 50 kW</span>
                <span className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-700 to-blue-700 text-white font-bold rounded-lg shadow-sm">1.5</span>
              </div>
            </div>
          </div>

          {/* Mesečni rezultat - Tim Panonija */}
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-600 p-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Mesečni rezultat
              </h3>
              <p className="text-teal-50 text-sm mt-1">Tim: Panonija</p>
            </div>
            
            <div className="p-6">
              {/* Main Score Display */}
              <div className="relative mb-6">
                <div className="flex items-center justify-center">
                  <div className="relative">
                    {/* Circular Progress Background */}
                    <svg className="w-40 h-40 -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="#e0f2f1"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke={panonijaResult.color === 'green' ? '#10b981' : panonijaResult.color === 'yellow' ? '#f59e0b' : '#ef4444'}
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${(panonijaTotal / 15) * 439.6} 439.6`}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </svg>
                    
                    {/* Center Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      {panonijaResult.color === 'green' && <Award className="w-10 h-10 text-green-500 mb-1" />}
                      {panonijaResult.color === 'yellow' && <AlertCircle className="w-10 h-10 text-yellow-500 mb-1" />}
                      {panonijaResult.color === 'red' && <AlertCircle className="w-10 h-10 text-red-500 mb-1" />}
                      <div className="text-3xl font-bold text-gray-900">{panonijaTotal.toFixed(1)}</div>
                      <div className="text-xs text-gray-500 font-medium">bodova</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className={`text-center p-4 rounded-xl mb-4 ${
                panonijaResult.color === 'green' ? 'bg-green-100 border-2 border-green-400' :
                panonijaResult.color === 'yellow' ? 'bg-yellow-100 border-2 border-yellow-400' :
                'bg-red-100 border-2 border-red-400'
              }`}>
                <div className="flex items-center justify-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    panonijaResult.color === 'green' ? 'bg-green-500 animate-pulse' :
                    panonijaResult.color === 'yellow' ? 'bg-yellow-500 animate-pulse' :
                    'bg-red-500 animate-pulse'
                  }`}></div>
                  <span className={`font-bold text-sm uppercase tracking-wide ${
                    panonijaResult.color === 'green' ? 'text-green-700' :
                    panonijaResult.color === 'yellow' ? 'text-yellow-700' :
                    'text-red-700'
                  }`}>
                    {panonijaResult.color === 'green' ? 'Odličan rezultat' : 
                     panonijaResult.color === 'yellow' ? 'Dobar rezultat' : 
                     'Potrebno poboljšanje'}
                  </span>
                </div>
              </div>

              {/* Performance Ranges */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-xs font-medium text-gray-700">0 - 10</span>
                  </div>
                  <span className="text-xs text-gray-500">Crveno</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span className="text-xs font-medium text-gray-700">10 - 12</span>
                  </div>
                  <span className="text-xs text-gray-500">Žuto</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs font-medium text-gray-700">12+</span>
                  </div>
                  <span className="text-xs text-gray-500">Zeleno</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mesečni rezultat - Tim Sumadija */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Mesečni rezultat
              </h3>
              <p className="text-orange-50 text-sm mt-1">Tim: Šumadija</p>
            </div>
            
            <div className="p-6">
              {/* Main Score Display */}
              <div className="relative mb-6">
                <div className="flex items-center justify-center">
                  <div className="relative">
                    {/* Circular Progress Background */}
                    <svg className="w-40 h-40 -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="#fff7ed"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke={sumadijaResult.color === 'green' ? '#10b981' : sumadijaResult.color === 'yellow' ? '#f59e0b' : '#ef4444'}
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${(sumadijaTotal / 15) * 439.6} 439.6`}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                    </svg>
                    
                    {/* Center Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      {sumadijaResult.color === 'green' && <Award className="w-10 h-10 text-green-500 mb-1" />}
                      {sumadijaResult.color === 'yellow' && <AlertCircle className="w-10 h-10 text-yellow-500 mb-1" />}
                      {sumadijaResult.color === 'red' && <AlertCircle className="w-10 h-10 text-red-500 mb-1" />}
                      <div className="text-3xl font-bold text-gray-900">{sumadijaTotal.toFixed(1)}</div>
                      <div className="text-xs text-gray-500 font-medium">bodova</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className={`text-center p-4 rounded-xl mb-4 ${
                sumadijaResult.color === 'green' ? 'bg-green-100 border-2 border-green-400' :
                sumadijaResult.color === 'yellow' ? 'bg-yellow-100 border-2 border-yellow-400' :
                'bg-red-100 border-2 border-red-400'
              }`}>
                <div className="flex items-center justify-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    sumadijaResult.color === 'green' ? 'bg-green-500 animate-pulse' :
                    sumadijaResult.color === 'yellow' ? 'bg-yellow-500 animate-pulse' :
                    'bg-red-500 animate-pulse'
                  }`}></div>
                  <span className={`font-bold text-sm uppercase tracking-wide ${
                    sumadijaResult.color === 'green' ? 'text-green-700' :
                    sumadijaResult.color === 'yellow' ? 'text-yellow-700' :
                    'text-red-700'
                  }`}>
                    {sumadijaResult.color === 'green' ? 'Odličan rezultat' : 
                     sumadijaResult.color === 'yellow' ? 'Dobar rezultat' : 
                     'Potrebno poboljšanje'}
                  </span>
                </div>
              </div>

              {/* Performance Ranges */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-xs font-medium text-gray-700">0 - 10</span>
                  </div>
                  <span className="text-xs text-gray-500">Crveno</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span className="text-xs font-medium text-gray-700">10 - 12</span>
                  </div>
                  <span className="text-xs text-gray-500">Žuto</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs font-medium text-gray-700">12+</span>
                  </div>
                  <span className="text-xs text-gray-500">Zeleno</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}