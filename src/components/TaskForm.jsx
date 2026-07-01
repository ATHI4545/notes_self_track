import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiCloseLine, RiSaveLine, RiAddLine } from 'react-icons/ri';
import { useTask } from '../context/TaskContext';

const PRIORITIES = ['High', 'Medium', 'Low'];

const EMPTY = { title: '', description: '', category: '', priority: 'Medium', dueDate: '', dueTime: '' };

const labelStyle = { display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' };

export default function TaskForm({ editTask = null, onClose, defaultDate = '' }) {
  const { addTask, updateTask, categories, addCategory } = useTask();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [newCat, setNewCat] = useState('');
  const [showCatInput, setShowCatInput] = useState(false);

  useEffect(() => {
    if (editTask) {
      setForm({ title: editTask.title || '', description: editTask.description || '', category: editTask.category || '', priority: editTask.priority || 'Medium', dueDate: editTask.dueDate || '', dueTime: editTask.dueTime || '' });
    } else if (defaultDate) {
      setForm(prev => ({ ...prev, dueDate: defaultDate }));
    }
  }, [editTask, defaultDate]);

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Task title is required.';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (editTask) { updateTask(editTask.id, form); } else { addTask(form); }
    onClose();
  };

  const handleAddCategory = () => {
    if (newCat.trim()) {
      addCategory(newCat.trim());
      setForm(prev => ({ ...prev, category: newCat.trim() }));
      setNewCat('');
      setShowCatInput(false);
    }
  };

  const set = (key) => (e) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        className="glass-card"
        style={{ width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', letterSpacing: '-0.01em' }}>
            {editTask ? '✏️ Edit Task' : '✨ Add New Task'}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: '#64748b', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; e.currentTarget.style.color = '#64748b'; }}
          >
            <RiCloseLine />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>Task Title <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              id="task-title"
              type="text"
              placeholder="What needs to be done?"
              value={form.title}
              onChange={set('title')}
              className="input-field"
              style={errors.title ? { borderColor: '#ef4444', boxShadow: '0 0 0 3px rgba(239,68,68,0.12)' } : {}}
              autoFocus
            />
            {errors.title && <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.375rem' }}>{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              id="task-description"
              placeholder="Add details or notes..."
              value={form.description}
              onChange={set('description')}
              rows={3}
              className="input-field"
              style={{ resize: 'none' }}
            />
          </div>

          {/* Priority + Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div>
              <label style={labelStyle}>Priority</label>
              <select value={form.priority} onChange={set('priority')} className="input-field" id="task-priority">
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select value={form.category} onChange={set('category')} className="input-field" id="task-category">
                <option value="">No Category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Custom category */}
          <div>
            {showCatInput ? (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text" placeholder="New category name" value={newCat}
                  onChange={e => setNewCat(e.target.value)} className="input-field"
                  style={{ flex: 1, padding: '0.6rem 0.875rem' }}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                />
                <button type="button" onClick={handleAddCategory} className="btn-primary" style={{ padding: '0.6rem 0.875rem', fontSize: '0.8rem' }}>Add</button>
                <button type="button" onClick={() => setShowCatInput(false)} className="btn-secondary" style={{ padding: '0.6rem 0.875rem', fontSize: '0.8rem' }}>Cancel</button>
              </div>
            ) : (
              <button type="button" onClick={() => setShowCatInput(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontSize: '0.85rem', fontWeight: '600', padding: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <RiAddLine /> Add custom category
              </button>
            )}
          </div>

          {/* Due Date + Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div>
              <label style={labelStyle}>Due Date</label>
              <input type="date" value={form.dueDate} onChange={set('dueDate')} className="input-field" id="task-due-date" />
            </div>
            <div>
              <label style={labelStyle}>Due Time</label>
              <input type="time" value={form.dueTime} onChange={set('dueTime')} className="input-field" id="task-due-time" />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>
              <RiSaveLine /> {editTask ? 'Update Task' : 'Add Task'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
