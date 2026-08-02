'use client';

import { useState, useEffect } from 'react';
import { Volume2, Loader2, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { textToSpeech } from '@/ai/flows/text-to-speech';

interface TtsButtonProps {
  textToSpeak: string;
}

export function TtsButton({ textToSpeak }: TtsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  // Effect to clean up the audio object when the component unmounts
  // or the text to speak changes.
  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, [audio]);

  // Effect to reset when the text changes
  useEffect(() => {
      if (audio) {
          audio.pause();
          setAudio(null);
          setIsPlaying(false);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textToSpeak]);


  const handlePlayback = async () => {
    // If audio is already loaded, just play or pause it
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      return;
    }

    // If no audio is loaded, generate it
    setIsLoading(true);
    try {
      const response = await textToSpeech({ text: textToSpeak });
      const newAudio = new Audio(response.audioDataUri);
      
      newAudio.onplay = () => setIsPlaying(true);
      newAudio.onpause = () => setIsPlaying(false);
      newAudio.onended = () => {
        setIsPlaying(false);
        setAudio(null); // Reset for next time
      };

      setAudio(newAudio);
      newAudio.play();

    } catch (error) {
      console.error('TTS error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Не успяхме да преобразуваме текста в говор. Моля, опитайте отново.';
      let toastTitle = 'Грешка при генериране на говор';
      let toastDescription = 'Не успяхме да преобразуваме текста в говор. Моля, опитайте отново.';

      if (typeof errorMessage === 'string' && (errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota'))) {
          toastTitle = 'Квотата е надвишена';
          toastDescription = 'Надвишили сте безплатната си дневна квота за заявки. Моля, опитайте отново по-късно или проверете своя план.';
      }

      toast({
        variant: 'destructive',
        title: toastTitle,
        description: toastDescription,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={handlePlayback} disabled={isLoading} aria-label="Прочети на глас">
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isPlaying ? (
        <Pause className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </Button>
  );
}
