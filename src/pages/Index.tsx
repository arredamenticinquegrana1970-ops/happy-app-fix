import { useState } from 'react';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import { VoiceAssistant } from '@/components/VoiceAssistant';
import { DataSourcesManager } from '@/components/DataSourcesManager';
import { Settings } from 'lucide-react';

const Index = () => {
  const {
    isSpeaking,
    isListening,
    isLoading,
    messages,
    currentTranscript,
    puntoSituazione,
    conversazioneLibera,
    startListening,
    stopListening,
    stopSpeaking,
    sendTextMessage,
  } = useVoiceAssistant();

  const [showDataSources, setShowDataSources] = useState(false);
  const [started, setStarted] = useState(false);

  const handleCommand = (cmd: 'punto' | 'parla') => {
    setStarted(true);
    if (cmd === 'punto') puntoSituazione();
    else conversazioneLibera();
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      {/* Top bar with commands */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ background: '#1e3a8a' }}>
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>
            🏢 ArredoCloud Dashboard CEO
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCommand('punto')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all hover:scale-105"
            style={{ background: '#fff', color: '#1e3a8a' }}
          >
            📊 Punto della Situazione
          </button>
          <button
            onClick={() => handleCommand('parla')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all hover:scale-105"
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
          >
            💬 Parla con l'AI
          </button>
          <button
            onClick={() => setShowDataSources(true)}
            className="p-2 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            title="Gestione Fonti Dati"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dashboard iframe */}
      <div className="flex-1 relative">
        <iframe
          src="/dashboard.html"
          className="w-full h-full border-none"
          title="Dashboard CEO"
        />
      </div>

      {/* Voice Assistant overlay - only shows after a command is pressed */}
      {started && (
        <VoiceAssistant
          isSpeaking={isSpeaking}
          isListening={isListening}
          isLoading={isLoading}
          messages={messages}
          currentTranscript={currentTranscript}
          onStartListening={startListening}
          onStopListening={stopListening}
          onStopSpeaking={stopSpeaking}
          onSendMessage={sendTextMessage}
        />
      )}

      {/* Data Sources Manager */}
      <DataSourcesManager isOpen={showDataSources} onClose={() => setShowDataSources(false)} />
    </div>
  );
};

export default Index;
