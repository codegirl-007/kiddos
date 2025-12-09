import { useState } from 'react';

interface SearchFilterProps {
  onSearch: (query: string) => void;
  onSortChange: (sort: 'newest' | 'oldest' | 'popular') => void;
  channels: Array<{ id: string; name: string }>;
  selectedChannel: string | undefined;
  onChannelChange: (channelId: string | undefined) => void;
}

export function SearchFilter({
  onSearch,
  onSortChange,
  channels,
  selectedChannel,
  onChannelChange
}: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };
  
  return (
    <div className="bg-muted border-b border-border py-4 px-6 md:py-4 md:px-6 py-3 px-4">
      <div className="max-w-[1600px] mx-auto flex gap-4 items-center md:flex-row md:gap-4 md:items-center flex-col items-stretch gap-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 max-w-md md:max-w-md max-w-full">
          <input
            type="text"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3.5 py-2.5 border border-border rounded-full text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:shadow-lg"
          />
          <button 
            type="submit" 
            className="px-4.5 py-2.5 bg-gradient-to-r from-primary to-secondary border-none rounded-full cursor-pointer text-base text-white transition-all shadow-lg hover:-translate-y-0.5 hover:shadow-xl"
          >
            🔍
          </button>
        </form>
        
        <div className="flex gap-3 items-center md:flex-row md:gap-3 md:items-center flex-wrap">
          <select
            onChange={(e) => onSortChange(e.target.value as any)}
            className="px-3 py-2 border border-border rounded-full text-sm bg-card cursor-pointer text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent md:flex-none flex-1"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="popular">Most Popular</option>
          </select>
          
          <select
            value={selectedChannel || ''}
            onChange={(e) => onChannelChange(e.target.value || undefined)}
            className="px-3 py-2 border border-border rounded-full text-sm bg-card cursor-pointer text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent md:flex-none flex-1"
          >
            <option value="">All Channels</option>
            {channels.map(channel => (
              <option key={channel.id} value={channel.id}>
                {channel.name}
              </option>
            ))}
          </select>
          
          {(searchQuery || selectedChannel) && (
            <button
              onClick={() => {
                setSearchQuery('');
                onSearch('');
                onChannelChange(undefined);
              }}
              className="px-3 py-2 bg-transparent border border-border rounded-full cursor-pointer text-sm whitespace-nowrap transition-colors text-muted-foreground hover:bg-primary/10 hover:text-foreground md:flex-none flex-1"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
