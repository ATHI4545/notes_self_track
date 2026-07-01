import { useState, useEffect, useRef } from 'react';
import { RiSearchLine, RiFilterLine, RiSortAsc, RiCloseLine } from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';

const FILTERS = [
  { key: 'all',       label: 'All'            },
  { key: 'completed', label: 'Completed'      },
  { key: 'pending',   label: 'Pending'        },
  { key: 'today',     label: "Today's"        },
  { key: 'upcoming',  label: 'Upcoming'       },
  { key: 'high',      label: 'High Priority'  },
  { key: 'medium',    label: 'Medium Priority'},
  { key: 'low',       label: 'Low Priority'   },
];

const SORTS = [
  { key: 'latest',  label: 'Latest First'  },
  { key: 'oldest',  label: 'Oldest First'  },
  { key: 'alpha',   label: 'Alphabetical'  },
  { key: 'dueDate', label: 'Due Date'      },
];

export default function SearchBar({ filter, onFilter, sort, onSort, search, onSearch, categories }) {
  const [showSort, setShowSort] = useState(false);
  const [catFilter, setCatFilter] = useState('');
  const sortRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setShowSort(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCatFilter = (cat) => {
    const key = `cat:${cat}`;
    if (filter === key) { onFilter('all'); setCatFilter(''); }
    else { onFilter(key); setCatFilter(cat); }
  };

  return (
    <div className="searchbar-wrapper">
      {/* Search input */}
      <div className="searchbar-input-wrap">
        <RiSearchLine className="searchbar-input-icon" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={e => onSearch(e.target.value)}
          className="searchbar-input"
          id="task-search"
        />
        {search && (
          <button onClick={() => onSearch('')} className="searchbar-clear">
            <RiCloseLine />
          </button>
        )}
      </div>

      {/* Filters + Sort row */}
      <div className="searchbar-filters-row">
        <RiFilterLine className="searchbar-filter-icon" />

        <div className="searchbar-chips">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => { onFilter(f.key); setCatFilter(''); }}
              className={`filter-chip ${filter === f.key ? 'filter-chip-active' : ''}`}
            >
              {f.label}
            </button>
          ))}
          {categories && categories.map(cat => (
            <button
              key={cat}
              onClick={() => handleCatFilter(cat)}
              className={`filter-chip ${catFilter === cat ? 'filter-chip-active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <div className="searchbar-sort-wrap" ref={sortRef}>
          <button
            onClick={() => setShowSort(v => !v)}
            className="filter-chip"
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
          >
            <RiSortAsc />
            {SORTS.find(s => s.key === sort)?.label || 'Sort'}
          </button>
          <AnimatePresence>
            {showSort && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="glass-card searchbar-sort-menu"
              >
                {SORTS.map(s => (
                  <button
                    key={s.key}
                    onClick={() => { onSort(s.key); setShowSort(false); }}
                    className={`searchbar-sort-item ${sort === s.key ? 'searchbar-sort-item-active' : ''}`}
                  >
                    {s.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
