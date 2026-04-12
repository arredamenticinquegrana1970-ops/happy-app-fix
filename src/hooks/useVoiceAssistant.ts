import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SECTION_PROMPTS: Record<string, string> = {
  'kpi': 'Dimmi i KPI del giorno in dettaglio: fatturato, margine, conversione, preventivi attivi.',
  'negozi': 'Analizza la performance dei 9 showroom del gruppo. Chi è in testa? Chi deve migliorare?',
  'venditori': 'Dimmi la classifica venditori, gli ingressi nei negozi e la conversione dal traffico alle vendite.',
  'presenze': 'Parlami delle presenze HR, il punteggio disciplinare e la marginalità del gruppo.',
  'commissioni': 'Quali sono le commissioni critiche? Giacenze con merce arrivata e saldo mancante, ritardi di consegna.',
  'riepilogo': 'Fammi un riepilogo complessivo con customer satisfaction, recensioni, consegne e social media.',
  'lead': 'Analizza il funnel lead: quanti lead attivi, conversione da lead a preventivo, agenzie immobiliari, confronto bimestre.',
  'mercato': 'Come va il mercato dell\'arredamento in Campania? E i social media aziendali?',
  'strategia': 'Analisi strategica: i 5 brand del gruppo, posizionamento competitivo, competitor, opportunità territoriali, priorità top 5.',
};

const WELCOME_MESSAGE = "Salve Direttore, cosa facciamo oggi? Vuole che faccia io una Sintesi Strategica, o vuole chiedermi qualcosa nello specifico?";

export function useVoiceAssistant() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'ai' | 'user'; text: string }>>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef(window.speechSynthesis);
  const hasGreeted = useRef(false);
  const conversationRef = useRef<Array<{ role: string; content: string }>>([]);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'it-IT';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    const voices = synthRef.current.getVoices();
    const italianVoice = voices.find((v: SpeechSynthesisVoice) => v.lang.startsWith('it'));
    if (italianVoice) utterance.voice = italianVoice;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => { setIsSpeaking(false); onEnd?.(); };
    utterance.onerror = () => setIsSpeaking(false);
    synthRef.current.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    synthRef.current.cancel();
    setIsSpeaking(false);
  }, []);

  const callAI = useCallback(async (userMessage: string): Promise<string> => {
    conversationRef.current.push({ role: 'user', content: userMessage });
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { messages: conversationRef.current },
      });

      if (error) throw error;
      const reply = data?.reply || "Mi dispiace, non ho capito. Può ripetere?";
      conversationRef.current.push({ role: 'assistant', content: reply });
      return reply;
    } catch (e) {
      console.error('AI call error:', e);
      return "Mi dispiace, c'è stato un errore di connessione. Riprovi tra poco.";
    } finally {
      setIsLoading(false);
    }
  }, []);

  const greet = useCallback(() => {
    if (hasGreeted.current) return;
    hasGreeted.current = true;
    setMessages([{ role: 'ai', text: WELCOME_MESSAGE }]);
    setTimeout(() => speak(WELCOME_MESSAGE), 500);
  }, [speak]);

  const narrateSection = useCallback(async (sectionKey: string) => {
    const prompt = SECTION_PROMPTS[sectionKey];
    if (!prompt) return;
    stopSpeaking();
    setMessages(prev => [...prev, { role: 'user', text: prompt }]);
    const reply = await callAI(prompt);
    setMessages(prev => [...prev, { role: 'ai', text: reply }]);
    speak(reply);
  }, [callAI, speak, stopSpeaking]);

  const handleUserInput = useCallback(async (text: string) => {
    const reply = await callAI(text);
    setMessages(prev => [...prev, { role: 'ai', text: reply }]);
    speak(reply);
  }, [callAI, speak]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Il riconoscimento vocale non è supportato. Usa Chrome.' }]);
      return;
    }
    stopSpeaking();
    const recognition = new SpeechRecognition();
    recognition.lang = 'it-IT';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join('');
      setCurrentTranscript(transcript);
      if (event.results[0].isFinal) {
        setMessages(prev => [...prev, { role: 'user', text: transcript }]);
        setCurrentTranscript('');
        handleUserInput(transcript);
      }
    };
    recognition.onend = () => { setIsListening(false); setCurrentTranscript(''); };
    recognition.onerror = () => { setIsListening(false); setCurrentTranscript(''); };
    recognitionRef.current = recognition;
    recognition.start();
  }, [stopSpeaking, handleUserInput]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const sendTextMessage = useCallback((text: string) => {
    setMessages(prev => [...prev, { role: 'user', text }]);
    handleUserInput(text);
  }, [handleUserInput]);

  useEffect(() => {
    synthRef.current.getVoices();
    window.speechSynthesis.onvoiceschanged = () => synthRef.current.getVoices();
  }, []);

  return {
    isSpeaking, isListening, isLoading, messages, currentTranscript,
    greet, narrateSection, startListening, stopListening, stopSpeaking,
    speak, sendTextMessage,
  };
}
