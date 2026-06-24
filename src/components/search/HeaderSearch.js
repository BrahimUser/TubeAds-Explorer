import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProductSearch } from '../../hooks/useProductSearch';
import { Icon } from '../Icons';
import SearchDropdown from './SearchDropdown';

export default function HeaderSearch({ onOpenListing, className = '' }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const listboxId = useId();

  const { items, isLoading, error, debouncedQuery, enabled, refetch } = useProductSearch(query);

  const showDropdown = open && enabled;

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    closeDropdown();
  }, [closeDropdown]);

  const selectItem = useCallback(
    (item) => {
      if (!item?.id) return;
      onOpenListing?.(item.id);
      clearSearch();
      inputRef.current?.blur();
    },
    [clearSearch, onOpenListing],
  );

  useEffect(() => {
    function onDocMouseDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        closeDropdown();
      }
    }
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [closeDropdown]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [debouncedQuery, items.length]);

  function handleKeyDown(e) {
    if (!showDropdown && e.key !== 'Escape') return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeDropdown();
      return;
    }

    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const target = activeIndex >= 0 ? items[activeIndex] : items[0];
      if (target) selectItem(target);
    }
  }

  const activeDescendant =
    activeIndex >= 0 && items[activeIndex]
      ? `${listboxId}-option-${activeIndex}`
      : undefined;

  return (
    <div ref={wrapRef} className={`relative min-w-0 flex-1 ${className}`.trim()}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (items.length) {
            const target = activeIndex >= 0 ? items[activeIndex] : items[0];
            if (target) selectItem(target);
          }
        }}
      >
        <label className="mx-auto flex h-11 w-full max-w-2xl items-center gap-2 rounded-full border border-slate-200 bg-white px-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)] lg:mx-0 lg:max-w-none">
          <Icon name="search" className="h-5 w-5 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              const next = e.target.value;
              setQuery(next);
              setOpen(next.trim().length >= 3);
            }}
            onFocus={() => {
              if (query.trim().length >= 3) setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={t('navbar.searchPlaceholder')}
            aria-label={t('navbar.search')}
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls={showDropdown ? listboxId : undefined}
            aria-activedescendant={showDropdown ? activeDescendant : undefined}
            aria-autocomplete="list"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={clearSearch}
              aria-label={t('navbar.searchDropdown.clear')}
              className="shrink-0 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <Icon name="close" className="h-4 w-4" />
            </button>
          ) : null}
        </label>
      </form>

      <SearchDropdown
        open={showDropdown}
        query={debouncedQuery}
        items={items}
        isLoading={isLoading}
        error={error}
        activeIndex={activeIndex}
        listboxId={listboxId}
        onSelect={selectItem}
        onRetry={refetch}
      />
    </div>
  );
}
