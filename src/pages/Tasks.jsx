import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { RiAddLine, RiInboxLine, RiArchiveLine } from 'react-icons/ri';
import { useTask } from '../context/TaskContext';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import SearchBar from '../components/SearchBar';
import { isOverdue, isTodayTask, isUpcomingTask } from '../utils/helpers';
import { parseISO } from 'date-fns';

function applyFilter(tasks, filter, search) {
  let out = tasks.filter(t => !t.archived);
  if (search) out = out.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || (t.description || '').toLowerCase().includes(search.toLowerCase()));
  if (filter === 'completed') return out.filter(t => t.completed);
  if (filter === 'pending')   return out.filter(t => !t.completed);
  if (filter === 'today')     return out.filter(isTodayTask);
  if (filter === 'upcoming')  return out.filter(isUpcomingTask);
  if (filter === 'high')      return out.filter(t => t.priority === 'High');
  if (filter === 'medium')    return out.filter(t => t.priority === 'Medium');
  if (filter === 'low')       return out.filter(t => t.priority === 'Low');
  if (filter.startsWith('cat:')) return out.filter(t => t.category === filter.slice(4));
  return out;
}

function applySort(tasks, sort) {
  const arr = [...tasks];
  if (sort === 'latest')  return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (sort === 'oldest')  return arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  if (sort === 'alpha')   return arr.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === 'dueDate') return arr.sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return parseISO(a.dueDate) - parseISO(b.dueDate);
  });
  return arr;
}

export default function Tasks() {
  const { tasks, reorderTasks, categories } = useTask();
  const [showForm, setShowForm]     = useState(false);
  const [editTask, setEditTask]     = useState(null);
  const [filter, setFilter]         = useState('all');
  const [sort, setSort]             = useState('latest');
  const [search, setSearch]         = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const visible  = useMemo(() => applySort(applyFilter(tasks, filter, search), sort), [tasks, filter, search, sort]);
  const archived = tasks.filter(t => t.archived);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const ids = visible.map(t => t.id);
    const [moved] = ids.splice(result.source.index, 1);
    ids.splice(result.destination.index, 0, moved);
    const idOrder = new Map(ids.map((id, i) => [id, i]));
    const reordered = [...tasks].sort((a, b) => {
      const ai = idOrder.has(a.id) ? idOrder.get(a.id) : Infinity;
      const bi = idOrder.has(b.id) ? idOrder.get(b.id) : Infinity;
      return ai - bi;
    });
    reorderTasks(reordered);
  };

  return (
    <div className="page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}
      >
        <div>
          <h1 className="tasks-page-title">
            My Tasks
          </h1>
          <span className="tasks-count-badge">
            {visible.length} task{visible.length !== 1 ? 's' : ''} found
          </span>
        </div>
        <button
          onClick={() => { setEditTask(null); setShowForm(true); }}
          className="btn-primary tasks-add-btn"
          id="tasks-add-btn"
        >
          <RiAddLine style={{ fontSize: '1.1rem' }} /> Add Task
        </button>
      </motion.div>

      {/* Search + Filter */}
      <SearchBar
        filter={filter} onFilter={setFilter}
        sort={sort}     onSort={setSort}
        search={search} onSearch={setSearch}
        categories={categories}
      />

      {/* Task list with DnD */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="tasks-list">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', minHeight: '4rem' }}
            >
              <AnimatePresence>
                {visible.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="glass-card tasks-empty-card"
                    style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}
                  >
                    <RiInboxLine style={{ fontSize: '3.5rem', marginBottom: '0.75rem', color: '#a5b4fc', display: 'block', margin: '0 auto 0.75rem' }} />
                    <p style={{ fontWeight: '700', fontSize: '1rem', color: '#6366f1' }}>No tasks found</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.35rem' }}>
                      {filter !== 'all' || search ? 'Try changing filters or search.' : 'Click "Add Task" to get started.'}
                    </p>
                  </motion.div>
                ) : visible.map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(prov, snapshot) => (
                      <div ref={prov.innerRef} {...prov.draggableProps}>
                        <TaskCard
                          task={task}
                          onEdit={(t) => { setEditTask(t); setShowForm(true); }}
                          dragHandleProps={prov.dragHandleProps}
                          isDragging={snapshot.isDragging}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
              </AnimatePresence>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Archived section */}
      {archived.length > 0 && (
        <div style={{ paddingTop: '1.25rem' }}>
          <hr className="tasks-section-divider" />
          <button
            onClick={() => setShowArchived(v => !v)}
            className="archive-toggle-btn"
            style={{ marginBottom: '0.75rem' }}
          >
            <RiArchiveLine />
            {showArchived ? 'Hide' : 'Show'} Archived Tasks ({archived.length})
          </button>
          <AnimatePresence>
            {showArchived && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
              >
                {archived.map(task => (
                  <TaskCard key={task.id} task={task} onEdit={(t) => { setEditTask(t); setShowForm(true); }} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Floating Add button — positioned LEFT of chatbot to avoid overlap */}
      <button
        onClick={() => { setEditTask(null); setShowForm(true); }}
        className="tasks-fab-btn btn-primary"
        id="tasks-fab"
        aria-label="Add new task"
      >
        <RiAddLine style={{ fontSize: '1.5rem' }} />
      </button>

      <style>{`
        .tasks-fab-btn {
          display: none;
          position: fixed;
          bottom: 1.75rem;
          right: 5.5rem; /* offset left so it doesn't overlap chatbot */
          width: 54px;
          height: 54px;
          border-radius: 50%;
          padding: 0;
          align-items: center;
          justify-content: center;
          z-index: 30;
        }
        @media (max-width: 1023px) {
          .tasks-fab-btn { display: flex; }
        }
        @media (max-width: 480px) {
          .tasks-fab-btn { right: 5rem; bottom: 1rem; }
        }
      `}</style>

      {/* Task form */}
      <AnimatePresence>
        {showForm && (
          <TaskForm
            editTask={editTask}
            onClose={() => { setShowForm(false); setEditTask(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
