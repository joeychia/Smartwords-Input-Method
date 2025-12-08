import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Globe, Loader2 } from 'lucide-react';

// Add missing Web Speech API type definitions
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface DictationViewProps {
  onFinish: (transcript: string) => void;
  language: 'mixed' | 'en' | 'zh';
}

export const DictationView: React.FC<DictationViewProps> = ({ onFinish, language }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Setup Web Speech API (Simulation of SFSpeechRecognizer)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      // Heuristic mapping for language
      recognition.lang = language === 'en' ? 'en-US' : language === 'zh' ? 'zh-CN' : 'zh-CN'; 

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTrans = '';
        let interimTrans = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript;
          } else {
            interimTrans += event.results[i][0].transcript;
          }
        }

        if (finalTrans) {
          setTranscript(prev => prev + finalTrans);
        }
        setInterim(interimTrans);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Browser does not support Speech Recognition.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      // Small delay to ensure final results are captured before finishing
      setTimeout(() => {
        if (transcript || interim) {
          onFinish(transcript + interim);
        }
      }, 500);
    } else {
      setTranscript('');
      setInterim('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8">
      
      {/* Dynamic Text Area */}
      <div className="flex-1 w-full flex flex-col items-center justify-center min-h-[200px] mb-8 relative">
        {transcript === '' && interim === '' && !isListening && (
          <div className="text-gray-400 text-center animate-pulse">
            <p className="text-xl font-medium">Tap mic to speak</p>
            <p className="text-sm mt-2">I will refine your text instantly</p>
          </div>
        )}
        
        <div className="w-full text-2xl md:text-3xl font-medium text-center leading-relaxed transition-all">
          <span className="text-slate-800">{transcript}</span>
          <span className="text-slate-400">{interim}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full flex flex-col items-center space-y-8 mb-12">
        
        {/* Language Badge */}
        <div className="flex items-center space-x-2 px-4 py-1.5 bg-gray-200 rounded-full text-xs font-semibold text-gray-600 uppercase tracking-wide">
          <Globe size={12} />
          <span>{language === 'mixed' ? 'ZH/EN Mixed' : language}</span>
        </div>

        {/* Big Mic Button */}
        <button
          onClick={toggleListening}
          className={`
            relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 shadow-xl
            ${isListening 
              ? 'bg-red-500 shadow-red-500/40 scale-110' 
              : 'bg-indigo-600 shadow-indigo-600/40 hover:scale-105 active:scale-95'}
          `}
        >
          {isListening && (
            <span className="absolute w-full h-full rounded-full bg-red-500 opacity-30 animate-ping"></span>
          )}
          
          {isListening ? (
             <div className="w-8 h-8 rounded bg-white" /> // Stop square
          ) : (
            <Mic size={40} className="text-white" />
          )}
        </button>

        <p className="text-sm text-gray-500 font-medium h-6">
          {isListening ? "Listening..." : "Ready"}
        </p>

      </div>
    </div>
  );
};