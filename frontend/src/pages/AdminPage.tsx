import { Link } from 'react-router-dom';

export function AdminPage() {
  return (
    <div className="min-h-[calc(100vh-60px)] bg-background">
      <div className="bg-card border-b border-border py-8 px-6 text-center">
        <h1 className="m-0 mb-2 text-[28px] font-medium text-foreground">Admin Dashboard</h1>
        <p className="m-0 text-sm text-muted-foreground">Manage app settings and configurations</p>
      </div>
      
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6 p-6 max-w-[1200px] mx-auto">
        <Link 
          to="/admin/videos" 
          className="flex flex-col items-center text-center py-8 px-6 bg-card border border-border rounded-xl no-underline text-foreground transition-all hover:-translate-y-1 hover:shadow-lg group"
        >
          <div className="text-5xl mb-4">📹</div>
          <h2 className="m-0 mb-2 text-2xl font-medium text-foreground">Video App</h2>
          <p className="m-0 text-sm text-muted-foreground leading-relaxed">
            Manage YouTube channels and video time limits
          </p>
        </Link>
        
        <Link 
          to="/admin/speech-sounds" 
          className="flex flex-col items-center text-center py-8 px-6 bg-card border border-border rounded-xl no-underline text-foreground transition-all hover:-translate-y-1 hover:shadow-lg group"
        >
          <div className="text-5xl mb-4">🗣️</div>
          <h2 className="m-0 mb-2 text-2xl font-medium text-foreground">Speech Sounds</h2>
          <p className="m-0 text-sm text-muted-foreground leading-relaxed">
            Manage word groups for speech sound practice
          </p>
        </Link>
      </div>
    </div>
  );
}
