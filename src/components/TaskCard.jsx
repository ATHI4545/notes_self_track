import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiCheckboxCircleLine, RiCheckboxBlankCircleLine, RiEdit2Line,
  RiDeleteBin6Line, RiFileCopyLine, RiArchiveLine, RiMoreLine,
  RiAlarmWarningLine, RiCalendarLine, RiTimeLine,
} from 'react-icons/ri';
import { useTask } from '../context/TaskContext';
import { formatDate, formatTime, getRelativeDueDate, getCategoryColor, isOverdue } from '../utils/helpers';

const DUE_COLORS = {
  'Today':    '#f59e0b',
  'Tomorrow': '#3b82f6',
  'Overdue':  '#ef4444',
};

export default function TaskCard({ task, onEdit, dragHandleProps = {}, isDragging = false }) {
  const { toggleComplete, deleteTask, duplicateTask, archiveTask } = useTask();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const overdue = isOverdue(task);
  const relDue = task.dueDate ? getRelativeDueDate(task.dueDate, task.dueTime) : null;

  const PRIORITY_COLORS = {
    High:   'badge-high',
    Medium: 'badge-medium',
    Low:    'badge-low',
  };

  const handleDelete = () => {
    if (confirmDelete) {
      deleteTask(task.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const dueLabelColor = relDue?.color || '#94a3b8';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, scale: 0.96 }}
      whileHover={!isDragging ? { y: -1 } : {}}
      className="glass-card"
      style={{
        padding: '1rem 1.125rem',
        opacity: task.completed ? 0.72 : 1,
        transform: isDragging ? 'rotate(1deg) scale(1.02)' : undefined,
        boxShadow: isDragging ? '0 16px 40px rgba(99,102,241,0.25)' : undefined,
        ...(overdue && !task.completed ? { borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(239,68,68,0.35)' } : {}),
        transition: 'all 0.2s ease',
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
        {/* Drag handle */}
        <div
          {...dragHandleProps}
          style={{
            flexShrink: 0, marginTop: '2px', cursor: 'grab', color: '#cbd5e1',
            fontSize: '1.1rem', userSelect: 'none', opacity: 0,
            transition: 'opacity 0.15s',
          }}
          className="drag-handle"
          title="Drag to reorder"
        >
          ⠿
        </div>

        {/* Complete toggle */}
        <button
          onClick={() => toggleComplete(task.id)}
          style={{
            flexShrink: 0, marginTop: '1px', background: 'none', border: 'none', cursor: 'pointer',
            padding: '0', fontSize: '1.375rem', lineHeight: 1, transition: 'all 0.2s',
            color: task.completed ? '#6366f1' : '#cbd5e1',
          }}
          onMouseEnter={e => { if (!task.completed) e.currentTarget.style.color = '#818cf8'; }}
          onMouseLeave={e => { if (!task.completed) e.currentTarget.style.color = '#cbd5e1'; }}
        >
          {task.completed ? <RiCheckboxCircleLine /> : <RiCheckboxBlankCircleLine />}
        </button>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
            {/* Title */}
            <h3 style={{
              fontWeight: '600', fontSize: '0.925rem', lineHeight: 1.4,
              textDecoration: task.completed ? 'line-through' : 'none',
              color: task.completed ? '#94a3b8' : 'inherit',
              flex: 1, minWidth: 0,
            }}>
              {task.title}
            </h3>

            {/* Action menu */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="action-btn"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', borderRadius: '6px',
                  width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#94a3b8', fontSize: '1.1rem', opacity: 0, transition: 'opacity 0.15s, background 0.15s',
                }}
              >
                <RiMoreLine />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="glass-card"
                      style={{
                        position: 'absolute', right: 0, top: '100%', marginTop: '4px',
                        width: '148px', padding: '0.375rem', zIndex: 20,
                      }}
                    >
                      {[
                        { icon: RiEdit2Line,    label: 'Edit',      action: () => { onEdit(task); setMenuOpen(false); } },
                        { icon: RiFileCopyLine, label: 'Duplicate', action: () => { duplicateTask(task.id); setMenuOpen(false); } },
                        { icon: RiArchiveLine,  label: task.archived ? 'Unarchive' : 'Archive', action: () => { archiveTask(task.id); setMenuOpen(false); } },
                      ].map(({ icon: Icon, label, action }) => (
                        <button key={label} onClick={action}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.5rem 0.625rem', borderRadius: '6px', border: 'none', background: 'none',
                            cursor: 'pointer', fontSize: '0.82rem', color: '#475569', transition: 'background 0.12s',
                            fontFamily: 'inherit',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                          <Icon style={{ fontSize: '1rem', color: '#94a3b8' }} /> {label}
                        </button>
                      ))}
                      <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.07)', margin: '0.25rem 0' }} />
                      <button
                        onClick={handleDelete}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
                          padding: '0.5rem 0.625rem', borderRadius: '6px', border: 'none',
                          cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit', transition: 'all 0.12s',
                          background: confirmDelete ? '#ef4444' : 'none',
                          color: confirmDelete ? '#fff' : '#ef4444',
                        }}
                      >
                        <RiDeleteBin6Line style={{ fontSize: '1rem' }} />
                        {confirmDelete ? 'Confirm Delete?' : 'Delete'}
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {task.description}
            </p>
          )}

          {/* Meta row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginTop: '0.625rem' }}>
            {task.priority && <span className={PRIORITY_COLORS[task.priority] || 'badge-low'}>{task.priority}</span>}

            {task.category && (
              <span style={{
                fontSize: '0.72rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '999px',
                background: 'rgba(99,102,241,0.1)', color: '#6366f1',
              }}>
                {task.category}
              </span>
            )}

            {task.dueDate && relDue && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: '600', color: dueLabelColor }}>
                <RiCalendarLine style={{ fontSize: '0.85rem' }} />
                {relDue.label}
              </span>
            )}

            {task.dueTime && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                <RiTimeLine style={{ fontSize: '0.85rem' }} />
                {formatTime(task.dueTime)}
              </span>
            )}

            {overdue && !task.completed && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#ef4444', fontWeight: '700', animation: 'blobPulse 1.5s ease-in-out infinite' }}>
                <RiAlarmWarningLine /> Overdue
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Show drag handle and action btn on hover */}
      <style>{`
        .glass-card:hover .drag-handle { opacity: 1 !important; }
        .glass-card:hover .action-btn  { opacity: 1 !important; }
        .action-btn:hover { background: rgba(0,0,0,0.06) !important; color: #475569 !important; }
      `}</style>
    </motion.div>
  );
}
