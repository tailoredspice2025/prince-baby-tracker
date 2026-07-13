import { useCallback, useRef, useState } from 'react';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';

/** Thin wrapper around expo-speech-recognition for the hold-to-speak flow:
 * start() begins listening with interim results streamed to onTranscript,
 * stop() ends listening and resolves with the final transcript. */
export function useVoiceRecognition(onTranscript: (text: string, isFinal: boolean) => void) {
  const [isListening, setIsListening] = useState(false);
  const finalTranscriptRef = useRef('');
  const resolverRef = useRef<((text: string) => void) | null>(null);

  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results?.[0]?.transcript ?? '';
    const isFinal = event.isFinal ?? false;
    if (isFinal) finalTranscriptRef.current = text;
    onTranscript(text, isFinal);
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    resolverRef.current?.(finalTranscriptRef.current);
    resolverRef.current = null;
  });

  useSpeechRecognitionEvent('error', () => {
    setIsListening(false);
    resolverRef.current?.(finalTranscriptRef.current);
    resolverRef.current = null;
  });

  const start = useCallback(async () => {
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) return false;
    finalTranscriptRef.current = '';
    setIsListening(true);
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: true,
    });
    return true;
  }, []);

  const stop = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      if (!isListening) {
        resolve(finalTranscriptRef.current);
        return;
      }
      resolverRef.current = resolve;
      ExpoSpeechRecognitionModule.stop();
    });
  }, [isListening]);

  return { start, stop, isListening };
}
