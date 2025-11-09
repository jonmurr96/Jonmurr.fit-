import React, { useState, useRef } from 'react';
import { TrainingProgram } from '../../types';
import { parseWorkoutText, reviewImportedWorkout } from '../../services/geminiService';
import { SparklesIcon, DocumentIcon, CameraIcon, LinkIcon, XIcon } from '../Icons';

interface ImportWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (program: TrainingProgram, aiReview?: string) => void;
}

type ImportMethod = 'text' | 'file' | 'photo' | 'code';

export const ImportWorkoutModal: React.FC<ImportWorkoutModalProps> = ({ isOpen, onClose, onImport }) => {
  const [selectedMethod, setSelectedMethod] = useState<ImportMethod>('text');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiReview, setAiReview] = useState('');
  const [parsedProgram, setParsedProgram] = useState<TrainingProgram | null>(null);
  const [step, setStep] = useState<'input' | 'review'>('input');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setInputText('');
    setError('');
    setAiReview('');
    setParsedProgram(null);
    setStep('input');
  };

  const handleParse = async () => {
    if (!inputText.trim()) {
      setError('Please enter workout details');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await parseWorkoutText(inputText);
      
      if (!result || !result.program) {
        setError('Could not parse workout. Please check the format and try again.');
        return;
      }

      setParsedProgram(result.program);
      
      const review = await reviewImportedWorkout(result.program);
      setAiReview(review);
      
      setStep('review');
    } catch (err) {
      setError('An error occurred while parsing. Please try again.');
      console.error('Parse error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const text = await file.text();
      setInputText(text);
      setSelectedMethod('text');
      
      try {
        const result = await parseWorkoutText(text);
        
        if (!result || !result.program) {
          setError('Could not parse workout. Please check the format and try again.');
          return;
        }

        setParsedProgram(result.program);
        
        const review = await reviewImportedWorkout(result.program);
        setAiReview(review);
        
        setStep('review');
      } catch (parseErr) {
        setError('Could not parse the workout plan. Please check the format and try again.');
        console.error('Parse error:', parseErr);
      }
    } catch (err) {
      setError('Could not read file. Please try again.');
      console.error('File read error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      setError('Photo OCR coming soon! For now, please use text paste.');
    } catch (err) {
      setError('Could not process image. Please try again.');
      console.error('Photo processing error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (parsedProgram) {
      onImport(parsedProgram, aiReview);
      handleReset();
      onClose();
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const tabs = [
    { id: 'text' as ImportMethod, label: 'Paste Text', icon: <DocumentIcon className="w-5 h-5" /> },
    { id: 'file' as ImportMethod, label: 'Upload File', icon: <DocumentIcon className="w-5 h-5" /> },
    { id: 'photo' as ImportMethod, label: 'Photo OCR', icon: <CameraIcon className="w-5 h-5" /> },
    { id: 'code' as ImportMethod, label: 'Share Code', icon: <LinkIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl border border-zinc-800 animate-scaleIn">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-gradient-to-r from-green-500/10 to-emerald-500/10">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-green-400" />
              Import Workout Plan
            </h2>
            <p className="text-zinc-400 text-sm mt-1">Bring in your workout from anywhere</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <XIcon className="w-6 h-6 text-zinc-400" />
          </button>
        </div>

        {step === 'input' && (
          <>
            <div className="flex border-b border-zinc-800 bg-zinc-900/50">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedMethod(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
                    selectedMethod === tab.id
                      ? 'text-green-400 border-b-2 border-green-400 bg-green-500/5'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {selectedMethod === 'text' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Paste your workout plan
                    </label>
                    <p className="text-xs text-zinc-500 mb-3">
                      Example: "Day 1: Push – Bench Press 4x10, OHP 3x8, Dips 3x12..."
                    </p>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Paste your workout plan here...&#10;&#10;Day 1: Push&#10;Bench Press 4x10&#10;Overhead Press 3x8&#10;Tricep Dips 3x12&#10;&#10;Day 2: Pull&#10;Deadlift 3x5&#10;Pull-ups 3xAMRAP&#10;Barbell Rows 4x8"
                      className="w-full h-64 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    />
                  </div>
                </div>
              )}

              {selectedMethod === 'file' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Upload a file
                    </label>
                    <p className="text-xs text-zinc-500 mb-3">
                      Supported formats: .txt, .json
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-16 border-2 border-dashed border-zinc-700 rounded-lg hover:border-green-500 hover:bg-green-500/5 transition-all text-zinc-400 hover:text-green-400 flex flex-col items-center gap-3"
                    >
                      <DocumentIcon className="w-12 h-12" />
                      <span className="font-medium">Click to upload file</span>
                      <span className="text-xs">or drag and drop</span>
                    </button>
                  </div>
                </div>
              )}

              {selectedMethod === 'photo' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Take or upload a photo
                    </label>
                    <p className="text-xs text-zinc-500 mb-3">
                      AI will extract exercises from your image
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="block w-full py-16 border-2 border-dashed border-zinc-700 rounded-lg hover:border-green-500 hover:bg-green-500/5 transition-all text-zinc-400 hover:text-green-400 flex flex-col items-center gap-3 cursor-pointer"
                    >
                      <CameraIcon className="w-12 h-12" />
                      <span className="font-medium">Take or upload photo</span>
                      <span className="text-xs">Coming soon!</span>
                    </label>
                  </div>
                </div>
              )}

              {selectedMethod === 'code' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Enter share code or URL
                    </label>
                    <p className="text-xs text-zinc-500 mb-3">
                      Import a workout shared by your coach or from online
                    </p>
                    <input
                      type="text"
                      placeholder="e.g., ABC123 or https://..."
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                      disabled
                    />
                    <p className="text-xs text-zinc-500 mt-2">Coming soon!</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-zinc-800 flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleParse}
                disabled={loading || !inputText.trim() || selectedMethod !== 'text'}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-zinc-700 disabled:to-zinc-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Parsing...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-5 h-5" />
                    Parse with AI
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {step === 'review' && parsedProgram && (
          <>
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4">
                <h3 className="text-lg font-bold text-white mb-2">{parsedProgram.programName}</h3>
                <p className="text-zinc-300 text-sm mb-3">{parsedProgram.description}</p>
                <div className="flex gap-4 text-xs text-zinc-400">
                  <span>📅 {parsedProgram.durationWeeks} weeks</span>
                  <span>🎯 {parsedProgram.splitType}</span>
                  <span>💪 {parsedProgram.workouts.filter(w => w.exercises.length > 0).length} workout days</span>
                </div>
              </div>

              {aiReview && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <SparklesIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-blue-400 mb-2">AI Coach Review</h4>
                      <p className="text-zinc-300 text-sm leading-relaxed">{aiReview}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-zinc-400">Workout Days</h4>
                {parsedProgram.workouts.filter(w => w.exercises.length > 0).map((workout, idx) => (
                  <div key={workout.id} className="bg-zinc-800 rounded-lg p-4">
                    <h5 className="font-medium text-white mb-2">{workout.focus}</h5>
                    <ul className="space-y-1 text-sm text-zinc-400">
                      {workout.exercises.map((exercise, exIdx) => (
                        <li key={exercise.id}>
                          {exIdx + 1}. {exercise.name} - {exercise.sets.length} sets
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-zinc-800 flex gap-3">
              <button
                onClick={() => setStep('input')}
                className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleConfirmImport}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 active:scale-95"
              >
                Import Workout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
