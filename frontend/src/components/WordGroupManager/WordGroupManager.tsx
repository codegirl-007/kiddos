import { useState, useEffect } from 'react';
import { wordGroupsApi } from '../../services/apiClient';
import './WordGroupManager.css';

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
      <div className="word-group-manager">
        <div className="word-group-header">
          <h2>Speech Sounds - Word Groups</h2>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="word-group-manager">
      <div className="word-group-header">
        <h2>Speech Sounds - Word Groups</h2>
        <p>Create groups of words to help practice speech sounds</p>
      </div>

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      <form onSubmit={handleCreateGroup} className="create-group-form">
        <input
          type="text"
          placeholder="Enter group name (e.g., 'R Sounds', 'S Blends')..."
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          className="group-name-input"
        />
        <button type="submit" disabled={!newGroupName.trim()} className="create-group-btn">
          Create Group
        </button>
      </form>

      {groups.length === 0 ? (
        <div className="empty-state">
          <p>No word groups yet. Create your first group above!</p>
        </div>
      ) : (
        <div className="groups-list">
          {groups.map(group => (
            <div key={group.id} className="word-group-card">
              <div className="group-header">
                {editingGroupId === group.id ? (
                  <div className="edit-group-form">
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
                      className="edit-group-input"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdateGroup(group.id)}
                      className="save-btn"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="group-info">
                      <h3 className="group-name" onClick={() => toggleGroup(group.id)}>
                        {group.name}
                        <span className="word-count">({group.wordCount} words)</span>
                      </h3>
                      <div className="group-actions">
                        <button
                          onClick={() => startEditing(group)}
                          className="edit-btn"
                          title="Edit group name"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group.id, group.name)}
                          className="delete-btn"
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
                <div className="group-content">
                  <div className="words-list">
                    {group.words.length === 0 ? (
                      <p className="no-words">No words yet. Add words below.</p>
                    ) : (
                      <div className="words-grid">
                        {group.words.map(word => (
                          <div key={word.id} className="word-item">
                            <span className="word-text">{word.word}</span>
                            <button
                              onClick={() => handleDeleteWord(word.id, group.id, word.word)}
                              className="delete-word-btn"
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
                    className="add-word-form"
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
                      className="word-input"
                    />
                    <button
                      type="submit"
                      disabled={!newWordInputs[group.id]?.trim()}
                      className="add-word-btn"
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
