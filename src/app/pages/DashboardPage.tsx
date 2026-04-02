import { useParams } from 'react-router';
import { KPIDashboard } from '../components/KPIDashboard';

const months = [
  'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
  'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
];

// ISO 8601 - vraca ISO broj nedelje za dati datum
const getISOWeek = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Pomeri na cetvrtak iste nedelje (ISO: nedelja pocinje ponedeljkom)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

// Vraca ponedeljak za datu nedelju koja sadrzi cetrvrtak te nedelje
const getMondayOfISOWeek = (isoWeek: number, isoYear: number): Date => {
  // 4. januar je uvek u prvoj ISO nedelji
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const jan4DayOfWeek = jan4.getUTCDay() || 7; // 1=Mon, 7=Sun
  // Ponedeljak prve ISO nedelje
  const firstMonday = new Date(jan4);
  firstMonday.setUTCDate(jan4.getUTCDate() - (jan4DayOfWeek - 1));
  // Dodaj (isoWeek - 1) * 7 dana
  const result = new Date(firstMonday);
  result.setUTCDate(firstMonday.getUTCDate() + (isoWeek - 1) * 7);
  return result;
};

// ISO godina za dati datum (moze biti razlicita od kalendarske)
const getISOYear = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  return d.getUTCFullYear();
};

// Vraca sve ISO nedelje koje pripadaju datom mesecu
// Nedelja pripada mesecu ako ima VISE OD 3 dana (>=4) u tom mesecu
export const getWeeksInMonth = (year: number, month: number) => {
  const weeks = [];
  
  // Prodjemo kroz sve dane meseca i skupimo unique ISO nedelje
  const daysInMonth = new Date(year, month, 0).getDate();
  const seenWeeks = new Set<string>();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const isoWeek = getISOWeek(date);
    const isoYear = getISOYear(date);
    const key = `${isoYear}-${isoWeek}`;
    
    if (!seenWeeks.has(key)) {
      seenWeeks.add(key);
      
      // Izracunaj ponedeljak i nedeljу te ISO nedelje
      const monday = getMondayOfISOWeek(isoWeek, isoYear);
      const sunday = new Date(monday);
      sunday.setUTCDate(monday.getUTCDate() + 6);
      
      // Broji koliko dana te nedelje pada u ovaj mesec
      let daysInThisMonth = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setUTCDate(monday.getUTCDate() + i);
        if (d.getUTCMonth() + 1 === month && d.getUTCFullYear() === year) {
          daysInThisMonth++;
        }
      }
      
      // Nedelja pripada mesecu samo ako ima vise od 3 dana u njemu
      if (daysInThisMonth >= 4) {
        const label = `CW${isoWeek.toString().padStart(2, '0')}`;
        weeks.push({
          id: label,
          label,
          startDate: monday.toISOString().split('T')[0],
          endDate: sunday.toISOString().split('T')[0],
        });
      }
    }
  }
  
  return weeks;
};

export default function DashboardPage() {
  const { year, month } = useParams<{ year: string; month: string }>();
  
  const yearNum = parseInt(year || '2026');
  const monthNum = parseInt(month || '1');
  const monthName = months[monthNum - 1];
  
  const weeks = getWeeksInMonth(yearNum, monthNum);

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      <KPIDashboard 
        initialMonth={monthName} 
        initialWeeks={weeks}
        year={yearNum}
        month={monthNum}
      />
    </div>
  );
}
