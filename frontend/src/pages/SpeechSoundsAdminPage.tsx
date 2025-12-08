import { WordGroupManager } from '../components/WordGroupManager/WordGroupManager';
import { Link } from 'react-router-dom';
import './AdminPage.css';

export function SpeechSoundsAdminPage() {
  return (
    <div className="admin-page">
      <div className="admin-header">
        <Link to="/admin" className="back-button">
          ← Back to Admin
        </Link>
        <h1>Speech Sounds - Word Groups</h1>
        <p>Manage word groups for speech sound practice</p>
      </div>
      <WordGroupManager />
    </div>
  );
}
