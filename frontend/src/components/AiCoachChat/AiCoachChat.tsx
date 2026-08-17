import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { ChatMessage } from '../../types';
import { GeminiService } from '../../services/geminiService';

const SUGGESTED_PROMPTS = [
  'Làm sao để squat sâu mà không bị đau đầu gối?',
  'Tư thế hít đất chuẩn nhất để phát triển cơ ngực?',
  'Mẹo giữ Plank trên 1 phút mà không bị võng lưng?',
  'Nên hít thở như thế nào khi tập gym để không bị hụt hơi?',
  'Gợi ý lịch tập thể hình 4 buổi/tuần cho người mới'
];

export const AiCoachChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Xin chào! Tôi là **HLV AI Gemini** của bạn.\n\nTôi có thể giải đáp mọi thắc mắc về kỹ thuật sinh cơ học (biomechanics), chỉnh sửa tư thế tập, chế độ dinh dưỡng tăng cơ giảm mỡ, hoặc thiết kế lịch tập phù hợp cho bạn. Hôm nay bạn cần hỗ trợ gì?',
      timestamp: Date.now()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const reply = await GeminiService.chatWithCoach(messages, text);
      const aiMsg: ChatMessage = {
        id: 'ai_' + Date.now(),
        sender: 'ai',
        text: reply,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.warn('Chat error:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome_reset',
        sender: 'ai',
        text: 'Cuộc trò chuyện đã được làm mới. HLV AI Gemini sẵn sàng hỗ trợ buổi tập tiếp theo của bạn!',
        timestamp: Date.now()
      }
    ]);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 sm:p-6 backdrop-blur-md shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#eab308] to-[#ca8a04] text-[#1c1917] shadow-md shadow-[#eab308]/25">
            <Bot className="h-6 w-6 stroke-[2.5]" />
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0d9488] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#0d9488]"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-heading text-2xl font-bold text-[var(--text-primary)]">
                Huấn Luyện Viên AI Gemini
              </h2>
              <span className="rounded-full bg-[#eab308]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#ca8a04] dark:text-[#eab308] border border-[#eab308]/30">
                PRO COACH
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Kỹ thuật sinh cơ học, phục hồi &amp; dinh dưỡng thể hình
            </p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="flex items-center space-x-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-inset)] px-4 py-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          title="Làm mới cuộc trò chuyện"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Làm mới</span>
        </button>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-bold text-[#ca8a04] dark:text-[#eab308] flex-shrink-0 flex items-center space-x-1">
          <Sparkles className="h-4 w-4" />
          <span>Gợi ý:</span>
        </span>
        {SUGGESTED_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            className="flex-shrink-0 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-1.5 text-xs text-[var(--text-secondary)] hover:border-[#eab308]/60 hover:text-[#ca8a04] dark:hover:text-[#eab308] transition-all cursor-pointer shadow-xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Log */}
      <div className="h-[480px] overflow-y-auto rounded-3xl border border-[var(--border-card)] bg-[var(--bg-surface-inset)] p-5 sm:p-6 space-y-4 shadow-inner">
        {messages.map(msg => {
          const isAi = msg.sender === 'ai';
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${
                isAi ? 'justify-start' : 'justify-end'
              }`}
            >
              {isAi && (
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-[#eab308]/20 border border-[#eab308]/30 text-[#ca8a04] dark:text-[#eab308]">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                  isAi
                    ? 'border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)]'
                    : 'btn-kinpaku text-[#1c1917] font-semibold'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <span
                  className={`mt-2 block text-[10px] font-mono ${
                    isAi ? 'text-[var(--text-muted)]' : 'text-[#584407]'
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              {!isAi && (
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eab308]/20 text-[#ca8a04] dark:text-[#eab308]">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center space-x-1.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-xs text-[var(--text-muted)]">
              <div className="h-2 w-2 animate-bounce rounded-full bg-[#eab308]" />
              <div className="h-2 w-2 animate-bounce rounded-full bg-[#eab308] [animation-delay:0.2s]" />
              <div className="h-2 w-2 animate-bounce rounded-full bg-[#eab308] [animation-delay:0.4s]" />
              <span className="ml-2 text-xs">HLV AI Gemini đang soạn phản hồi...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex items-center space-x-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-2.5 shadow-md"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={e => setInputMessage(e.target.value)}
          placeholder="Hỏi HLV AI về kỹ thuật squat, plank, nhịp thở, thực đơn..."
          className="flex-1 bg-transparent px-4 py-2 text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isTyping}
          className="btn-kinpaku flex h-10 w-10 items-center justify-center disabled:opacity-30 cursor-pointer"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
