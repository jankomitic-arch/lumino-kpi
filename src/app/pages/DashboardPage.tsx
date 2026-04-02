import { useParams } from 'react-router';
import { KPIDashboard } from '../components/KPIDashboard';

const months = [
  'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
  'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
];

// Function to calculate ISO week number
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

// Function to get Monday of a given date
const getMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

// Function to get all weeks in a month
export const getWeeksInMonth = (year: number, month: number) => {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  
  const weeks = [];
  let currentMonday = getMonday(firstDay);
  
  while (currentMonday <= lastDay) {
    const weekEnd = new Date(currentMonday);
    weekEnd.setDate(weekEnd.getDate() + 6); // Saturday
    
    const weekNumber = getWeekNumber(currentMonday);
    const label = `CW${weekNumber.toString().padStart(2, '0')}`;
    
    const startDate = currentMonday.toISOString().split('T')[0];
    const endDate = weekEnd.toISOString().split('T')[0];
    
    weeks.push({
      id: label,
      label,
      startDate,
      endDate
    });
    
    // Move to next Monday
    currentMonday = new Date(currentMonday);
    currentMonday.setDate(currentMonday.getDate() + 7);
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
