import Link from 'next/link';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-red-500" />
      </div>
      
      <h1 className="text-4xl font-bold text-white mb-2 tracking-tighter">404</h1>
      <p className="text-white/40 text-sm max-w-xs mb-8">
        The neural coordinates you requested do not exist in the current knowledge registry.
      </p>

      <Link 
        href="/dashboard"
        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-black font-bold text-sm hover:scale-105 transition-transform"
      >
        <Home className="w-4 h-4" />
        Return to Dashboard
      </Link>
    </div>
  );
}
