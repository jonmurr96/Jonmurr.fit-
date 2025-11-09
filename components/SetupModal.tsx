import React from 'react';

interface SetupModalProps {
  onRetry: () => void;
}

const SetupModal: React.FC<SetupModalProps> = ({ onRetry }) => {
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 rounded-2xl p-8 w-full max-w-2xl border border-zinc-700">
        <h2 className="text-3xl font-bold text-white mb-4">🚀 One-Time Setup Required</h2>
        
        <p className="text-zinc-300 mb-6">
          Your app needs database tables to save your fitness data. This is a quick one-time setup that takes about 30 seconds.
        </p>

        <div className="bg-zinc-800 rounded-lg p-6 mb-6 border border-zinc-700">
          <h3 className="text-xl font-bold text-green-400 mb-4">Quick Setup Steps:</h3>
          
          <ol className="space-y-3 text-zinc-300">
            <li className="flex items-start">
              <span className="text-green-400 font-bold mr-3 flex-shrink-0">1.</span>
              <span>Open your <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">Supabase Dashboard</a></span>
            </li>
            
            <li className="flex items-start">
              <span className="text-green-400 font-bold mr-3 flex-shrink-0">2.</span>
              <span>Select your project, then click <strong className="text-white">SQL Editor</strong> in the left sidebar</span>
            </li>
            
            <li className="flex items-start">
              <span className="text-green-400 font-bold mr-3 flex-shrink-0">3.</span>
              <span>Click <strong className="text-white">New Query</strong></span>
            </li>
            
            <li className="flex items-start">
              <span className="text-green-400 font-bold mr-3 flex-shrink-0">4.</span>
              <div>
                <p className="mb-2">Open <code className="bg-zinc-900 px-2 py-1 rounded text-green-400">supabase/schema.sql</code> in your project files</p>
                <p className="text-sm text-zinc-400">You can find this in the file explorer on the left side of Replit</p>
              </div>
            </li>
            
            <li className="flex items-start">
              <span className="text-green-400 font-bold mr-3 flex-shrink-0">5.</span>
              <span>Copy the <strong className="text-white">entire contents</strong> of schema.sql</span>
            </li>
            
            <li className="flex items-start">
              <span className="text-green-400 font-bold mr-3 flex-shrink-0">6.</span>
              <span>Paste it into the Supabase SQL Editor</span>
            </li>
            
            <li className="flex items-start">
              <span className="text-green-400 font-bold mr-3 flex-shrink-0">7.</span>
              <span>Click <strong className="text-white">Run</strong> (or press Ctrl/Cmd + Enter)</span>
            </li>
            
            <li className="flex items-start">
              <span className="text-green-400 font-bold mr-3 flex-shrink-0">8.</span>
              <span>Wait for "Success" message, then click the button below</span>
            </li>
          </ol>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <p className="text-yellow-300 text-sm">
            <strong className="font-bold">Note:</strong> This creates 23 tables to store your meals, workouts, progress tracking, and gamification data. You only need to do this once!
          </p>
        </div>

        <button
          onClick={onRetry}
          className="w-full bg-green-500 text-black font-bold py-4 px-6 rounded-lg hover:bg-green-600 transition-colors text-lg"
        >
          ✓ I've Run the Schema - Check Again
        </button>

        <p className="text-zinc-500 text-sm mt-4 text-center">
          Need help? See <code className="text-green-400">SUPABASE_SETUP.md</code> for detailed instructions
        </p>
      </div>
    </div>
  );
};

export default SetupModal;
