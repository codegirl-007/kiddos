import { useState, useEffect } from 'react';
import { wordGroupsApi } from '../services/apiClient';
import './SpeechSoundsApp.css';

interface Word {
  id: number;
  word: string;
}

interface WordGroup {
  id: number;
  name: string;
  words: Word[];
}

type PracticeResult = 'pass' | 'fail' | null;

interface WordPractice {
  [wordId: number]: PracticeResult[]; // Array of 10 practice results (pass/fail/null) for each word
}

const STORAGE_KEY = 'speech_sounds_practice';

export function SpeechSoundsApp() {
  const [groups, setGroups] = useState<WordGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<WordGroup | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [practiceData, setPracticeData] = useState<WordPractice>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWordPractice, setShowWordPractice] = useState(false);

  // Load practice data from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPracticeData(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load practice data from localStorage', e);
    }
  }, []);

  // Save practice data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(practiceData));
    } catch (e) {
      console.warn('Failed to save practice data to localStorage', e);
    }
  }, [practiceData]);

  // Fetch word groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await wordGroupsApi.getAll();
        const groupsData = response.data.groups.filter((g: WordGroup) => g.words.length > 0);
        setGroups(groupsData);
      } catch (err: any) {
        setError(err.error?.message || 'Failed to load word groups');
      } finally {
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  const getPracticeForWord = (wordId: number): PracticeResult[] => {
    return practiceData[wordId] || Array(10).fill(null);
  };

  const togglePractice = (wordId: number, index: number, result: 'pass' | 'fail') => {
    setPracticeData(prev => {
      const current = prev[wordId] || Array(10).fill(null);
      const updated = [...current];
      // Toggle: if clicking the same result, clear it; otherwise set it
      updated[index] = updated[index] === result ? null : result;
      return {
        ...prev,
        [wordId]: updated
      };
    });
  };

  const resetWord = (wordId: number) => {
    if (confirm('Reset all practice for this word?')) {
      setPracticeData(prev => {
        const updated = { ...prev };
        updated[wordId] = Array(10).fill(null);
        return updated;
      });
    }
  };

  const currentWord = selectedGroup?.words[currentWordIndex] || null;
  const practiceResults = currentWord ? getPracticeForWord(currentWord.id) : [];
  const passCount = practiceResults.filter(r => r === 'pass').length;
  const failCount = practiceResults.filter(r => r === 'fail').length;
  const totalCount = passCount + failCount;

  const handlePreviousWord = () => {
    if (selectedGroup && currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1);
    }
  };

  const handleNextWord = () => {
    if (selectedGroup && currentWordIndex < selectedGroup.words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    }
  };

  const handleSelectGroup = (group: WordGroup) => {
    setSelectedGroup(group);
    setCurrentWordIndex(0);
    setShowWordPractice(true);
  };

  const handleBackToGroups = () => {
    setShowWordPractice(false);
    setSelectedGroup(null);
    setCurrentWordIndex(0);
  };

  if (loading) {
    return (
      <div className="speech-sounds-app">
        <div className="loading-state">
          <p>Loading word groups...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="speech-sounds-app">
        <div className="error-state">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="speech-sounds-app">
        <div className="empty-state">
          <h2>No Word Groups Available</h2>
          <p>Please add word groups in the admin panel.</p>
        </div>
      </div>
    );
  }

  // Show word practice screen if group is selected
  if (showWordPractice && selectedGroup && currentWord) {
    return (
      <div className="speech-sounds-app">
        <div className="app-header">
          <button onClick={handleBackToGroups} className="back-to-groups-button">
            ← Back to Groups
          </button>
          <h1>{selectedGroup.name}</h1>
          <p>Practice your speech sounds by checking off each time you say the word</p>
        </div>

        <div className="practice-area">
          <div className="word-display">
            <h2 className="word-text">{currentWord.word}</h2>
            <div className="practice-stats">
              <span className="stat-item stat-pass">
                ✓ {passCount} Pass
              </span>
              <span className="stat-item stat-fail">
                ✗ {failCount} Fail
              </span>
              <span className="stat-item stat-total">
                {totalCount} / 10 Total
              </span>
            </div>
          </div>

          <div className="practice-container">
            <div className="practice-label">Mark each practice attempt:</div>
            <div className="practice-grid">
              {Array.from({ length: 10 }, (_, i) => {
                const result = practiceResults[i];
                const isPass = result === 'pass';
                const isFail = result === 'fail';
                
                return (
                  <div key={i} className="practice-item">
                    <span className="practice-number">{i + 1}</span>
                    <div className="practice-buttons">
                      <button
                        onClick={() => togglePractice(currentWord.id, i, 'pass')}
                        className={`practice-button pass-button ${isPass ? 'active' : ''}`}
                        title="Mark as pass"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => togglePractice(currentWord.id, i, 'fail')}
                        className={`practice-button fail-button ${isFail ? 'active' : ''}`}
                        title="Mark as fail"
                      >
                        ✗
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="word-navigation">
            <button
              onClick={handlePreviousWord}
              disabled={currentWordIndex === 0}
              className="nav-button prev-button"
            >
              ← Previous
            </button>
            <span className="word-counter">
              Word {currentWordIndex + 1} of {selectedGroup.words.length}
            </span>
            <button
              onClick={handleNextWord}
              disabled={currentWordIndex === selectedGroup.words.length - 1}
              className="nav-button next-button"
            >
              Next →
            </button>
          </div>

          <div className="word-actions">
            <button
              onClick={() => resetWord(currentWord.id)}
              className="reset-button"
            >
              Reset This Word
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show group selection screen
  return (
    <div className="speech-sounds-app">
      <div className="app-header">
        <h1>Speech Sounds Practice</h1>
        <p>Choose a word group to start practicing</p>
      </div>

      {groups.length === 0 ? (
        <div className="empty-state">
          <h2>No Word Groups Available</h2>
          <p>Please add word groups in the admin panel.</p>
        </div>
      ) : (
        <div className="groups-grid">
          {groups.map(group => (
            <button
              key={group.id}
              onClick={() => handleSelectGroup(group)}
              className="group-card"
            >
              <h3 className="group-card-name">{group.name}</h3>
              <p className="group-card-count">{group.words.length} words</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
