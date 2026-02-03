import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { ttsApi } from '@/services/api';

interface AudioPlayerProps {
  text: string;
  gender: string;
  autoPlay?: boolean;
}

export default function AudioPlayer({ text, gender, autoPlay = false }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 初始化音频
    audioRef.current = new Audio();

    audioRef.current.onended = () => {
      setPlaying(false);
    };

    audioRef.current.onerror = () => {
      setPlaying(false);
      setLoading(false);
    };

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (autoPlay && text && gender) {
      playAudio();
    }
  }, [autoPlay]);

  const playAudio = async () => {
    if (!text || !gender) return;

    // 如果已经有音频URL且没播放过，直接播放
    if (audioUrl && !playing) {
      try {
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.volume = muted ? 0 : 1;
          await audioRef.current.play();
          setPlaying(true);
        }
      } catch {
        // 播放失败，尝试重新生成
        await generateAndPlay();
      }
      return;
    }

    await generateAndPlay();
  };

  const generateAndPlay = async () => {
    setLoading(true);
    try {
      const response = await ttsApi.generate(text, gender);
      setAudioUrl(response.audio_url);

      if (audioRef.current) {
        audioRef.current.src = response.audio_url;
        audioRef.current.volume = muted ? 0 : 1;
        await audioRef.current.play();
        setPlaying(true);
      }
    } catch (error) {
      console.error('语音生成失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
    } else {
      playAudio();
    }
  };

  const toggleMute = () => {
    setMuted(!muted);
    if (audioRef.current) {
      audioRef.current.volume = muted ? 1 : 0;
    }
  };

  if (loading) {
    return (
      <button
        className="p-2 rounded-full bg-primary-500/20 text-primary-400 animate-pulse"
        disabled
      >
        <Loader2 className="w-4 h-4 animate-spin" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={togglePlay}
        className={`p-2 rounded-full transition-all ${
          playing
            ? 'bg-primary-500/30 text-primary-400'
            : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
        }`}
        title={playing ? '暂停' : '播放语音'}
      >
        {playing ? (
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </button>

      {playing && (
        <button
          onClick={toggleMute}
          className="p-1 rounded-full bg-white/10 text-gray-400 hover:text-white"
        >
          {muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
        </button>
      )}
    </div>
  );
}
