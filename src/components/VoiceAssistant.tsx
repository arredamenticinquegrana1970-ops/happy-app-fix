import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Send, MessageCircle, X, ChevronDown } from 'lucide-react';

interface VoiceAssistantProps {
  isSpeaking: boolean;
  isListening: boolean;
  isLoading?: boolean;
  messages: Array<{ role: 'ai' | 'user'; text: string }>;
  currentTranscript: string;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  onSendMessage: (text: string) => void;
}

export function VoiceAssistant({
  isSpeaking,
  isListening,
  isLoading,
  messages,
  currentTranscript,
  onStartListening,
  onStopListening,
  onStopSpeaking,
  onSendMessage,
}: VoiceAssistantProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentTranscript]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
        style={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)' }}
      >
        <MessageCircle className="w-6 h-6 text-white" />
        {isSpeaking && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 animate-pulse" />
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 w-[380px] max-h-[70vh] flex flex-col shadow-2xl rounded-tl-2xl overflow-hidden"
      style={{ background: '#fff', borderTop: '3px solid #1e3a8a', borderLeft: '1px solid rgba(0,0,0,0.1)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: '#1e3a8a' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
            AI
          </div>
          <div>
            <div className="text-white font-bold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>
              Assistente CEO
            </div>
            <div className="text-blue-200 text-xs flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-green-400 animate-pulse' : isListening ? 'bg-red-400 animate-pulse' : 'bg-blue-300'}`} />
              {isSpeaking ? 'Sto parlando...' : isListening ? 'In ascolto...' : 'Pronto'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isSpeaking && (
            <button onClick={onStopSpeaking} className="p-1.5 rounded-lg hover:bg-white/20 text-white" title="Ferma">
              <VolumeX className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-white/20 text-white">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[400px]" style={{ background: '#f8f9fb' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'text-white'
                  : 'border'
              }`}
              style={msg.role === 'user' 
                ? { background: '#1e3a8a' }
                : { background: '#fff', borderColor: 'rgba(0,0,0,0.08)' }
              }
            >
              {msg.text}
            </div>
          </div>
        ))}
        {currentTranscript && (
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed text-white/70 italic"
              style={{ background: '#1e3a8a80' }}>
              {currentTranscript}...
            </div>
          </div>
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm border flex items-center gap-2"
              style={{ background: '#fff', borderColor: 'rgba(0,0,0,0.08)' }}>
              <span className="animate-pulse">🤔</span> Sto pensando...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Voice waveform indicator */}
      {(isSpeaking || isListening) && (
        <div className="flex items-center justify-center gap-1 py-2" style={{ background: isSpeaking ? '#eff6ff' : '#fef2f2' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-1 rounded-full animate-pulse" 
              style={{ 
                height: `${12 + Math.random() * 16}px`,
                background: isSpeaking ? '#1e3a8a' : '#dc2626',
                animationDelay: `${i * 0.1}s`
              }} />
          ))}
          <span className="ml-2 text-xs font-medium" style={{ color: isSpeaking ? '#1e3a8a' : '#dc2626' }}>
            {isSpeaking ? '🔊 Parlo...' : '🎤 Ascolto...'}
          </span>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 p-3 border-t" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
        <button
          onClick={isListening ? onStopListening : onStartListening}
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
            isListening ? 'animate-pulse' : 'hover:scale-105'
          }`}
          style={{ 
            background: isListening ? '#fee2e2' : '#f3f4f6',
            border: `1px solid ${isListening ? '#dc2626' : 'rgba(0,0,0,0.1)'}`,
            color: isListening ? '#dc2626' : '#6b7280'
          }}
          title={isListening ? 'Ferma ascolto' : 'Parla'}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Scrivi un messaggio..."
          className="flex-1 bg-gray-50 border rounded-full px-4 py-2.5 text-sm outline-none focus:border-blue-400"
          style={{ borderColor: 'rgba(0,0,0,0.1)' }}
        />
        <button
          onClick={handleSend}
          disabled={!inputText.trim()}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white transition-opacity disabled:opacity-40"
          style={{ background: '#1e3a8a' }}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
