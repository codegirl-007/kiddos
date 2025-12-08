import { Link } from 'react-router-dom';
import { APPS } from '../config/apps';
import './LandingPage.css';

export function LandingPage() {
  return (
    <div className="landing-page menu">
      <header className="menu-header">
        <h1>Welcome to Kiddos</h1>
        <p>Select an app below to get started.</p>
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

