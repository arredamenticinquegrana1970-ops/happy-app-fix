import { useEffect, useState, useRef } from 'react';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import { VoiceAssistant } from '@/components/VoiceAssistant';
import { DashboardTabs } from '@/components/DashboardTabs';

const Index = () => {
  const {
    isSpeaking,
    isListening,
    isLoading,
    messages,
    currentTranscript,
    greet,
    narrateSection,
    startListening,
    stopListening,
    stopSpeaking,
    sendTextMessage,
  } = useVoiceAssistant();

  const [activeTab, setActiveTab] = useState<string | null>(null);
  const hasGreeted = useRef(false);

  useEffect(() => {
    if (!hasGreeted.current) {
      hasGreeted.current = true;
      // Small delay for page to load
      setTimeout(() => greet(), 1000);
    }
  }, [greet]);

  const handleTabClick = (key: string) => {
    setActiveTab(key);
    narrateSection(key);
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      {/* Tab bar */}
      <DashboardTabs onTabClick={handleTabClick} activeTab={activeTab} />

      {/* Dashboard iframe */}
      <div className="flex-1 relative">
        <iframe
          src="/dashboard.html"
          className="w-full h-full border-none"
          title="Dashboard CEO"
        />
      </div>

      {/* Voice Assistant overlay */}
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
    </div>
  );
};

export default Index;
