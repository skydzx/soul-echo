import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Settings, X, Mic, Play, Pause } from 'lucide-react';
import { ttsApi } from '@/services/api';

interface VoiceSettingsProps {
  characterGender: string;
  onClose: () => void;
}

interface Voice {
  id: string;
  name: string;
  gender: string;
  description: string;
  use_case?: string;
}

export default function VoiceSettings({ characterGender, onClose }: VoiceSettingsProps) {
  const [recommendedVoices, setRecommendedVoices] = useState<Voice[]>([]);
  const [allVoices, setAllVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [autoPlay, setAutoPlay] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewing, setPreviewing] = useState(false);
  const [previewAudio, setPreviewAudio] = useState<string | null>(null);

  // 预览文本
  const previewText = "你好呀！今天过得怎么样？有什么想和我聊的吗？";

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    setLoading(true);
    try {
      // 加载推荐语音
      const recommendedRes = await fetch('/api/tts/voices/recommended');
      const recommendedData = await recommendedRes.json();
      setRecommendedVoices(recommendedData.voices || []);

      // 加载所有语音
      const allRes = await fetch('/api/tts/voices');
      const allData = await allRes.json();
      setAllVoices(allData.voices || []);

      // 根据角色性别自动选择推荐语音
      const defaultVoice = recommendedData.voices?.find(
        (v: Voice) => v.gender === characterGender
      );
      if (defaultVoice) {
        setSelectedVoice(defaultVoice.id);
      }
    } catch (error) {
      console.error('加载语音列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (voiceId: string) => {
    if (previewing) {
      setPreviewing(false);
      setPreviewAudio(null);
      return;
    }

    setPreviewing(true);
    try {
      const response = await ttsApi.generate(previewText, characterGender);
      setPreviewAudio(response.audio_url);
    } catch (error) {
      console.error('预览失败:', error);
      setPreviewing(false);
    }
  };

  const handleSelectVoice = (voiceId: string) => {
    setSelectedVoice(voiceId);
    // 保存到本地存储
    localStorage.setItem('soulecho_voice', voiceId);
  };

  // 获取当前选中的语音信息
  const selectedVoiceInfo = allVoices.find(v => v.id === selectedVoice) ||
    recommendedVoices.find(v => v.id === selectedVoice);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-white">语音设置</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-4 overflow-y-auto max-h-96">
          {/* 自动播放开关 */}
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl mb-4">
            <div className="flex items-center gap-3">
              {autoPlay ? (
                <Volume2 className="w-5 h-5 text-primary-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="text-white font-medium">自动播放语音</p>
                <p className="text-gray-400 text-xs">AI 回复时自动播放语音</p>
              </div>
            </div>
            <button
              onClick={() => {
                setAutoPlay(!autoPlay);
                localStorage.setItem('soulecho_autoplay', String(!autoPlay));
              }}
              className={`w-12 h-6 rounded-full transition-colors ${
                autoPlay ? 'bg-primary-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  autoPlay ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* 推荐语音 */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">推荐语音</h3>
            <div className="space-y-2">
              {recommendedVoices.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => handleSelectVoice(voice.id)}
                  className={`w-full p-3 rounded-xl transition-all flex items-center gap-3 ${
                    selectedVoice === voice.id
                      ? 'bg-primary-500/20 border border-primary-500/50'
                      : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-pink-400 flex items-center justify-center text-white">
                    {voice.gender === '女性' ? '👩' : '👨'}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium">{voice.name}</p>
                    <p className="text-gray-400 text-xs">{voice.description}</p>
                  </div>
                  {selectedVoice === voice.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(voice.id);
                      }}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                      {previewing && previewAudio ? (
                        <Pause className="w-4 h-4 text-primary-400" />
                      ) : (
                        <Play className="w-4 h-4 text-primary-400" />
                      )}
                    </button>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 更多语音 */}
          {allVoices.length > recommendedVoices.length && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">更多语音</h3>
              <div className="grid grid-cols-2 gap-2">
                {allVoices.slice(0, 10).map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => handleSelectVoice(voice.id)}
                    className={`p-2 rounded-lg text-left transition-all ${
                      selectedVoice === voice.id
                        ? 'bg-primary-500/20 border border-primary-500/50'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <p className="text-white text-sm font-medium truncate">
                      {voice.name}
                    </p>
                    <p className="text-gray-500 text-xs truncate">
                      {voice.description || voice.id}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="p-4 border-t border-white/10">
          <p className="text-gray-400 text-xs text-center">
            当前选中: {selectedVoiceInfo?.name || '未选择'} ·
            使用 {characterGender} 角色
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
