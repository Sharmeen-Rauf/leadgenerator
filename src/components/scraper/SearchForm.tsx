import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '../ui/Button';

interface SearchFormProps {
  onSearch: (niche: string, location: string, limit: number) => void;
  loading: boolean;
}

export const SearchForm: React.FC<SearchFormProps> = ({ onSearch, loading }) => {
  const [niche, setNiche] = useState('');
  const [location, setLocation] = useState('');
  const [limit, setLimit] = useState(10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche || !location) return;
    onSearch(niche, location, limit);
  };

  return (
    <form onSubmit={handleSubmit} className="tactical-glass p-5 border-[#00D4FF]/15 space-y-4 select-none">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Niche input */}
        <div className="flex-1 relative font-mono">
          <label className="text-[9px] text-neutral-450 font-extrabold uppercase tracking-widest block mb-1">Target Niche / Industry</label>
          <input
            type="text"
            required
            className="bg-[#080C18]/90 border border-[#00D4FF]/20 rounded px-3 py-2.5 w-full text-xs outline-none focus:border-[#00D4FF] text-white font-semibold uppercase"
            placeholder="e.g. Dentists, Roofers, Gyms..."
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
          />
        </div>

        {/* Location input */}
        <div className="flex-1 relative font-mono">
          <label className="text-[9px] text-neutral-450 font-extrabold uppercase tracking-widest block mb-1">Target City / Region</label>
          <input
            type="text"
            required
            className="bg-[#080C18]/90 border border-[#00D4FF]/20 rounded px-3 py-2.5 w-full text-xs outline-none focus:border-[#00D4FF] text-white font-semibold uppercase"
            placeholder="e.g. Boston, Dallas, Austin..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        {/* Limit selector */}
        <div className="w-[120px] shrink-0 font-mono">
          <label className="text-[9px] text-neutral-450 font-extrabold uppercase tracking-widest block mb-1">Target Count</label>
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="bg-[#080C18]/90 border border-[#00D4FF]/20 rounded px-3 py-2.5 w-full text-xs outline-none text-neutral-300 font-semibold focus:border-[#00D4FF] cursor-pointer"
          >
            <option value={5}>5 Leads</option>
            <option value={10}>10 Leads</option>
            <option value={20}>20 Leads</option>
            <option value={50}>50 Leads</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button 
          type="submit" 
          variant="radar" 
          loading={loading}
          disabled={loading || !niche || !location}
        >
          <Search className="w-4 h-4 shrink-0" /> Initialize Deep Radar Scan
        </Button>
      </div>
    </form>
  );
};
