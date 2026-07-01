import { useState } from 'react';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { RiAddLine, RiCalendarCheckLine } from 'react-icons/ri';
import { useTask } from '../context/TaskContext';
import TaskCard from './TaskCard';
import TaskForm from './TaskForm';
import { formatDate } from '../utils/helpers';

export default function CalendarView() {
  const { tasks } = useTask();
  const [selected, setSelected] = useState(new Date());
  const [showForm, setShowForm] = useState(false);

  const selectedStr = format(selected, 'yyyy-MM-dd');
  const dayTasks = tasks.filter(t => t.dueDate === selectedStr && !t.archived);

  const getTileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const ds = format(date, 'yyyy-MM-dd');
    const count = tasks.filter(t => t.dueDate === ds && !t.archived).length;
    if (!count) return null;
    return (
      <div className="flex justify-center mt-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 inline-block" />
      </div>
    );
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Calendar */}
      <div className="lg:col-span-3 glass-card p-5">
        <ReactCalendar
          onChange={setSelected}
          value={selected}
          tileContent={getTileContent}
          className="w-full border-0 dark:text-white"
        />
      </div>

      {/* Day tasks */}
      <div className="lg:col-span-2 glass-card p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <RiCalendarCheckLine className="text-primary-500" />
              {formatDate(selectedStr)}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-1.5 text-sm px-3 py-2"
          >
            <RiAddLine /> Add
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto max-h-[60vh] pr-1">
          <AnimatePresence>
            {dayTasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-slate-400"
              >
                <span className="text-4xl mb-2">📅</span>
                <p className="text-sm">No tasks for this day</p>
                <p className="text-xs mt-1">Click "Add" to create one</p>
              </motion.div>
            ) : dayTasks.map(t => (
              <TaskCard key={t.id} task={t} onEdit={() => {}} />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Task form modal */}
      <AnimatePresence>
        {showForm && (
          <TaskForm
            defaultDate={selectedStr}
            onClose={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
