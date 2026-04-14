import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useVoiceAssistant() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'ai' | 'user'; text: string }>>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef(window.speechSynthesis);
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

  const callAI = useCallback(async (userMessage: string, mode?: string, dashboardData?: string): Promise<string> => {
    conversationRef.current.push({ role: 'user', content: userMessage });
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { messages: conversationRef.current, mode, dashboardData },
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

  // Command 1: Punto della situazione - reads all dashboard data
  const puntoSituazione = useCallback(async () => {
    stopSpeaking();
    conversationRef.current = []; // Reset conversation
    const prompt = "Fammi il punto della situazione completo leggendo tutti i dati della dashboard.";
    setMessages([{ role: 'user', text: '📊 Punto della Situazione' }]);
    
    // Try to extract dashboard data from iframe
    let dashboardData = "";
    try {
      const iframe = document.querySelector('iframe') as HTMLIFrameElement;
      if (iframe?.contentDocument) {
        dashboardData = iframe.contentDocument.body.innerText || "";
      }
    } catch (e) {
      console.log("Cannot access iframe data (cross-origin)");
    }
    
    const reply = await callAI(prompt, 'punto_situazione', dashboardData);
    setMessages(prev => [...prev, { role: 'ai', text: reply }]);
    speak(reply);
  }, [callAI, speak, stopSpeaking]);

  // Command 2: Free conversation
  const conversazioneLibera = useCallback(async () => {
    stopSpeaking();
    conversationRef.current = []; // Reset conversation
    const prompt = "Inizia una conversazione con me.";
    setMessages([{ role: 'user', text: '💬 Conversazione Libera' }]);
    const reply = await callAI(prompt, 'conversazione');
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
    puntoSituazione, conversazioneLibera,
    startListening, stopListening, stopSpeaking,
    speak, sendTextMessage,
  };
}
