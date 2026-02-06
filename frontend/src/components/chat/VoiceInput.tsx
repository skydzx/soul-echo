import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';

interface VoiceInputProps {
  onRecordingComplete: (blob: Blob) => void;
  onCancel: () => void;
}

export default function VoiceInput({ onRecordingComplete, onCancel }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // 开始计时
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('无法访问麦克风:', error);
      alert('无法访问麦克风，请检查权限设置');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      setLoading(true);
      // 将 webm 转换为 wav 或直接使用
      onRecordingComplete(audioBlob);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-2 bg-white/10 rounded-xl">
        <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
        <span className="text-gray-300 text-sm">处理中...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isRecording ? (
        <>
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/20 rounded-xl">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-sm font-medium">
              {formatTime(recordingTime)}
            </span>
          </div>
          <button
            onClick={stopRecording}
            className="p-3 bg-red-500 rounded-xl text-white hover:bg-red-600 transition-colors"
          >
            <Square className="w-5 h-5" />
          </button>
        </>
      ) : (
        <>
          {audioBlob ? (
            <>
              <button
                onClick={() => {
                  setAudioBlob(null);
                  setRecordingTime(0);
                }}
                className="p-2 text-gray-400 hover:text-white"
              >
                <Square className="w-5 h-5" />
              </button>
              <span className="text-gray-300 text-sm">
                {formatTime(recordingTime)}
              </span>
              <button
                onClick={handleSend}
                className="p-3 bg-gradient-to-r from-primary-500 to-pink-500 rounded-xl text-white hover:shadow-lg transition-all"
              >
                <Mic className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={startRecording}
              className="p-3 bg-white/10 rounded-xl text-gray-400 hover:bg-white/20 hover:text-white transition-all"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </>
      )}

      <button
        onClick={onCancel}
        className="p-2 text-gray-400 hover:text-white"
      >
        <span className="text-xl">×</span>
      </button>
    </div>
  );
}
