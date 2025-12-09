import { useState, useEffect } from 'react';
import { wordGroupsApi } from '../services/apiClient';

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
      <div className="min-h-[calc(100vh-60px)] bg-background px-6 py-6 max-w-[900px] mx-auto">
        <div className="text-center py-12 px-6 bg-card rounded-3xl mt-8 border-4 border-primary shadow-lg">
          <p className="text-foreground">Loading word groups...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-60px)] bg-background px-6 py-6 max-w-[900px] mx-auto">
        <div className="text-center py-12 px-6 bg-card rounded-3xl mt-8 border-4 border-primary shadow-lg">
          <p className="text-foreground">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="min-h-[calc(100vh-60px)] bg-background px-6 py-6 max-w-[900px] mx-auto">
        <div className="text-center py-12 px-6 bg-card rounded-3xl mt-8 border-4 border-primary shadow-lg">
          <h2 className="m-0 mb-3 text-[32px] text-primary font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            No Word Groups Available
          </h2>
          <p className="m-0 text-muted-foreground text-lg font-semibold">Please add word groups in the admin panel.</p>
        </div>
      </div>
    );
  }

  // Show word practice screen if group is selected
  if (showWordPractice && selectedGroup && currentWord) {
    return (
      <div className="min-h-[calc(100vh-60px)] bg-background px-6 py-6 max-w-[900px] mx-auto">
        <div className="text-center mb-8">
          <button 
            onClick={handleBackToGroups} 
            className="mb-4 px-6 py-3 bg-card border-[3px] border-primary rounded-[20px] text-primary text-base font-bold cursor-pointer transition-all shadow-md hover:bg-primary hover:text-primary-foreground hover:-translate-y-0.5 hover:shadow-lg"
          >
            ← Back to Groups
          </button>
          <h1 className="m-0 mb-3 text-[42px] font-extrabold text-primary bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {selectedGroup.name}
          </h1>
          <p className="m-0 text-lg text-foreground font-semibold opacity-80">
            Practice your speech sounds by checking off each time you say the word
          </p>
        </div>

        <div className="bg-card rounded-[32px] p-10 shadow-lg border-4 border-primary">
          <div className="text-center mb-10">
            <h2 
              className="text-[72px] md:text-[72px] text-[48px] font-black mb-5 tracking-[4px] bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-[wordBounce_0.5s_ease-out]"
              style={{
                animation: 'wordBounce 0.5s ease-out',
              }}
            >
              {currentWord.word}
            </h2>
            <div className="flex justify-center gap-5 mt-5 flex-wrap">
              <span className="text-lg font-bold py-3 px-5 rounded-[25px] shadow-md border-[3px] bg-[#10b981] border-[#10b981] text-white">
                ✓ {passCount} Pass
              </span>
              <span className="text-lg font-bold py-3 px-5 rounded-[25px] shadow-md border-[3px] bg-[#ef4444] border-[#ef4444] text-white">
                ✗ {failCount} Fail
              </span>
              <span className="text-lg font-bold py-3 px-5 rounded-[25px] shadow-md border-[3px] bg-secondary border-secondary text-secondary-foreground">
                {totalCount} / 10 Total
              </span>
            </div>
          </div>

          <div className="mb-8">
            <div className="text-center text-xl font-bold text-foreground mb-6">Mark each practice attempt:</div>
            <div className="grid grid-cols-5 md:grid-cols-5 grid-cols-3 gap-4 mx-auto">
              {Array.from({ length: 10 }, (_, i) => {
                const result = practiceResults[i];
                const isPass = result === 'pass';
                const isFail = result === 'fail';
                
                return (
                  <div 
                    key={i} 
                    className="flex flex-col items-center gap-3 p-5 border-[3px] border-border rounded-[20px] bg-card transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary"
                  >
                    <span className="text-base font-bold text-primary-foreground w-10 h-10 flex items-center justify-center rounded-full bg-primary shadow-md">
                      {i + 1}
                    </span>
                    <div className="flex gap-2.5">
                      <button
                        onClick={() => togglePractice(currentWord.id, i, 'pass')}
                        className={`w-11 h-11 border-[3px] rounded-xl bg-white text-2xl font-bold cursor-pointer transition-all flex items-center justify-center shadow-md ${
                          isPass 
                            ? 'bg-[#10b981] text-white border-[#10b981] scale-110 shadow-lg' 
                            : 'text-[#065f46] border-[#10b981] hover:bg-[#10b981] hover:border-[#10b981] hover:text-white hover:scale-110 hover:shadow-lg'
                        }`}
                        title="Mark as pass"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => togglePractice(currentWord.id, i, 'fail')}
                        className={`w-11 h-11 border-[3px] rounded-xl bg-white text-2xl font-bold cursor-pointer transition-all flex items-center justify-center shadow-md ${
                          isFail 
                            ? 'bg-[#ef4444] text-white border-[#ef4444] scale-110 shadow-lg' 
                            : 'text-[#991b1b] border-[#ef4444] hover:bg-[#ef4444] hover:border-[#ef4444] hover:text-white hover:scale-110 hover:shadow-lg'
                        }`}
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

          <div className="flex justify-between items-center mb-6 pt-6 border-t-[3px] border-dashed border-border md:flex-row flex-col md:gap-0 gap-4">
            <button
              onClick={handlePreviousWord}
              disabled={currentWordIndex === 0}
              className="px-8 py-4 bg-primary text-primary-foreground border-[3px] border-primary rounded-[25px] text-lg font-bold cursor-pointer transition-all shadow-md hover:-translate-y-1 hover:scale-105 hover:shadow-lg hover:border-secondary disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
            >
              ← Previous
            </button>
            <span className="text-xl text-secondary-foreground font-bold py-3 px-6 bg-secondary rounded-[20px] border-[3px] border-secondary shadow-md">
              Word {currentWordIndex + 1} of {selectedGroup.words.length}
            </span>
            <button
              onClick={handleNextWord}
              disabled={currentWordIndex === selectedGroup.words.length - 1}
              className="px-8 py-4 bg-primary text-primary-foreground border-[3px] border-primary rounded-[25px] text-lg font-bold cursor-pointer transition-all shadow-md hover:-translate-y-1 hover:scale-105 hover:shadow-lg hover:border-secondary disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none md:w-auto w-full"
            >
              Next →
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={() => resetWord(currentWord.id)}
              className="px-6 py-3 bg-card text-[#ef4444] border-[3px] border-[#ef4444] rounded-[20px] text-base font-bold cursor-pointer transition-all shadow-md hover:bg-[#ef4444] hover:text-white hover:-translate-y-0.5 hover:shadow-lg"
            >
              Reset This Word
            </button>
          </div>
        </div>

        <style>{`
          @keyframes wordBounce {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.1);
            }
          }
        `}</style>
      </div>
    );
  }

  // Show group selection screen
  return (
    <div className="min-h-[calc(100vh-60px)] bg-background px-6 py-6 max-w-[900px] mx-auto">
      <div className="text-center mb-8">
        <h1 className="m-0 mb-3 text-[42px] font-extrabold text-primary bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Speech Sounds Practice
        </h1>
        <p className="m-0 text-lg text-foreground font-semibold opacity-80">
          Choose a word group to start practicing
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-12 px-6 bg-card rounded-3xl mt-8 border-4 border-primary shadow-lg">
          <h2 className="m-0 mb-3 text-[32px] text-primary font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            No Word Groups Available
          </h2>
          <p className="m-0 text-muted-foreground text-lg font-semibold">Please add word groups in the admin panel.</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-6 mt-8">
          {groups.map(group => (
            <button
              key={group.id}
              onClick={() => handleSelectGroup(group)}
              className="bg-card border-4 border-primary rounded-3xl py-8 px-6 text-center cursor-pointer transition-all text-foreground shadow-lg relative overflow-hidden hover:-translate-y-2 hover:scale-105 hover:shadow-xl hover:border-secondary group"
            >
              <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,107,157,0.1)_0%,transparent_70%)] opacity-0 transition-opacity group-hover:opacity-100"></div>
              <h3 className="m-0 mb-2 text-[28px] font-extrabold text-primary bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent relative z-10">
                {group.name}
              </h3>
              <p className="m-0 text-lg text-muted-foreground font-bold relative z-10">
                {group.words.length} words
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
