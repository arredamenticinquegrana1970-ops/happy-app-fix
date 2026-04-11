import { useState, useCallback, useRef, useEffect } from 'react';

const SECTION_INFO: Record<string, { title: string; speech: string }> = {
  'kpi': {
    title: 'KPI del Giorno',
    speech: `Ecco i KPI del giorno, Direttore. Il fatturato totale del gruppo è in linea con gli obiettivi mensili. Il margine medio si attesta intorno al 38%. La conversione media dei negozi è del 22%. I preventivi attivi sono 47. Vuole che approfondisca qualche dato specifico?`
  },
  'negozi': {
    title: 'Performance Negozi',
    speech: `Analizziamo i 9 showroom del gruppo. I negozi Scavolini stanno performando bene, con Ottaviano in testa. Sant'Arpino e Giugliano mostrano margini solidi. I punti Lube e Creo sono stabili. Febal Casa e Pensarecasa hanno margini leggermente inferiori ma con buona conversione. Vuole il dettaglio di un negozio specifico?`
  },
  'venditori': {
    title: 'Venditori & Ingressi',
    speech: `Passiamo ai venditori. La classifica è guidata dai top performer del gruppo Scavolini. Gli ingressi nei negozi questa settimana mostrano un trend in linea con la stagionalità. Il traffico è concentrato nel weekend, come previsto. La conversione media dal traffico alle vendite è del 22%. Vuole vedere la classifica per brand?`
  },
  'presenze': {
    title: 'Presenze, HR & Marginalità',
    speech: `Sul fronte HR, le presenze di oggi sono regolari. Il punteggio disciplinare mostra la maggior parte dei dipendenti in fascia ottima o attenzione. La marginalità del gruppo è al 38,2%, con i prodotti Scavolini che trainano il margine più alto. Devo approfondire qualche aspetto?`
  },
  'commissioni': {
    title: 'Commissioni Critiche',
    speech: `Attenzione alle commissioni critiche. Ci sono alcune giacenze con merce arrivata e saldo mancante da monitorare. Le commissioni con ritardo di consegna sono evidenziate in rosso. Consiglio di verificare le priorità con il magazzino. Vuole il dettaglio delle commissioni urgenti?`
  },
  'riepilogo': {
    title: 'Riepilogo & Customer Satisfaction',
    speech: `Il riepilogo complessivo mostra un gruppo in salute. La soddisfazione clienti è a 4,3 stelle su 5. Le recensioni Google sono positive. Le consegne rispettano le tempistiche nel 91% dei casi. I social media mostrano un engagement in crescita. Tutto sommato una situazione positiva, Direttore.`
  },
  'lead': {
    title: 'Lead & Agenzie',
    speech: `Il funnel lead mostra 127 lead attivi questo mese. La conversione da lead a preventivo è del 34%. Le agenzie immobiliari stanno generando il 18% dei nostri lead. Il confronto con il bimestre precedente mostra un miglioramento del 12%. Le azioni immediate suggerite sono: follow-up dei lead caldi e attivazione delle campagne stagionali.`
  },
  'mercato': {
    title: 'Mercato & Social Media',
    speech: `L'umore del mercato dell'arredamento in Campania è prudente ma stabile. L'inflazione resta un fattore di attenzione. I social media aziendali stanno performando bene, con Instagram in crescita. Le notizie di mercato indicano una leggera ripresa nel settore casa per il prossimo trimestre. Vuole un'analisi più approfondita?`
  },
  'strategia': {
    title: 'Strategia & Competitor',
    speech: `Nella sezione strategica abbiamo l'analisi dei 5 brand del gruppo, il posizionamento competitivo, la mappa dei competitor in Campania e le opportunità territoriali. Le priorità strategiche top 5 sono: presidio digitale, recensioni attive, rete professionisti, esperienza showroom e formazione venditori. Vuole che analizzi un aspetto specifico?`
  }
};

const WELCOME_MESSAGE = "Salve Direttore, cosa facciamo oggi? Vuole che faccia io una Sintesi Strategica, o vuole chiedermi qualcosa nello specifico?";

export function useVoiceAssistant() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'ai' | 'user'; text: string }>>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef(window.speechSynthesis);
  const hasGreeted = useRef(false);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'it-IT';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    
    // Try to find an Italian voice
    const voices = synthRef.current.getVoices();
    const italianVoice = voices.find((v: SpeechSynthesisVoice) => v.lang.startsWith('it'));
    if (italianVoice) utterance.voice = italianVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    synthRef.current.cancel();
    setIsSpeaking(false);
  }, []);

  const greet = useCallback(() => {
    if (hasGreeted.current) return;
    hasGreeted.current = true;
    setMessages([{ role: 'ai', text: WELCOME_MESSAGE }]);
    // Small delay to let voices load
    setTimeout(() => speak(WELCOME_MESSAGE), 500);
  }, [speak]);

  const narrateSection = useCallback((sectionKey: string) => {
    const info = SECTION_INFO[sectionKey];
    if (!info) return;
    
    stopSpeaking();
    setMessages(prev => [...prev, { role: 'ai', text: `📊 ${info.title}: ${info.speech}` }]);
    speak(info.speech);
  }, [speak, stopSpeaking]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Il riconoscimento vocale non è supportato dal tuo browser. Usa Chrome.' }]);
      return;
    }

    stopSpeaking();

    const recognition = new SpeechRecognition();
    recognition.lang = 'it-IT';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join('');
      setCurrentTranscript(transcript);
      
      if (event.results[0].isFinal) {
        setMessages(prev => [...prev, { role: 'user', text: transcript }]);
        setCurrentTranscript('');
        handleUserInput(transcript);
      }
    };
    recognition.onend = () => {
      setIsListening(false);
      setCurrentTranscript('');
    };
    recognition.onerror = () => {
      setIsListening(false);
      setCurrentTranscript('');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [stopSpeaking]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const handleUserInput = useCallback((text: string) => {
    const lower = text.toLowerCase();
    
    if (lower.includes('sintesi') || lower.includes('strategica') || lower.includes('riepilogo generale')) {
      const sintesi = "Ecco la sintesi strategica del giorno. Il fatturato del gruppo è in linea con gli obiettivi. I negozi performano bene, con Ottaviano in testa. I venditori top stanno superando i target. Le presenze sono regolari. Le commissioni critiche da monitorare sono 5. La soddisfazione clienti è alta a 4,3 stelle. Il mercato è prudente ma stabile. Le priorità sono: presidio digitale e crescita recensioni.";
      setMessages(prev => [...prev, { role: 'ai', text: sintesi }]);
      speak(sintesi);
    } else if (lower.includes('kpi') || lower.includes('fatturato')) {
      narrateSection('kpi');
    } else if (lower.includes('negoz') || lower.includes('showroom')) {
      narrateSection('negozi');
    } else if (lower.includes('vendit')) {
      narrateSection('venditori');
    } else if (lower.includes('presenz') || lower.includes('dipendent') || lower.includes('hr')) {
      narrateSection('presenze');
    } else if (lower.includes('commission') || lower.includes('giacenz') || lower.includes('critic')) {
      narrateSection('commissioni');
    } else if (lower.includes('soddisfaz') || lower.includes('recension') || lower.includes('customer')) {
      narrateSection('riepilogo');
    } else if (lower.includes('lead') || lower.includes('agenz')) {
      narrateSection('lead');
    } else if (lower.includes('mercat') || lower.includes('social') || lower.includes('competitor')) {
      narrateSection('mercato');
    } else if (lower.includes('strateg')) {
      narrateSection('strategia');
    } else if (lower.includes('stop') || lower.includes('basta') || lower.includes('silenzio')) {
      stopSpeaking();
      setMessages(prev => [...prev, { role: 'ai', text: 'Ok, resto in ascolto.' }]);
    } else {
      const response = `Ho capito, Direttore. Mi ha detto: "${text}". Posso aiutarla con i KPI, i negozi, i venditori, le presenze, le commissioni, il mercato o la strategia. Cosa preferisce?`;
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
      speak(response);
    }
  }, [narrateSection, speak, stopSpeaking]);

  const sendTextMessage = useCallback((text: string) => {
    setMessages(prev => [...prev, { role: 'user', text }]);
    handleUserInput(text);
  }, [handleUserInput]);

  // Load voices
  useEffect(() => {
    synthRef.current.getVoices();
    window.speechSynthesis.onvoiceschanged = () => synthRef.current.getVoices();
  }, []);

  return {
    isSpeaking,
    isListening,
    messages,
    currentTranscript,
    greet,
    narrateSection,
    startListening,
    stopListening,
    stopSpeaking,
    speak,
    sendTextMessage,
    SECTION_INFO
  };
}
