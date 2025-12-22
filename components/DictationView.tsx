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

// Extend Window interface for iOS bridge callbacks
declare global {
  interface Window {
    handleSpeechResult?: (result: { transcript: string; isFinal: boolean }) => void;
    handleSpeechStarted?: () => void;
    handleSpeechError?: (error: string) => void;
  }
}

export const DictationView: React.FC<DictationViewProps> = ({ onFinish, language }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [useNativeSpeech, setUseNativeSpeech] = useState(false);
  const transcriptBoxRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when transcript or interim changes
  useEffect(() => {
    if (transcriptBoxRef.current) {
      transcriptBoxRef.current.scrollTop = transcriptBoxRef.current.scrollHeight;
    }
  }, [transcript, interim]);

  const autoStartRef = useRef(false);

  useEffect(() => {
    // Check if running in iOS WKWebView with native speech support
    const hasNativeSpeech = !!((window as any).webkit?.messageHandlers?.speechHandler);
    setUseNativeSpeech(hasNativeSpeech);

    if (hasNativeSpeech) {
      console.log('✅ Using native iOS speech recognition');

      // Setup callbacks for native speech
      window.handleSpeechResult = (result: { transcript: string; isFinal: boolean }) => {
        console.log('🎤 Native speech result:', result);
        if (result.isFinal) {
          setTranscript(prev => prev + result.transcript);
          setInterim('');
        } else {
          setInterim(result.transcript);
        }
      };

      window.handleSpeechStarted = () => {
        console.log('✅ Native speech started');
        setIsListening(true);
      };

      window.handleSpeechError = (error: string) => {
        console.error('❌ Native speech error:', error);
        // Alert might be annoying on auto-start if permissions pending, but good for debugging
        // alert(`Speech recognition error: ${error}`); 
        setIsListening(false);
      };

      // Auto-start logic (Once per mount)
      if (!autoStartRef.current) {
        autoStartRef.current = true;
        const iosLanguage = language === 'en' ? 'en-US' : language === 'zh' ? 'zh-CN' : 'zh-CN';
        console.log('🚀 Auto-starting native speech...');

        // Increased delay to 1500ms to ensure iOS app is fully active and foregrounded
        setTimeout(() => {
          (window as any).webkit.messageHandlers.speechHandler.postMessage({
            action: 'start',
            language: iosLanguage
          });
        }, 1500);
      }

      return () => {
        delete window.handleSpeechResult;
        delete window.handleSpeechStarted;
        delete window.handleSpeechError;
      };
    } else {
      // Fallback to Web Speech API
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

        // Auto-start Web Speech
        if (!autoStartRef.current) {
          autoStartRef.current = true;
          console.log('🚀 Auto-starting web speech...');
          try {
            recognition.start();
            setIsListening(true);
          } catch (e) {
            console.error("Auto-start failed", e);
          }
        }
      }

      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      };
    }
  }, [language]);

  const toggleListening = () => {
    // Check if we should use native iOS speech
    if (useNativeSpeech) {
      const webkit = (window as any).webkit;
      if (webkit?.messageHandlers?.speechHandler) {
        if (isListening) {
          // Stop native speech recognition
          webkit.messageHandlers.speechHandler.postMessage({
            action: 'stop'
          });
          setIsListening(false);

          // Finish with current transcript
          setTimeout(() => {
            if (transcript || interim) {
              onFinish(transcript + interim);
            }
          }, 500);
        } else {
          // Start native speech recognition
          setTranscript('');
          setInterim('');

          // Map language to iOS locale
          const iosLanguage = language === 'en' ? 'en-US' : language === 'zh' ? 'zh-CN' : 'zh-CN';

          webkit.messageHandlers.speechHandler.postMessage({
            action: 'start',
            language: iosLanguage
          });

          console.log('🎤 Starting native iOS speech recognition');
        }
        return;
      }
    }

    // Fallback to Web Speech API
    if (!recognitionRef.current) {
      // Mock dictation for testing when Web Speech API is not available
      console.warn("⚠️ Web Speech API not available. Using mock dictation for testing.");

      if (isListening) {
        setIsListening(false);
        // Simulate finishing dictation
        setTimeout(() => {
          if (transcript || interim) {
            onFinish(transcript + interim);
          }
        }, 500);
      } else {
        // Mock dictation: simulate user speaking
        setTranscript('');
        setInterim('');
        setIsListening(true);

        // Simulate typing out text over time
        const mockText = "Hello this is a test of the smart words input method";
        let currentText = '';
        let index = 0;

        const interval = setInterval(() => {
          if (index < mockText.length) {
            currentText += mockText[index];
            setInterim(currentText);
            index++;
          } else {
            clearInterval(interval);
            setTranscript(currentText);
            setInterim('');
            setIsListening(false);
            // Auto-finish after mock dictation completes
            setTimeout(() => {
              onFinish(currentText);
            }, 500);
          }
        }, 50); // Type one character every 50ms
      }
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

      // Add error handling for start
      try {
        recognitionRef.current.start();
        setIsListening(true);
        console.log('✅ Speech recognition started');
      } catch (error) {
        console.error('❌ Failed to start speech recognition:', error);
        alert(`Failed to start microphone:\n${error}\n\nTry:\n1. Check microphone permissions in Settings\n2. Use HTTPS or localhost\n3. Test on iOS Simulator instead`);
      }
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

        <div
          ref={transcriptBoxRef}
          className="w-full max-h-64 overflow-y-auto text-2xl md:text-3xl font-medium text-center leading-relaxed transition-all px-4 py-2"
        >
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