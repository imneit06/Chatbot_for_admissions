import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, Bot, User as UserIcon, Lock, RefreshCw, MessageSquareOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../lib/api';

const HistoryPage = () => {
  const { user } = useContext(AuthContext);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // 1. Tạo một dãy số thời gian thực (millisecond) thay đổi liên tục
      const timestamp = new Date().getTime();
      
      // 2. Gắn ?t=... vào URL kết hợp với cấu hình Headers
      const res = await api.get(`/api/v1/chat/history/${user.id}?t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
      
      setChatHistory(res.data);
    } catch (error) {
      console.error("Lỗi lấy lịch sử", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  // NẾU CHƯA ĐĂNG NHẬP: HIỆN GIAO DIỆN KHÓA
  if (!user) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center relative overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="relative z-10 bg-white/60 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/50 shadow-2xl text-center max-w-md mx-4">
          <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-purple-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-3">Chưa đăng nhập</h2>
          <p className="text-gray-500 mb-8">Bạn cần đăng nhập để xem lại lịch sử tư vấn cá nhân của mình.</p>
          <Link to="/login" className="inline-flex items-center justify-center w-full bg-purple-600 text-white font-bold py-4 rounded-2xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/30">
            Đi tới trang Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-12 px-4 bg-[#f8fafc] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black text-[#003366] uppercase tracking-tight mb-2">Lịch sử tương tác</h1>
            <p className="text-gray-500">Xem lại các nội dung bạn đã trao đổi với hệ thống</p>
          </div>
          <button onClick={fetchHistory} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-[#003366] transition-colors shadow-sm font-bold text-sm">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#0ea5e9]' : ''}`} />
            Làm mới
          </button>
        </header>

        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center text-gray-400 py-10">Đang tải lịch sử...</div>
          ) : chatHistory.length === 0 ? (
            <div className="bg-white/60 backdrop-blur-md rounded-3xl p-12 text-center border border-white/60 shadow-sm flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquareOff className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-700 mb-2">Chưa có lịch sử trò chuyện</h3>
              <p className="text-gray-500 mb-6">Bạn chưa đặt câu hỏi nào cho Chatbot tuyển sinh.</p>
              <Link to="/chat" className="px-6 py-3 bg-[#0ea5e9] text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-md">
                Bắt đầu trò chuyện ngay
              </Link>
            </div>
          ) : (
            chatHistory.map((item, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={item.id}
                className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.05)] hover:shadow-lg transition-all"
              >
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5 bg-blue-50 text-[#0ea5e9] px-3 py-1 rounded-full font-medium">
                      <Calendar className="w-4 h-4" /> {item.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> {item.time}
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-green-50 text-green-600 px-3 py-1 rounded-full">
                    {item.status}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-4 h-4 text-gray-600" />
                    </div>
                    <p className="text-gray-800 font-bold pt-1">{item.question}</p>
                  </div>
                  <div className="flex gap-3 pl-11">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#003366] to-[#0ea5e9] flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-sm border border-gray-100 text-gray-600 text-sm leading-relaxed w-full">
                      {item.answer}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
