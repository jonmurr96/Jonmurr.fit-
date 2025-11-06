import React, { useRef } from 'react';

interface DataBackupProps {
  onClose: () => void;
}

export const DataBackup: React.FC<DataBackupProps> = ({ onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      // Get all localStorage data
      const data: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('jonmurrfit-')) {
          data[key] = localStorage.getItem(key);
        }
      }

      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `jonmurrfit-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('Data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate the data structure
      if (typeof data !== 'object' || data === null) {
        throw new Error('Invalid backup file format');
      }

      // Confirm before overwriting
      const confirmed = window.confirm(
        'This will overwrite your current data. Make sure you have a backup! Continue?'
      );

      if (!confirmed) {
        event.target.value = '';
        return;
      }

      // Import the data
      Object.entries(data).forEach(([key, value]) => {
        if (key.startsWith('jonmurrfit-') && typeof value === 'string') {
          localStorage.setItem(key, value);
        }
      });

      alert('Data imported successfully! Refreshing page...');
      window.location.reload();
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import data. Please check the file and try again.');
    }

    event.target.value = '';
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-md border border-zinc-700" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-white mb-4">Data Backup</h2>

        <div className="space-y-4">
          <div className="bg-zinc-800 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-2">Export Data</h3>
            <p className="text-sm text-zinc-400 mb-4">
              Download all your workouts, meals, progress, and settings as a JSON file.
            </p>
            <button
              onClick={handleExport}
              className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Export Backup
            </button>
          </div>

          <div className="bg-zinc-800 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-2">Import Data</h3>
            <p className="text-sm text-zinc-400 mb-4">
              Restore from a previous backup file. This will replace all current data.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Import Backup
            </button>
          </div>

          <div className="bg-amber-900/30 border border-amber-500/50 rounded-lg p-4">
            <p className="text-sm text-amber-200">
              ⚠️ <strong>Important:</strong> Always export a backup before importing to avoid data loss.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
