import { WordGroupManager } from '../components/WordGroupManager/WordGroupManager';
import { Link } from 'react-router-dom';

export function SpeechSoundsAdminPage() {
  return (
    <div className="min-h-[calc(100vh-60px)] bg-background">
      <div className="bg-card border-b border-border py-8 px-6 text-center">
        <Link 
          to="/admin" 
          className="inline-block mb-4 px-4 py-2 bg-transparent border border-border rounded-md text-foreground text-sm cursor-pointer transition-colors no-underline hover:bg-muted"
        >
          ← Back to Admin
        </Link>
        <h1 className="m-0 mb-2 text-[28px] font-medium text-foreground">Speech Sounds - Word Groups</h1>
        <p className="m-0 text-sm text-muted-foreground">Manage word groups for speech sound practice</p>
      </div>
      <div className="max-w-[1200px] mx-auto p-6">
        <WordGroupManager />
      </div>
    </div>
  );
}
