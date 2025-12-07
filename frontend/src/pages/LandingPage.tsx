import { Link } from 'react-router-dom';
import './LandingPage.css';

type App = {
  id: string;
  name: string;
  description: string;
  cta: string;
} & (
  | { disabled: true; link?: never }
  | { disabled?: false; link: string }
);

const APPS: App[] = [
  {
    id: 'videos',
    name: 'Video Library',
    description: 'Browse long-form videos from your trusted kid-friendly channels, already filtered to longer than ten minutes.',
    cta: 'Open Videos',
    link: '/videos'
  },
  {
    id: 'soon',
    name: 'Story Time (Coming Soon)',
    description: 'Narrated stories and audio adventures for quiet time.',
    cta: 'In Development',
    disabled: true
  }
];

export function LandingPage() {
  return (
    <div className="landing-page menu">
      <header className="menu-header">
        <p className="eyebrow">Choose an experience</p>
        <h1>Welcome to Kiddos</h1>
        <p>Select an app below to get started. We’ll keep adding more experiences over time.</p>
      </header>

      <section className="app-grid">
        {APPS.map(app => (
          <article key={app.id} className={`app-card ${app.disabled ? 'disabled' : ''}`}>
            <header>
              <h2>{app.name}</h2>
            </header>
            <p>{app.description}</p>
            <div className="app-actions">
              {app.disabled ? (
                <button disabled>{app.cta}</button>
              ) : (
                <Link to={app.link}>{app.cta}</Link>
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

