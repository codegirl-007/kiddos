import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { OptimizedImage } from '../components/OptimizedImage/OptimizedImage';
import { MagicCodeInput } from '../components/MagicCodeInput/MagicCodeInput';
import { getAppliedMagicCode, getMagicCodeSettings, hasActiveMagicCode } from '../services/magicCodeService';
import { getEnabledApps } from '../utils/appFilter';

const categoryEmojis: { [key: string]: string } = {
  videos: '📺',
  speechsounds: '🗣️',
  tictactoe: '⭕',
  drawingpad: '🎨',
  iframegame: '🕹️',
  all: '🎮',
};

const categoryColors: { [key: string]: string } = {
  videos: 'pink',
  speechsounds: 'purple',
  tictactoe: 'blue',
  drawingpad: 'amber',
  iframegame: 'green',
};

const colorMap: { [key: string]: string } = {
  pink: 'bg-pink-100 hover:bg-pink-200',
  purple: 'bg-purple-100 hover:bg-purple-200',
  blue: 'bg-blue-100 hover:bg-blue-200',
  green: 'bg-green-100 hover:bg-green-200',
  indigo: 'bg-indigo-100 hover:bg-indigo-200',
  amber: 'bg-amber-100 hover:bg-amber-200',
};

export function LandingPage() {
  const [showMagicCodeModal, setShowMagicCodeModal] = useState(false);
  const [enabledApps, setEnabledApps] = useState(getEnabledApps());
  const appliedCode = getAppliedMagicCode();
  const magicCodeSettings = getMagicCodeSettings();

  // Re-check enabled apps when magic code is applied/cleared
  useEffect(() => {
    setEnabledApps(getEnabledApps());
  }, [appliedCode, magicCodeSettings?.enabledApps?.join(',')]);

  return (
    <div className="bg-background">
      {showMagicCodeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <MagicCodeInput
            onApplied={() => {
              setShowMagicCodeModal(false);
              setEnabledApps(getEnabledApps());
            }}
            onClose={() => setShowMagicCodeModal(false)}
          />
        </div>
      )}
      
      <section className="px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {!hasActiveMagicCode() && (
            <div className="mb-6 text-center">
              <button
                onClick={() => setShowMagicCodeModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full font-semibold text-sm hover:bg-primary/90 transition-all active:scale-95 shadow-md"
              >
                ✨ Enter Magic Code
              </button>
            </div>
          )}
          {/* First card is likely LCP element - prioritize it */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {enabledApps.map(app => {
              const color = categoryColors[app.id] || 'pink';
              const emoji = categoryEmojis[app.id] || '🎮';
              
              return (
                <Link
                  key={app.id}
                  to={app.link}
                  className={`${colorMap[color]} w-full p-6 rounded-3xl font-semibold text-foreground transition-all active:scale-95 hover:shadow-lg flex flex-col items-center text-center`}
                >
                  <div className="mb-3">
                    {app.id === 'videos' ? (
                      <OptimizedImage 
                        src="/video-marketing.png" 
                        alt="Video App" 
                        className="w-20 h-20 object-contain"
                        width={80}
                        height={80}
                        loading="eager"
                        fetchPriority={app.id === 'videos' ? 'high' : 'auto'}
                      />
                    ) : app.id === 'speechsounds' ? (
                      <OptimizedImage 
                        src="/unicorn-talking.png" 
                        alt="Speech Sounds" 
                        className="w-20 h-20 object-contain"
                        width={80}
                        height={80}
                        loading="eager"
                        fetchPriority="auto"
                      />
                    ) : app.id === 'tictactoe' ? (
                      <OptimizedImage 
                        src="/tic-tac-toe.png" 
                        alt="Tic Tac Toe" 
                        className="w-20 h-20 object-contain"
                        width={80}
                        height={80}
                        loading="eager"
                        fetchPriority="auto"
                      />
                    ) : app.id === 'drawingpad' ? (
                      <OptimizedImage 
                        src="/drawing.png" 
                        alt="Drawing Pad" 
                        className="w-20 h-20 object-contain"
                        width={80}
                        height={80}
                        loading="eager"
                        fetchPriority="auto"
                        disableWebP={true}
                      />
                    ) : app.id === 'iframegame' ? (
                      <OptimizedImage 
                        src="/magic-wand.png" 
                        alt="Embedded Game" 
                        className="w-20 h-20 object-contain"
                        width={80}
                        height={80}
                        loading="eager"
                        fetchPriority="auto"
                      />
                    ) : (
                      <span className="text-5xl">{emoji}</span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold mb-1">{app.name}</h3>
                  <p className="text-sm opacity-75">{app.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

