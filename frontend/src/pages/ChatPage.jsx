import { useState, useEffect, useRef, useContext } from 'react';
import { Send, Mic, Sparkles, GraduationCap, Calculator, Bot, User as UserIcon, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../lib/api';

const ChatPage = () => {
  const { user } = useContext(AuthContext);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [greetingInfo, setGreetingInfo] = useState({ text: 'buổi sáng' });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreetingInfo({ text: 'buổi sáng' });
    else if (hour >= 12 && hour < 18) setGreetingInfo({ text: 'buổi chiều' });
    else setGreetingInfo({ text: 'buổi tối' });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const suggestions = [
    { icon: <GraduationCap className="w-4 h-4" />, text: 'Các phương thức xét tuyển UIT 2026?' },
    { icon: <Calculator className="w-4 h-4" />, text: 'Điểm chuẩn ngành Công nghệ Thông tin?' },
    { icon: <Sparkles className="w-4 h-4" />, text: 'Cơ hội việc làm ngành Khoa học Dữ liệu?' },
  ];

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

  const handleSend = async (e, customText = null) => {
    e?.preventDefault();
    const textToSend = customText || input;
    if (!textToSend.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text: textToSend }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post('/api/v1/chat/', {
        message: textToSend,
        user_id: user.id.toString()
      });
      setMessages(prev => [...prev, { sender: 'bot', text: response.data.reply }]);
    } catch {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Xin lỗi, hệ thống máy chủ hiện không phản hồi.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (messages.length === 0) {
    return (
      <div className="relative min-h-screen bg-[#f8fafc] overflow-hidden flex flex-col justify-center items-center pt-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10 w-full max-w-4xl px-4 flex flex-col items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
            <div className="inline-block mb-3 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50/50 text-blue-700 text-xs font-semibold tracking-wide backdrop-blur-sm">
              HỆ THỐNG TƯ VẤN TUYỂN SINH UIT
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-gray-800">
              Chào {greetingInfo.text}, <span className="text-[#003366]">{user.name.split(' ').pop()}</span><br/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#003366] via-[#0ea5e9] to-[#8b5cf6] bg-[length:200%_auto] animate-gradient">
                Bạn muốn tìm hiểu gì?
              </span>
            </h1>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-3xl mb-8">
            <form onSubmit={handleSend} className="relative bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl rounded-2xl p-2 transition-all">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập câu hỏi (VD: Ngành An toàn thông tin xét khối nào?)..."
                  className="flex-1 bg-transparent resize-none outline-none text-gray-700 min-h-[60px] p-3 text-base"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                />
                <div className="flex items-center gap-2 p-2">
                  <button type="submit" disabled={!input.trim()} className="p-3 bg-[#0ea5e9] text-white rounded-xl hover:shadow-lg disabled:opacity-40 transition-all">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </form>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-3">
            {suggestions.map((item, index) => (
              <button key={index} onClick={(e) => handleSend(e, item.text)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/40 bg-white/50 backdrop-blur-md text-sm text-gray-600 hover:bg-white hover:text-[#003366] hover:-translate-y-1 transition-all shadow-sm">
                <span className="text-[#0ea5e9]">{item.icon}</span>
                {item.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen pt-24 pb-4 bg-[#f8fafc]">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 w-full max-w-5xl mx-auto scroll-smooth">
        <div className="space-y-6 pb-4">
          <AnimatePresence>
            {messages.map((msg, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className="flex-shrink-0">
                  {msg.sender === 'bot' ? (
                    <div className="w-10 h-10 bg-gradient-to-br from-[#003366] to-[#0ea5e9] rounded-full flex items-center justify-center shadow-md">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm">
                      <UserIcon className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                </div>
                <div className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-[#003366] text-white rounded-tr-sm' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm shadow-[0_4px_20px_rgb(0,0,0,0.04)]'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* HIỆU ỨNG BOT ĐANG SUY NGHĨ (TYPING INDICATOR) */}
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex gap-4 flex-row"
            >
              <div className="flex-shrink-0">
                <motion.div 
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="w-10 h-10 bg-gradient-to-br from-[#003366] to-[#0ea5e9] rounded-full flex items-center justify-center shadow-md shadow-blue-500/20"
                >
                  <Bot className="w-6 h-6 text-white" />
                </motion.div>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-1.5">
                <motion.div 
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} 
                  transition={{ repeat: Infinity, duration: 1, delay: 0 }} 
                  className="w-2 h-2 bg-[#0ea5e9] rounded-full" 
                />
                <motion.div 
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} 
                  transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} 
                  className="w-2 h-2 bg-[#0ea5e9] rounded-full" 
                />
                <motion.div 
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} 
                  transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} 
                  className="w-2 h-2 bg-[#0ea5e9] rounded-full" 
                />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto px-4 mt-2">
        <form onSubmit={handleSend} className="bg-white border border-gray-200 shadow-sm rounded-full p-2 flex items-center gap-3 focus-within:border-[#0ea5e9] transition-colors">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Bạn cần hỏi thêm gì không?"
            className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-2 outline-none"
          />
          <button type="button" className="p-2 text-gray-400 hover:text-[#0ea5e9] transition-colors">
            <Mic className="w-5 h-5" />
          </button>
          <button type="submit" disabled={!input.trim() || isLoading} className="p-3 bg-[#0ea5e9] text-white rounded-full hover:bg-blue-600 disabled:opacity-50 transition-colors shadow-md">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
