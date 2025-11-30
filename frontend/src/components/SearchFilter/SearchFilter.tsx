import { useState } from 'react';
import './SearchFilter.css';

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
    <div className="search-filter">
      <div className="search-filter-container">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <input
            type="text"
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">
            🔍
          </button>
        </form>
        
        <div className="filter-controls">
          <select
            onChange={(e) => onSortChange(e.target.value as any)}
            className="filter-select"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="popular">Most Popular</option>
          </select>
          
          <select
            value={selectedChannel || ''}
            onChange={(e) => onChannelChange(e.target.value || undefined)}
            className="filter-select"
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
              className="clear-button"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


