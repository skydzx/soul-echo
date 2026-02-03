import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Heart } from 'lucide-react';
import { useCharacterStore } from '@/stores/characterStore';
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

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    gender: '女性',
    age: 22,
    appearance: '',
    personality: {
      性格: '温柔体贴',
      说话风格: '温柔型',
      情绪: '丰富多变',
      兴趣: [],
    },
    hobbies: [],
    background: '',
    relationship_type: '朋友',
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

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    try {
      const character = await createCharacter(formData);
      navigate(`/chat/${character.id}`);
    } catch (error) {
      console.error('创建失败:', error);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">基本信息</h2>
        <p className="text-gray-400">给你的伴侣起个名字吧</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">姓名</label>
          <input
            type="text"
            placeholder="给她/他起个名字"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full"
          />
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
          <textarea
            placeholder="例如：长发飘飘，眼睛很大，喜欢穿裙子..."
            value={formData.appearance}
            onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
            className="w-full h-24 resize-none"
          />
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
          <div className="flex gap-4 mt-8">
            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                className="flex-1"
                disabled={step === 1 && !formData.name.trim()}
              >
                下一步
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                loading={loading}
                className="flex-1"
                disabled={!formData.name.trim()}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                创建角色
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
