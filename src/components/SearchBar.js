import { Icon } from './Icons';

export default function SearchBar({ value, onChange, onSubmit }) {
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className="mx-auto max-w-3xl"
    >
      <label className="flex items-center gap-3 rounded-full bg-white border border-slate-200 shadow-sm px-4 py-2.5 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-200 transition">
        <Icon name="search" className="w-5 h-5 text-slate-400 shrink-0" />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search ads…"
          aria-label="Search ads"
          className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-slate-400"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="text-slate-400 hover:text-slate-600 -mr-1"
          >
            <Icon name="close" className="w-4 h-4" />
          </button>
        ) : null}
      </label>
    </form>
  );
}
