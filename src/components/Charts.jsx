import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { useTask } from '../context/TaskContext';
import { getLast7Days, getCompletedPerDay, computeStats } from '../utils/helpers';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend, Filler
);

const CHART_COLORS = {
  primary:   'rgba(99, 102, 241, 0.9)',
  primaryBg: 'rgba(99, 102, 241, 0.18)',
  violet:    'rgba(139, 92, 246, 0.9)',
  violetBg:  'rgba(139, 92, 246, 0.12)',
  cyan:      'rgba(6, 182, 212, 0.9)',
  emerald:   'rgba(16, 185, 129, 0.9)',
  amber:     'rgba(245, 158, 11, 0.9)',
  rose:      'rgba(244, 63, 94, 0.9)',
};

const baseOptions = () => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(10, 8, 30, 0.92)',
      titleColor: '#e2e8f0',
      bodyColor: '#94a3b8',
      borderColor: 'rgba(99,102,241,0.35)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 12,
      titleFont: { weight: '700' },
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(148,163,184,0.08)', drawBorder: false },
      ticks: { color: '#94a3b8', font: { size: 12 } },
    },
    y: {
      grid: { color: 'rgba(148,163,184,0.08)', drawBorder: false },
      ticks: { color: '#94a3b8', stepSize: 1, font: { size: 12 } },
      beginAtZero: true,
    },
  },
});

export function DailyChart() {
  const { tasks } = useTask();
  const labels = getLast7Days();
  const data = getCompletedPerDay(tasks);

  return (
    <div className="glass-card" style={{ padding: '1.75rem', height: '360px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontWeight: '700', fontSize: '1rem', color: 'inherit', letterSpacing: '-0.01em' }}>
          Tasks Completed
        </h3>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>Last 7 days</p>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Bar
          data={{
            labels,
            datasets: [{
              data,
              backgroundColor: data.map(() => CHART_COLORS.primaryBg),
              borderColor: data.map(() => CHART_COLORS.primary),
              borderWidth: 2,
              borderRadius: 10,
              borderSkipped: false,
              hoverBackgroundColor: CHART_COLORS.primary,
            }],
          }}
          options={baseOptions()}
        />
      </div>
    </div>
  );
}

export function WeeklyChart() {
  const { tasks } = useTask();
  const labels = getLast7Days();
  const data = getCompletedPerDay(tasks);
  const running = data.reduce((acc, val, i) => { acc.push((acc[i - 1] || 0) + val); return acc; }, []);

  return (
    <div className="glass-card" style={{ padding: '1.75rem', height: '360px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontWeight: '700', fontSize: '1rem', color: 'inherit', letterSpacing: '-0.01em' }}>
          Productivity Trend
        </h3>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>Cumulative completions</p>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Line
          data={{
            labels,
            datasets: [{
              data: running,
              borderColor: CHART_COLORS.violet,
              backgroundColor: CHART_COLORS.violetBg,
              borderWidth: 3,
              pointBackgroundColor: '#fff',
              pointBorderColor: CHART_COLORS.violet,
              pointBorderWidth: 2.5,
              pointRadius: 5,
              pointHoverRadius: 8,
              fill: true,
              tension: 0.42,
            }],
          }}
          options={baseOptions()}
        />
      </div>
    </div>
  );
}

export function CategoryChart() {
  const { tasks, categories } = useTask();
  const counts = categories.map(cat => tasks.filter(t => t.category === cat && !t.archived).length);
  const COLORS = [
    CHART_COLORS.primary, CHART_COLORS.violet, CHART_COLORS.cyan,
    CHART_COLORS.emerald, CHART_COLORS.amber, CHART_COLORS.rose,
  ];
  const hasData = counts.some(c => c > 0);

  return (
    <div className="glass-card" style={{ padding: '1.75rem', height: '400px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontWeight: '700', fontSize: '1rem', color: 'inherit', letterSpacing: '-0.01em' }}>
          Category Distribution
        </h3>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>Tasks by category</p>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {hasData ? (
          <div style={{ width: '100%', height: '100%', maxWidth: '420px', margin: '0 auto' }}>
            <Doughnut
              data={{
                labels: categories,
                datasets: [{
                  data: counts,
                  backgroundColor: COLORS,
                  borderColor: 'rgba(0,0,0,0.08)',
                  borderWidth: 3,
                  hoverOffset: 12,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: '#94a3b8',
                      padding: 16,
                      font: { size: 13 },
                      usePointStyle: true,
                      pointStyleWidth: 10,
                    },
                  },
                  tooltip: {
                    backgroundColor: 'rgba(10,8,30,0.92)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#94a3b8',
                    padding: 12,
                    cornerRadius: 12,
                    borderColor: 'rgba(99,102,241,0.35)',
                    borderWidth: 1,
                  },
                },
                cutout: '62%',
              }}
            />
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#94a3b8' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.75rem' }}>📊</span>
            <p style={{ fontWeight: '600' }}>No categorized tasks yet</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Add tasks with categories to see the breakdown</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default { DailyChart, WeeklyChart, CategoryChart };
