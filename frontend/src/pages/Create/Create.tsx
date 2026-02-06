import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Heart, Wand2, RefreshCw, Upload, X, User } from 'lucide-react';
import { useCharacterStore } from '@/stores/characterStore';
import { useAuthStore } from '@/stores/authStore';
import { generateApi, avatarApi } from '@/services/api';
import Button from '@/components/ui/Button';

const PERSONALITY_OPTIONS = {
  性格: ['温柔体贴', '活泼开朗', '成熟稳重', '可爱俏皮', '独立自主', '内敛文静'],
  说话风格: ['温柔型', '直爽型', '幽默型', '文艺型', '霸气型'],
  情绪: ['丰富多变', '温和稳定', '偶尔小脾气'],
  兴趣: ['音乐', '阅读', '运动', '美食', '旅行', '电影', '游戏', '艺术', '科技', '摄影', '绘画', '写作'],
};

const RELATIONSHIP_OPTIONS = ['普通朋友', '知己', '暧昧对象', '恋人', '灵魂伴侣'];

export default function Create() {
  const navigate = useNavigate();
  const { createCharacter, loading } = useCharacterStore();
  const { isAuthenticated, token } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 登录保护
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState<'name' | 'appearance' | null>(null);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [nameSuggestions, setNameSuggestions] = useState<{ name: string; reason: string }[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    gender: '女性',
    age: 22,
    appearance: '',
    avatar: null as File | null,
    avatarPreview: null as string | null,
    personality: {
      性格: '温柔体贴',
      说话风格: '温柔型',
      情绪: '丰富多变',
      兴趣: [],
    },
    hobbies: [],
    background: '',
    relationship_type: '朋友',
    preferences: '', // 理想型描述
  });

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...(prev as any)[parent],
            [child]: value,
          },
        };
      }
      return { ...prev, [field]: value };
    });
  };

  // 表单验证
  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.name.trim()) {
        newErrors.name = '请输入角色姓名';
      } else if (formData.name.trim().length < 2) {
        newErrors.name = '姓名至少2个字符';
      } else if (!/^[\u4e00-\u9fa5a-zA-Z0-9]+$/.test(formData.name.trim())) {
        newErrors.name = '姓名只能包含中文、英文字母和数字';
      }
    }

    if (currentStep === 3) {
      if (!formData.background.trim()) {
        newErrors.background = '请填写背景故事';
      } else if (formData.background.trim().length < 10) {
        newErrors.background = '背景故事至少需要10个字符';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 头像上传
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors({ ...errors, avatar: '请选择 JPG、PNG、GIF 或 WebP 格式的图片' });
      return;
    }

    // 验证文件大小 (最大 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrors({ ...errors, avatar: '图片大小不能超过 2MB' });
      return;
    }

    // 创建预览
    const reader = new FileReader();
    reader.onload = () => {
      setFormData({
        ...formData,
        avatar: file,
        avatarPreview: reader.result as string,
      });
      // 清除错误
      const { avatar, ...rest } = errors;
      setErrors(rest);
    };
    reader.readAsDataURL(file);
  };

  // 移除头像
  const removeAvatar = () => {
    setFormData({
      ...formData,
      avatar: null,
      avatarPreview: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(3)) return;

    try {
      // 如果有头像，先上传头像再创建角色
      let avatarUrl = '';
      if (formData.avatar && token) {
        setUploadingAvatar(true);
        try {
          const avatarData = await avatarApi.uploadWithToken(formData.avatar, token);
          avatarUrl = avatarData.url;
        } catch (uploadError) {
          console.error('头像上传失败:', uploadError);
          // 继续创建角色，不强制要求头像
        } finally {
          setUploadingAvatar(false);
        }
      }

      const characterData = {
        name: formData.name,
        gender: formData.gender,
        age: formData.age,
        appearance: formData.appearance,
        avatar: avatarUrl,
        personality: formData.personality,
        hobbies: formData.hobbies,
        background: formData.background,
        relationship_type: formData.relationship_type,
        preferences: formData.preferences,
      };

      const character = await createCharacter(characterData);
      navigate(`/chat/${character.id}`);
    } catch (error) {
      console.error('创建失败:', error);
      setErrors({ ...errors, submit: '创建失败，请稍后重试' });
    }
  };

  // AI 生成名字
  const handleGenerateName = async () => {
    setGenerating('name');
    try {
      const response = await generateApi.generateName({
        gender: formData.gender,
        relationship_type: formData.relationship_type,
        preferences: formData.preferences || formData.background || '',
      });
      setNameSuggestions(
        response.names.map((name, index) => ({
          name,
          reason: response.reasons[index] || '',
        }))
      );
      setShowNameSuggestions(true);
    } catch (error) {
      console.error('生成名字失败:', error);
    } finally {
      setGenerating(null);
    }
  };

  // 选择生成的名字
  const selectGeneratedName = (name: string) => {
    setFormData({ ...formData, name });
    setShowNameSuggestions(false);
  };

  // AI 生成外貌特征
  const handleGenerateAppearance = async () => {
    setGenerating('appearance');
    try {
      const response = await generateApi.generateAppearance({
        gender: formData.gender,
        relationship_type: formData.relationship_type,
        preferences: formData.preferences || formData.personality.性格,
      });
      setFormData({ ...formData, appearance: response.appearance });
    } catch (error) {
      console.error('生成外貌失败:', error);
    } finally {
      setGenerating(null);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">基本信息</h2>
        <p className="text-gray-400">给你的伴侣起个名字吧</p>
      </div>

      <div className="space-y-4">
        {/* 头像上传 */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            {formData.avatarPreview ? (
              <div className="relative">
                <img
                  src={formData.avatarPreview}
                  alt="角色头像"
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary-500/30"
                />
                <button
                  onClick={removeAvatar}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-full border-4 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-white/5 transition-all group"
              >
                <Upload className="w-8 h-8 text-gray-400 group-hover:text-primary-400 transition-colors" />
                <span className="text-xs text-gray-400 mt-1 group-hover:text-primary-400">上传头像</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          {errors.avatar && (
            <p className="text-red-400 text-xs mt-2">{errors.avatar}</p>
          )}
          <p className="text-gray-500 text-xs mt-2">支持 JPG、PNG、GIF，最大 2MB</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">姓名 <span className="text-red-400">*</span></label>
          <div className="relative">
            <input
              type="text"
              placeholder="给她/他起个名字"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) {
                  const { name, ...rest } = errors;
                  setErrors(rest);
                }
              }}
              className={`w-full pr-24 ${errors.name ? 'border-red-500 focus:border-red-500' : ''}`}
            />
            <button
              type="button"
              onClick={handleGenerateName}
              disabled={generating === 'name'}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gradient-to-r from-primary-500 to-pink-500 rounded-lg text-white text-sm font-medium hover:shadow-lg transition-all flex items-center gap-1 disabled:opacity-50"
            >
              {generating === 'name' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5" />
              )}
              AI推荐
            </button>
          </div>
          {errors.name && (
            <p className="text-red-400 text-xs mt-1">{errors.name}</p>
          )}

          {/* AI 名字建议弹窗 */}
          <AnimatePresence>
            {showNameSuggestions && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-10 mt-2 w-full glass rounded-xl p-4 shadow-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-300">AI 推荐名字</span>
                  <button
                    onClick={() => setShowNameSuggestions(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {nameSuggestions.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => selectGeneratedName(item.name)}
                      className="w-full p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{item.name}</span>
                        <Sparkles className="w-3.5 h-3.5 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-gray-400 text-xs mt-1">{item.reason}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">性别</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full"
            >
              <option value="女性">女性</option>
              <option value="男性">男性</option>
              <option value="其他">其他</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">年龄</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="18"
                max="60"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="text-white font-medium w-12">{formData.age}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">外貌特征</label>
          <div className="relative">
            <textarea
              placeholder="例如：长发飘飘，眼睛很大，喜欢穿裙子..."
              value={formData.appearance}
              onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
              className="w-full h-24 resize-none pr-24"
            />
            <button
              type="button"
              onClick={handleGenerateAppearance}
              disabled={generating === 'appearance'}
              className="absolute bottom-3 right-3 px-3 py-1.5 bg-gradient-to-r from-primary-500 to-pink-500 rounded-lg text-white text-sm font-medium hover:shadow-lg transition-all flex items-center gap-1 disabled:opacity-50"
            >
              {generating === 'appearance' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5" />
              )}
              AI生成
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">性格特点</h2>
        <p className="text-gray-400">让她/他变得更真实</p>
      </div>

      <div className="space-y-4">
        {['性格', '说话风格', '情绪'].map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-300 mb-2">{field}</label>
            <div className="flex flex-wrap gap-2">
              {PERSONALITY_OPTIONS[field as keyof typeof PERSONALITY_OPTIONS].map((option) => (
                <button
                  key={option}
                  onClick={() => updateFormData(`personality.${field}`, option)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    formData.personality[field as keyof typeof formData.personality] === option
                      ? 'bg-primary-500 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">兴趣爱好</label>
          <div className="flex flex-wrap gap-2">
            {PERSONALITY_OPTIONS.兴趣.map((option) => (
              <button
                key={option}
                onClick={() => {
                  const newHobbies = formData.hobbies.includes(option)
                    ? formData.hobbies.filter((h) => h !== option)
                    : [...formData.hobbies, option];
                  setFormData({ ...formData, hobbies: newHobbies });
                }}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  formData.hobbies.includes(option)
                    ? 'bg-pink-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">背景与关系</h2>
        <p className="text-gray-400">设定你们的故事</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">背景故事</label>
          <textarea
            placeholder="她/他的成长经历、生活环境..."
            value={formData.background}
            onChange={(e) => setFormData({ ...formData, background: e.target.value })}
            className="w-full h-24 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Sparkles className="w-4 h-4 inline mr-1 text-primary-400" />
            理想型描述（可选）
          </label>
          <textarea
            placeholder="描述你喜欢的类型，例如：喜欢短发的可爱女生，笑起来有酒窝..."
            value={formData.preferences}
            onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
            className="w-full h-20 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">AI 会根据这个描述为你生成更适合的名字和外貌</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">你们的关系</label>
          <div className="flex flex-wrap gap-2">
            {RELATIONSHIP_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => setFormData({ ...formData, relationship_type: option })}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  formData.relationship_type === option
                    ? 'bg-gradient-to-r from-primary-500 to-pink-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* 预览 */}
        <div className="glass rounded-xl p-4 mt-6">
          <h4 className="text-sm font-medium text-gray-400 mb-3">角色预览</h4>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-pink-400 rounded-xl flex items-center justify-center text-2xl">
              {formData.gender === '女性' ? '👩' : '👨'}
            </div>
            <div>
              <p className="text-white font-medium">{formData.name || '未命名'}</p>
              <p className="text-gray-400 text-sm">
                {formData.personality.性格} · {formData.relationship_type}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* 返回按钮 */}
        <button
          onClick={() => (step === 1 ? navigate('/') : setStep(step - 1))}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{step === 1 ? '返回首页' : '上一步'}</span>
        </button>

        {/* 进度指示 */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                s <= step
                  ? 'bg-gradient-to-r from-primary-500 to-pink-500 text-white'
                  : 'bg-white/10 text-gray-500'
              }`}
            >
              {s}
            </div>
          ))}
        </div>

        {/* 表单内容 */}
        <div className="glass rounded-2xl p-6 md:p-8">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {/* 底部按钮 */}
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm text-center">{errors.submit}</p>
            </div>
          )}
          <div className="flex gap-4 mt-8">
            {step < 3 ? (
              <Button
                onClick={() => {
                  if (validateStep(step)) {
                    setStep(step + 1);
                  }
                }}
                className="flex-1"
              >
                下一步
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                loading={loading || uploadingAvatar}
                className="flex-1"
                disabled={!formData.name.trim() || uploadingAvatar}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {uploadingAvatar ? '上传头像中...' : '创建角色'}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
