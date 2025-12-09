import { Link } from 'react-router-dom';

export function AdminPage() {
  return (
    <div className="min-h-[calc(100vh-60px)] bg-background">
      <div className="bg-card border-b border-border py-8 px-6 text-center">
        <h1 className="m-0 mb-2 text-[28px] font-medium text-foreground">Admin Dashboard</h1>
        <p className="m-0 text-sm text-muted-foreground">Manage app settings and configurations</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6 max-w-[1200px] mx-auto">
        <Link 
          to="/admin/videos" 
          className="bg-pink-100 hover:bg-pink-200 w-full p-6 rounded-3xl font-semibold text-foreground transition-all active:scale-95 hover:shadow-lg flex flex-col items-center text-center no-underline"
        >
          <div className="mb-3">
            <img 
              src="/video-marketing.png" 
              alt="Video App" 
              className="w-20 h-20 object-contain"
            />
          </div>
          <h2 className="text-xl font-bold mb-1">Video App</h2>
          <p className="text-sm opacity-75">
            Manage YouTube channels and video time limits
          </p>
        </Link>
        
        <Link 
          to="/admin/speech-sounds" 
          className="bg-purple-100 hover:bg-purple-200 w-full p-6 rounded-3xl font-semibold text-foreground transition-all active:scale-95 hover:shadow-lg flex flex-col items-center text-center no-underline"
        >
          <div className="mb-3">
            <img 
              src="/unicorn-talking.png" 
              alt="Speech Sounds" 
              className="w-20 h-20 object-contain"
            />
          </div>
          <h2 className="text-xl font-bold mb-1">Speech Sounds</h2>
          <p className="text-sm opacity-75">
            Manage word groups for speech sound practice
          </p>
        </Link>
      </div>
    </div>
  );
}
