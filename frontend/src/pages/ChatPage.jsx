import { useState, useEffect, useRef, useContext } from 'react';
import {
  Bot,
  ChevronDown,
  ChevronUp,
  Copy,
  GraduationCap,
  Lock,
  Mic,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../lib/api';

const suggestedQuestions = [
  'UIT có những ngành nào?',
  'Học phí UIT khoảng bao nhiêu?',
  'Ngành Khoa học máy tính xét tuyển tổ hợp nào?',
  'Thông tin tuyển sinh UIT mới nhất là gì?',
];

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const getChatErrorMessage = (error) => {
  const detail = error.response?.data?.detail;

  if (error.response?.status === 500) {
    return 'Chatbot chưa sẵn sàng vì dữ liệu tri thức chưa được chuẩn bị. Vui lòng chạy prepare/ingest dữ liệu.';
  }

  if (typeof detail === 'string') {
    return detail;
  }

  if (!error.response) {
    return 'Không thể kết nối backend. Vui lòng kiểm tra server API đang chạy.';
  }

  return 'Xin lỗi, hệ thống máy chủ hiện không phản hồi.';
};

const ChatPage = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [greetingInfo, setGreetingInfo] = useState({ text: 'buổi sáng' });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreetingInfo({ text: 'buổi sáng' });
    else if (hour >= 12 && hour < 18) setGreetingInfo({ text: 'buổi chiều' });
    else setGreetingInfo({ text: 'buổi tối' });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const focusInput = () => {
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const sendMessage = async (rawMessage, options = {}) => {
    const textToSend = rawMessage.trim();
    if (!textToSend || isLoading) return;

    const userMessageId = options.userMessageId || createId();

    if (options.replaceBotId) {
      setMessages((prev) => prev.filter((msg) => msg.id !== options.replaceBotId));
    } else {
      setMessages((prev) => [
        ...prev,
        { id: userMessageId, sender: 'user', text: textToSend },
      ]);
    }

    setInput('');
    setIsLoading(true);
    focusInput();

    try {
      const response = await api.post('/api/v1/chat/', {
        message: textToSend,
        user_id: user.id.toString(),
      });

      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          sender: 'bot',
          text: response.data.reply || '',
          sources: response.data.sources || [],
          question: textToSend,
          userMessageId,
          collapsed: false,
          copied: false,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          sender: 'bot',
          status: 'error',
          text: getChatErrorMessage(error),
          question: textToSend,
          userMessageId,
        },
      ]);
    } finally {
      setIsLoading(false);
      focusInput();
    }
  };

  const handleSend = (e, customText = null) => {
    e?.preventDefault();
    sendMessage(customText || input);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const copyAnswer = async (messageId, text) => {
    await navigator.clipboard.writeText(text);
    setMessages((prev) => prev.map((msg) => (
      msg.id === messageId ? { ...msg, copied: true } : msg
    )));
    window.setTimeout(() => {
      setMessages((prev) => prev.map((msg) => (
        msg.id === messageId ? { ...msg, copied: false } : msg
      )));
    }, 1500);
  };

  const toggleCollapse = (messageId) => {
    setMessages((prev) => prev.map((msg) => (
      msg.id === messageId ? { ...msg, collapsed: !msg.collapsed } : msg
    )));
  };

  const regenerateAnswer = (message) => {
    if (!message.question) return;
    sendMessage(message.question, {
      replaceBotId: message.id,
      userMessageId: message.userMessageId,
    });
  };

  const clearCurrentChat = () => {
    setMessages([]);
    setInput('');
    focusInput();
  };

  useEffect(() => {
    const prefillQuestion = location.state?.prefillQuestion;

    if (!prefillQuestion) return;

    setInput(prefillQuestion);
    focusInput();
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="relative z-10 bg-white/60 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/50 shadow-2xl text-center max-w-md mx-4">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-[#003366]" />
          </div>
          <h2 className="text-2xl font-black text-[#003366] mb-3">Yêu cầu đăng nhập</h2>
          <p className="text-gray-500 mb-8">Vui lòng đăng nhập để hệ thống có thể hỗ trợ và lưu trữ lịch sử tư vấn cho riêng bạn.</p>
          <Link to="/login" className="inline-flex items-center justify-center w-full bg-[#0ea5e9] text-white font-bold py-4 rounded-2xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30">
            Đi tới trang Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  const renderComposer = (variant = 'bottom') => (
    <form
      onSubmit={handleSend}
      className={
        variant === 'empty'
          ? 'relative bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl rounded-2xl p-2 transition-all'
          : 'bg-white border border-gray-200 shadow-sm rounded-3xl p-2 flex items-end gap-3 focus-within:border-[#0ea5e9] transition-colors'
      }
    >
      <textarea
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={variant === 'empty' ? 2 : 1}
        placeholder={variant === 'empty' ? 'Nhập câu hỏi (VD: Ngành An toàn thông tin xét khối nào?)...' : 'Bạn cần hỏi thêm gì không?'}
        className={
          variant === 'empty'
            ? 'w-full bg-transparent resize-none outline-none text-gray-700 min-h-[60px] p-3 pr-14 text-base'
            : 'flex-1 bg-transparent resize-none border-none focus:ring-0 px-4 py-3 outline-none max-h-32'
        }
      />
      {variant === 'empty' ? (
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="absolute bottom-4 right-4 p-3 bg-[#0ea5e9] text-white rounded-xl hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          aria-label="Gửi câu hỏi"
        >
          <Send className="w-5 h-5" />
        </button>
      ) : (
        <>
          <button
            type="button"
            disabled
            title="Voice input đang phát triển"
            className="p-2 text-gray-300 cursor-not-allowed"
            aria-label="Voice input đang phát triển"
          >
            <Mic className="w-5 h-5" />
          </button>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-3 bg-[#0ea5e9] text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
            aria-label="Gửi câu hỏi"
          >
            <Send className="w-4 h-4" />
          </button>
        </>
      )}
    </form>
  );

  if (messages.length === 0) {
    return (
      <div className="relative min-h-screen bg-[#f8fafc] overflow-hidden flex flex-col justify-center items-center pt-24 pb-8">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="relative z-10 w-full max-w-4xl px-4 flex flex-col items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <div className="inline-block mb-3 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50/50 text-blue-700 text-xs font-semibold tracking-wide backdrop-blur-sm">
              HỆ THỐNG TƯ VẤN TUYỂN SINH UIT
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-gray-800">
              Chào {greetingInfo.text}, <span className="text-[#003366]">{user.name.split(' ').pop()}</span><br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#003366] via-[#0ea5e9] to-[#8b5cf6] bg-[length:200%_auto] animate-gradient">
                Bạn muốn tìm hiểu gì?
              </span>
            </h1>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-3xl mb-8">
            {renderComposer('empty')}
          </motion.div>

          <div className="w-full max-w-3xl">
            <div className="mb-3 flex items-center justify-center gap-2 text-sm font-bold text-gray-500">
              <Sparkles className="h-4 w-4 text-[#0ea5e9]" />
              Câu hỏi gợi ý
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  onClick={(e) => handleSend(e, question)}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/40 bg-white/50 backdrop-blur-md text-sm text-gray-600 hover:bg-white hover:text-[#003366] hover:-translate-y-1 disabled:opacity-60 disabled:hover:translate-y-0 transition-all shadow-sm"
                >
                  <GraduationCap className="w-4 h-4 text-[#0ea5e9]" />
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen pt-24 pb-4 bg-[#f8fafc]">
      <div className="w-full max-w-5xl mx-auto px-4 mb-3 flex justify-end">
        <button
          type="button"
          onClick={clearCurrentChat}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-500 shadow-sm hover:text-red-500 hover:border-red-100 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
          Xóa chat hiện tại
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 w-full max-w-5xl mx-auto scroll-smooth">
        <div className="space-y-6 pb-4">
          <AnimatePresence>
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              const isError = msg.status === 'error';
              const isLong = isBot && msg.text.length > 700;
              const shownText = isLong && msg.collapsed ? `${msg.text.slice(0, 700).trim()}...` : msg.text;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, type: 'spring', bounce: 0.3 }}
                  className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className="flex-shrink-0">
                    {isBot ? (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${isError ? 'bg-red-500' : 'bg-gradient-to-br from-[#003366] to-[#0ea5e9]'}`}>
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                        <UserIcon className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                  </div>

                  <div className={`group max-w-[84%] md:max-w-[74%] rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-[#003366] text-white rounded-tr-sm'
                      : isError
                        ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-sm'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm shadow-[0_4px_20px_rgb(0,0,0,0.04)]'
                  }`}
                  >
                    <p className="whitespace-pre-wrap">{shownText}</p>

                    {isBot && isLong && (
                      <button
                        type="button"
                        onClick={() => toggleCollapse(msg.id)}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#0ea5e9] hover:text-[#003366]"
                      >
                        {msg.collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                        {msg.collapsed ? 'Xem thêm' : 'Thu gọn'}
                      </button>
                    )}

                    {isBot && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyAnswer(msg.id, msg.text)}
                          className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {msg.copied ? 'Đã copy' : 'Copy'}
                        </button>
                        <button
                          type="button"
                          onClick={() => regenerateAnswer(msg)}
                          disabled={!msg.question || isLoading}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-[#0ea5e9] hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Regenerate
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex gap-4 flex-row"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-[#003366] to-[#0ea5e9] rounded-full flex items-center justify-center shadow-md shadow-blue-500/20">
                  <Bot className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-1.5">
                {[0, 0.2, 0.4].map((delay) => (
                  <motion.div
                    key={delay}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1, delay }}
                    className="w-2 h-2 bg-[#0ea5e9] rounded-full"
                  />
                ))}
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto px-4 mt-2">
        {renderComposer('bottom')}
      </div>
    </div>
  );
};

export default ChatPage;
