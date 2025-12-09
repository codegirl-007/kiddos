import { Link } from 'react-router-dom';
import { APPS } from '../config/apps';

const categoryEmojis: { [key: string]: string } = {
  videos: '📺',
  speechsounds: '🗣️',
  all: '🎮',
};

const categoryColors: { [key: string]: string } = {
  videos: 'pink',
  speechsounds: 'purple',
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
  return (
    <div className="bg-background">
      <section className="px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {APPS.map(app => {
              const color = categoryColors[app.id] || 'pink';
              const emoji = categoryEmojis[app.id] || '🎮';
              
              return (
                <Link
                  key={app.id}
                  to={app.disabled ? '#' : app.link}
                  className={`${colorMap[color]} w-full p-6 rounded-3xl font-semibold text-foreground transition-all active:scale-95 hover:shadow-lg flex flex-col items-center text-center ${
                    app.disabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={(e) => {
                    if (app.disabled) {
                      e.preventDefault();
                    }
                  }}
                >
                  <div className="mb-3">
                    {app.id === 'videos' ? (
                      <img 
                        src="/video-marketing.png" 
                        alt="Video App" 
                        className="w-20 h-20 object-contain"
                      />
                    ) : app.id === 'speechsounds' ? (
                      <img 
                        src="/unicorn-talking.png" 
                        alt="Speech Sounds" 
                        className="w-20 h-20 object-contain"
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

