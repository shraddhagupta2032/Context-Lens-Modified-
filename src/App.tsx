import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  FileText, 
  Key, 
  Target, 
  Activity, 
  AlertTriangle, 
  Send, 
  HelpCircle,
  Loader2,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { callGemini, GeminiMessage } from './lib/gemini';

export default function App() {
  // State
  const [apiKey, setApiKey] = useState('');
  const [manualName, setManualName] = useState<string | null>(null);
  const [manualBase64, setManualBase64] = useState<string | null>(null);
  const [goal, setGoal] = useState('Assemble the main frame');
  const [status, setStatus] = useState<'ready' | 'thinking' | 'error'>('ready');
  const [messages, setMessages] = useState<GeminiMessage[]>([]);
  const [snapshots, setSnapshots] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const snapshotIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Camera Setup
  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' },
          audio: false 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setStatus('error');
      }
    }
    setupCamera();
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  // Snapshot Logic
  const takeSnapshot = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
  }, []);

  // Analysis Loop
  useEffect(() => {
    if (isAnalyzing && apiKey && manualBase64) {
      snapshotIntervalRef.current = setInterval(async () => {
        const snapshot = takeSnapshot();
        if (snapshot) {
          setSnapshots(prev => {
            const next = [...prev, snapshot];
            return next.slice(-10); // Keep last 10
          });
        }
      }, 5000);
    } else {
      if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current);
    }
    return () => {
      if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current);
    };
  }, [isAnalyzing, apiKey, manualBase64, takeSnapshot]);

  // Trigger Gemini Call when snapshots update (every 5s)
  useEffect(() => {
    if (isAnalyzing && snapshots.length > 0 && snapshots.length % 1 === 0) {
      handleAnalysis();
    }
  }, [snapshots]);

  const handleAnalysis = async () => {
    if (!apiKey || !manualBase64) return;
    setStatus('thinking');
    try {
      const response = await callGemini(apiKey, goal, snapshots, manualBase64, messages);
      
      // Check for STOP/Safety
      if (response.toUpperCase().includes('STOP')) {
        setSafetyWarning(response);
      } else {
        setSafetyWarning(null);
      }

      setMessages(prev => [...prev, { role: 'model', text: response }]);
      setStatus('ready');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
    }
  };

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setManualName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setManualBase64(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const askExpert = async () => {
    const snapshot = takeSnapshot();
    if (!snapshot) return;
    
    setStatus('thinking');
    try {
      const response = await callGemini(
        apiKey, 
        `I'm stuck. ${goal}. Give me a detailed hint based on what you see.`, 
        [snapshot], 
        manualBase64, 
        messages
      );
      setMessages(prev => [...prev, { role: 'model', text: response }]);
      setStatus('ready');
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col p-6 gap-8 overflow-y-auto">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight">Context-Lens</h1>
            <p className="text-xs text-slate-400">Universal Technical Expert</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* API Key */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Key className="w-3 h-3" /> API Key
            </label>
            <input 
              type="password"
              placeholder="Enter Gemini API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Manual Upload */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-3 h-3" /> Manual Upload (PDF)
            </label>
            <div className="relative group">
              <input 
                type="file"
                accept=".pdf"
                onChange={handleManualUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={cn(
                "border-2 border-dashed rounded-lg p-4 text-center transition-all",
                manualName ? "border-blue-500 bg-blue-500/10" : "border-slate-700 group-hover:border-slate-600"
              )}>
                {manualName ? (
                  <div className="flex items-center justify-center gap-2 text-blue-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs font-medium truncate max-w-[150px]">{manualName}</span>
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs">
                    Click or drag PDF manual
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Current Goal */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Target className="w-3 h-3" /> Current Goal
            </label>
            <textarea 
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* System Status */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</span>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  status === 'ready' ? "bg-green-500" : status === 'thinking' ? "bg-orange-500" : "bg-red-500"
                )} />
                <span className="text-xs font-medium capitalize">{status}</span>
              </div>
            </div>
          </div>

          {/* Analysis Toggle */}
          <button
            onClick={() => setIsAnalyzing(!isAnalyzing)}
            disabled={!apiKey || !manualBase64}
            className={cn(
              "w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
              !apiKey || !manualBase64 ? "bg-slate-800 text-slate-600 cursor-not-allowed" :
              isAnalyzing ? "bg-red-600 hover:bg-red-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20"
            )}
          >
            {isAnalyzing ? (
              <>
                <Activity className="w-4 h-4 animate-spin" /> Stop Analysis
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" /> Start Live Analysis
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Camera View */}
        <div className="h-[60%] bg-black relative overflow-hidden">
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          
          {/* Overlays */}
          <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Live Analysing...</span>
          </div>

          <AnimatePresence>
            {safetyWarning && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 border-[12px] border-red-600/50 pointer-events-none flex items-center justify-center"
              >
                <div className="bg-red-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce">
                  <ShieldAlert className="w-8 h-8" />
                  <div>
                    <h3 className="font-black text-xl uppercase tracking-tighter">Safety Warning</h3>
                    <p className="text-sm font-medium opacity-90">Potential risk detected. Check instructions.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stuck Button */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <button 
              onClick={askExpert}
              disabled={!apiKey || status === 'thinking'}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 transition-all shadow-2xl disabled:opacity-50"
            >
              <HelpCircle className="w-4 h-4 text-blue-400" />
              Stuck? Ask the Expert
            </button>
          </div>
        </div>

        {/* AI Guidance Area */}
        <div className="flex-1 flex flex-col bg-slate-950 border-t border-slate-800">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" /> AI Guidance Stream
            </h2>
            {status === 'thinking' && (
              <div className="flex items-center gap-2 text-xs text-blue-400 font-medium">
                <Loader2 className="w-3 h-3 animate-spin" /> Processing Context...
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 opacity-50">
                <Target className="w-12 h-12" />
                <p className="text-sm font-medium">Waiting for analysis to begin...</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-4 max-w-3xl",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    msg.role === 'model' ? "bg-blue-600" : "bg-slate-700"
                  )}>
                    {msg.role === 'model' ? <Activity className="w-4 h-4 text-white" /> : <Target className="w-4 h-4 text-white" />}
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl text-sm leading-relaxed",
                    msg.role === 'model' ? "bg-slate-900 border border-slate-800 text-slate-200" : "bg-blue-600 text-white"
                  )}>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
        </div>
      </main>

      {/* Hidden Canvas for Snapshots */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
