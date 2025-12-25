import { useState } from 'react';

const IFRAME_URL = 'https://www.google.com';

export function GameIframeApp() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="text-center space-y-2">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">Arcade Corner</p>
          <h1 className="text-4xl font-bold text-primary">Embedded Game View</h1>
          <p className="text-muted-foreground">
            Enjoy a game inside Kiddos while keeping all of our safety tools and controls handy.
          </p>
        </header>

        <div className="bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
          {loading && (
            <div className="p-4 text-center text-muted-foreground text-sm bg-muted">
              Loading embedded game...
            </div>
          )}
          <iframe
            src={IFRAME_URL}
            title="Embedded Game"
            className="w-full min-h-[75vh] border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            allowFullScreen
            onLoad={() => setLoading(false)}
          />
        </div>

        <div className="text-center text-xs text-muted-foreground">
          Content below is provided by an external site. Replace the URL in `GameIframeApp.tsx` when your game is ready.
        </div>
      </div>
    </div>
  );
}


