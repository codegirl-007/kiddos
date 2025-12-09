import { useState, useEffect } from 'react';
import { wordGroupsApi } from '../../services/apiClient';

interface Word {
  id: number;
  word: string;
}

interface WordGroup {
  id: number;
  name: string;
  wordCount: number;
  words: Word[];
  createdAt: string;
  updatedAt: string;
}

export function WordGroupManager() {
  const [groups, setGroups] = useState<WordGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newWordInputs, setNewWordInputs] = useState<Record<number, string>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await wordGroupsApi.getAll();
      setGroups(response.data.groups);
    } catch (err: any) {
      setError(err.error?.message || 'Failed to load word groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      setError(null);
      const response = await wordGroupsApi.create(newGroupName.trim());
      setGroups([response.data.group, ...groups]);
      setNewGroupName('');
    } catch (err: any) {
      setError(err.error?.message || 'Failed to create word group');
    }
  };

  const handleUpdateGroup = async (groupId: number) => {
    if (!editingGroupName.trim()) {
      setEditingGroupId(null);
      return;
    }

    try {
      setError(null);
      await wordGroupsApi.update(groupId, editingGroupName.trim());
      setGroups(groups.map(g => 
        g.id === groupId 
          ? { ...g, name: editingGroupName.trim(), updatedAt: new Date().toISOString() }
          : g
      ));
      setEditingGroupId(null);
      setEditingGroupName('');
    } catch (err: any) {
      setError(err.error?.message || 'Failed to update word group');
    }
  };

  const handleDeleteGroup = async (groupId: number, groupName: string) => {
    if (!confirm(`Are you sure you want to delete "${groupName}"? This will also delete all words in this group.`)) {
      return;
    }

    try {
      setError(null);
      await wordGroupsApi.delete(groupId);
      setGroups(groups.filter(g => g.id !== groupId));
      setExpandedGroups(prev => {
        const next = new Set(prev);
        next.delete(groupId);
        return next;
      });
    } catch (err: any) {
      setError(err.error?.message || 'Failed to delete word group');
    }
  };

  const handleAddWord = async (groupId: number) => {
    const word = newWordInputs[groupId]?.trim();
    if (!word) return;

    try {
      setError(null);
      const response = await wordGroupsApi.addWord(groupId, word);
      setGroups(groups.map(g => 
        g.id === groupId 
          ? { 
              ...g, 
              words: [...g.words, response.data.word].sort((a, b) => a.word.localeCompare(b.word)),
              wordCount: g.wordCount + 1
            }
          : g
      ));
      setNewWordInputs({ ...newWordInputs, [groupId]: '' });
    } catch (err: any) {
      setError(err.error?.message || 'Failed to add word');
    }
  };

  const handleDeleteWord = async (wordId: number, groupId: number, word: string) => {
    if (!confirm(`Delete "${word}"?`)) return;

    try {
      setError(null);
      await wordGroupsApi.deleteWord(wordId);
      setGroups(groups.map(g => 
        g.id === groupId 
          ? { 
              ...g, 
              words: g.words.filter(w => w.id !== wordId),
              wordCount: g.wordCount - 1
            }
          : g
      ));
    } catch (err: any) {
      setError(err.error?.message || 'Failed to delete word');
    }
  };

  const toggleGroup = (groupId: number) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const startEditing = (group: WordGroup) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
  };

  const cancelEditing = () => {
    setEditingGroupId(null);
    setEditingGroupName('');
  };

  if (loading) {
    return (
      <div className="w-full p-6 bg-card rounded-xl border border-border">
        <div className="mb-6">
          <h2 className="m-0 mb-2 text-xl font-semibold text-foreground">Speech Sounds - Word Groups</h2>
          <p className="m-0 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 bg-card rounded-xl border border-border">
      <div className="mb-6">
        <h2 className="m-0 mb-2 text-xl font-semibold text-foreground">Speech Sounds - Word Groups</h2>
        <p className="m-0 text-sm text-muted-foreground">Create groups of words to help practice speech sounds</p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-md mb-4 text-sm bg-red-50 text-red-800 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleCreateGroup} className="flex gap-3 mb-6 md:flex-row flex-col">
        <input
          type="text"
          placeholder="Enter group name (e.g., 'R Sounds', 'S Blends')..."
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          className="flex-1 px-4 py-3 border border-border rounded-md text-sm bg-muted text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <button 
          type="submit" 
          disabled={!newGroupName.trim()} 
          className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white border-none rounded-md text-sm font-medium cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          Create Group
        </button>
      </form>

      {groups.length === 0 ? (
        <div className="text-center py-12 px-6 text-muted-foreground">
          <p className="m-0 text-sm">No word groups yet. Create your first group above!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map(group => (
            <div key={group.id} className="bg-muted border border-border/50 rounded-lg overflow-hidden">
              <div className="p-4 bg-card border-b border-border/50">
                {editingGroupId === group.id ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={editingGroupName}
                      onChange={(e) => setEditingGroupName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdateGroup(group.id);
                        } else if (e.key === 'Escape') {
                          cancelEditing();
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-primary rounded-md text-base font-semibold bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdateGroup(group.id)}
                      className="px-4 py-2 bg-primary text-white border-none rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-secondary"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-4 py-2 bg-transparent text-foreground border border-border rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-muted"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center md:flex-row flex-col md:items-center items-start gap-3">
                      <h3 
                        className="m-0 text-lg font-semibold text-foreground cursor-pointer flex items-center gap-2 transition-colors hover:text-primary"
                        onClick={() => toggleGroup(group.id)}
                      >
                        {group.name}
                        <span className="text-sm font-normal text-muted-foreground">({group.wordCount} words)</span>
                      </h3>
                      <div className="flex gap-2 md:self-auto self-end">
                        <button
                          onClick={() => startEditing(group)}
                          className="bg-transparent border-none text-lg cursor-pointer p-1 rounded transition-colors hover:bg-muted"
                          title="Edit group name"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group.id, group.name)}
                          className="bg-transparent border-none text-lg cursor-pointer p-1 rounded transition-colors hover:bg-muted"
                          title="Delete group"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {expandedGroups.has(group.id) && (
                <div className="p-4">
                  <div className="mb-4">
                    {group.words.length === 0 ? (
                      <p className="text-center text-muted-foreground text-sm my-4">No words yet. Add words below.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {group.words.map(word => (
                          <div 
                            key={word.id} 
                            className="inline-flex items-center justify-between px-4 py-2 bg-card border border-border/50 rounded-full transition-all hover:border-primary hover:bg-muted whitespace-nowrap"
                          >
                            <span className="text-sm font-medium text-foreground mr-2 leading-tight inline-block align-middle mb-0">
                              {word.word}
                            </span>
                            <button
                              onClick={() => handleDeleteWord(word.id, group.id, word.word)}
                              className="bg-transparent border-none text-muted-foreground text-xl leading-none cursor-pointer p-0 w-5 h-5 inline-flex items-center justify-center rounded-full flex-shrink-0 ml-1 align-middle transition-colors hover:bg-red-100 hover:text-red-600"
                              title="Delete word"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddWord(group.id);
                    }}
                    className="flex gap-2 md:flex-row flex-col"
                  >
                    <input
                      type="text"
                      placeholder="Enter a word..."
                      value={newWordInputs[group.id] || ''}
                      onChange={(e) => setNewWordInputs({ ...newWordInputs, [group.id]: e.target.value })}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddWord(group.id);
                        }
                      }}
                      className="flex-1 px-3 py-2.5 border border-border rounded-md text-sm bg-card text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={!newWordInputs[group.id]?.trim()}
                      className="px-5 py-2.5 bg-primary text-white border-none rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      Add Word
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
