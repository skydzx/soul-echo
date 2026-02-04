export interface Character {
  id: string;
  name: string;
  gender: string;
  age: number;
  appearance: string;
  personality: {
    性格: string;
    说话风格: string;
    情绪: string;
    兴趣: string[];
  };
  hobbies: string[];
  background: string;
  relationship_type: string;
  created_at: string;
  avatar?: string;
  chat_history?: ChatMessage[];
  memories?: Memory[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  images?: string[];  // 图片/表情包列表
}

export interface Memory {
  content: string;
  timestamp: string;
}

export interface CreateCharacterRequest {
  name: string;
  gender: string;
  age: number;
  appearance: string;
  personality: {
    性格: string;
    说话风格: string;
    情绪: string;
    兴趣: string[];
  };
  hobbies: string[];
  background: string;
  relationship_type: string;
  preferences?: string; // 理想型描述
}

export interface ChatRequest {
  character_id: string;
  message: string;
  stream?: boolean;
}

export interface ChatResponse {
  character_id: string;
  response: string;
  timestamp: string;
}
