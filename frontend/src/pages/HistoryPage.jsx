import { useContext, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Bot,
  Calendar,
  Clock,
  Copy,
  Eye,
  Lock,
  MessageSquareOff,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  User as UserIcon,
  X,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../lib/api';

const filters = [
  { id: 'all', label: 'Tất cả' },
  { id: 'today', label: 'Hôm nay' },
  { id: '7days', label: '7 ngày gần nhất' },
];

const parseHistoryDate = (item) => {
  if (item.created_at) {
    const createdAt = new Date(item.created_at);
    if (!Number.isNaN(createdAt.getTime())) return createdAt;
  }

  if (item.date) {
    const [day, month, year] = item.date.split('/').map(Number);
    const [hour = 0, minute = 0] = (item.time || '').split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute);
  }

  return null;
};

const isSameDay = (a, b) => (
  a.getFullYear() === b.getFullYear()
  && a.getMonth() === b.getMonth()
  && a.getDate() === b.getDate()
);

const getAnswerPreview = (answer = '') => {
  if (answer.length <= 220) return answer;
  return `${answer.slice(0, 220).trim()}...`;
};

const formatHistoryDateTime = (item) => {
  const date = parseHistoryDate(item);

  if (!date) {
    return {
      date: item.date || 'Chưa rõ ngày',
      time: item.time || 'Chưa rõ giờ',
      full: 'Chưa rõ thời gian',
    };
  }

  return {
    date: date.toLocaleDateString('vi-VN'),
    time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    full: date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
  };
};

const HistoryPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [chatHistory, setChatHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      const timestamp = new Date().getTime();
      const res = await api.get(`/api/v1/chat/history/${user.id}?t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });

      setChatHistory(res.data || []);
    } catch {
      setError('Không thể tải lịch sử chat. Vui lòng kiểm tra backend và thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const filteredHistory = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    return chatHistory.filter((item) => {
      const createdAt = parseHistoryDate(item);

      if (activeFilter === 'today' && (!createdAt || !isSameDay(createdAt, now))) {
        return false;
      }

      if (activeFilter === '7days' && (!createdAt || createdAt < sevenDaysAgo)) {
        return false;
      }

      if (!query) return true;

      return [item.question, item.answer]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [activeFilter, chatHistory, searchTerm]);

  const copyAnswer = async (item) => {
    await navigator.clipboard.writeText(item.answer || '');
    setCopiedId(item.id);
    window.setTimeout(() => setCopiedId(null), 1500);
  };

  const askAgain = (item) => {
    navigate('/chat', {
      state: { prefillQuestion: item.question },
    });
  };

  const deleteItem = async (item) => {
    setDeleteTarget(item);
  };

  const confirmDeleteItem = async () => {
    if (!deleteTarget) return;

    setDeletingId(deleteTarget.id);

    try {
      await api.delete(`/api/v1/chat/history/item/${deleteTarget.id}`, {
        params: {
          user_id: user.id,
          role: user.role,
        },
      });
      setChatHistory((prev) => prev.filter((history) => history.id !== deleteTarget.id));
      if (selectedItem?.id === deleteTarget.id) setSelectedItem(null);
      setDeleteTarget(null);
    } catch {
      setError('Không thể xóa lịch sử này. Vui lòng thử lại.');
    } finally {
      setDeletingId(null);
    }
  };

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

      <div className="max-w-5xl mx-auto relative z-10">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black text-[#003366] uppercase tracking-tight mb-2">Lịch sử tương tác</h1>
            <p className="text-gray-500">Xem lại, tìm kiếm và hỏi lại các nội dung đã trao đổi</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              disabled
              title="Coming soon"
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 border border-gray-200 text-gray-400 rounded-xl cursor-not-allowed font-bold text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Xóa tất cả
            </button>
            <button
              type="button"
              onClick={fetchHistory}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-[#003366] transition-colors shadow-sm font-bold text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#0ea5e9]' : ''}`} />
              Làm mới
            </button>
          </div>
        </header>

        <div className="mb-6 rounded-3xl bg-white/70 backdrop-blur-md border border-white/70 p-4 shadow-sm">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo câu hỏi hoặc câu trả lời..."
              className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-11 text-gray-700 outline-none focus:border-[#0ea5e9] focus:ring-2 focus:ring-[#0ea5e9]/20"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                aria-label="Xóa tìm kiếm"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                  activeFilter === filter.id
                    ? 'bg-[#003366] text-white'
                    : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        <div className="space-y-5">
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
          ) : filteredHistory.length === 0 ? (
            <div className="bg-white/60 backdrop-blur-md rounded-3xl p-12 text-center border border-white/60 shadow-sm">
              <Search className="w-10 h-10 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-bold">Không tìm thấy lịch sử phù hợp.</p>
            </div>
          ) : (
            filteredHistory.map((item, index) => {
              const formattedDate = formatHistoryDateTime(item);

              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  key={item.id}
                  className="bg-white/85 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-white/70 shadow-[0_4px_20px_rgb(0,0,0,0.05)] hover:shadow-lg transition-all"
                >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5 bg-blue-50 text-[#0ea5e9] px-3 py-1 rounded-full font-medium">
                      <Calendar className="w-4 h-4" /> {formattedDate.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> {formattedDate.time}
                    </span>
                  </div>
                  <span className="w-fit text-[10px] font-black uppercase tracking-widest bg-green-50 text-green-600 px-3 py-1 rounded-full">
                    {item.status || 'Đã trả lời'}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-4 h-4 text-gray-600" />
                    </div>
                    <p className="text-gray-800 font-bold pt-1">{item.question}</p>
                  </div>
                  <div className="flex gap-3 sm:pl-11">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#003366] to-[#0ea5e9] flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-sm border border-gray-100 text-gray-600 text-sm leading-relaxed w-full">
                      {getAnswerPreview(item.answer)}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200"
                  >
                    <Eye className="h-4 w-4" />
                    Xem chi tiết
                  </button>
                  <button
                    type="button"
                    onClick={() => copyAnswer(item)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-[#0ea5e9] hover:bg-blue-100"
                  >
                    <Copy className="h-4 w-4" />
                    {copiedId === item.id ? 'Đã copy' : 'Copy answer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => askAgain(item)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 px-3 py-2 text-xs font-bold text-purple-600 hover:bg-purple-100"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Hỏi lại
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteItem(item)}
                    disabled={deletingId === item.id}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingId === item.id ? 'Đang xóa' : 'Xóa'}
                  </button>
                </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedItem && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-3xl max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-6 sm:p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-[#003366]">Chi tiết lịch sử</h2>
                  <p className="mt-1 text-sm text-gray-500">{formatHistoryDateTime(selectedItem).full}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
                  aria-label="Đóng chi tiết lịch sử"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="rounded-2xl bg-gray-50 p-5">
                  <p className="mb-2 text-xs font-black uppercase tracking-wide text-gray-400">Câu hỏi</p>
                  <p className="whitespace-pre-wrap font-bold leading-7 text-gray-800">{selectedItem.question}</p>
                </div>
                <div className="rounded-2xl bg-blue-50/60 p-5">
                  <p className="mb-2 text-xs font-black uppercase tracking-wide text-[#0ea5e9]">Câu trả lời</p>
                  <p className="whitespace-pre-wrap leading-7 text-gray-700">{selectedItem.answer}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => copyAnswer(selectedItem)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-bold text-[#0ea5e9] hover:bg-blue-100"
                >
                  <Copy className="h-4 w-4" />
                  {copiedId === selectedItem.id ? 'Đã copy' : 'Copy answer'}
                </button>
                <button
                  type="button"
                  onClick={() => askAgain(selectedItem)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 px-4 py-2.5 text-sm font-bold text-purple-600 hover:bg-purple-100"
                >
                  <RotateCcw className="h-4 w-4" />
                  Hỏi lại
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-gray-800">Xóa mục lịch sử?</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Câu hỏi này sẽ bị xóa khỏi lịch sử của bạn. Thao tác này không thể hoàn tác.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
                  aria-label="Đóng xác nhận xóa"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="line-clamp-3 text-sm font-semibold text-gray-700">{deleteTarget.question}</p>
              </div>
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteItem}
                  disabled={deletingId === deleteTarget.id}
                  className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60"
                >
                  {deletingId === deleteTarget.id ? 'Đang xóa...' : 'Xóa lịch sử'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HistoryPage;
