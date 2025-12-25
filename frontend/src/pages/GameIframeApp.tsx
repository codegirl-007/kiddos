import { useMemo, useState } from 'react';

type GameIframeAppProps = {
  iframeUrl: string;
  badgeText?: string;
  title?: string;
  description?: string;
  footerNote?: string;
};

const DEFAULT_CONFIG = {
  badgeText: 'Arcade Corner',
  title: 'Embedded Game View',
  description: 'Enjoy a game inside Kiddos while keeping all of our safety tools and controls handy.',
  footerNote: 'Content below is provided by an external site.'
};

export function GameIframeApp({
  iframeUrl,
  badgeText,
  title,
  description,
  footerNote
}: GameIframeAppProps) {
  const [loading, setLoading] = useState(true);

  const config = useMemo(
    () => ({
      iframeUrl,
      badgeText: badgeText || DEFAULT_CONFIG.badgeText,
      title: title || DEFAULT_CONFIG.title,
      description: description || DEFAULT_CONFIG.description,
      footerNote: footerNote || DEFAULT_CONFIG.footerNote
    }),
    [iframeUrl, badgeText, title, description, footerNote]
  );

  if (!config.iframeUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Missing iframeUrl for embedded game.
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">

      <div className="flex-1 w-full flex flex-col">
        <div className="flex-1 w-full bg-card border border-border  overflow-hidden flex flex-col">
          {loading && (
            <div className="p-4 text-center text-muted-foreground text-sm bg-muted">
              Loading embedded game...
            </div>
          )}
          <iframe
            src={config.iframeUrl}
            title="Embedded Game"
            className="w-full h-full flex-1 border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            allowFullScreen
            onLoad={() => setLoading(false)}
          />
        </div>
      </div>
    </div>
  );
}

