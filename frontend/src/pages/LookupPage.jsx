import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  DollarSign,
  Fingerprint,
  MessageCircle,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

const splitBlocks = (blocks = '') => (
  blocks
    .split(',')
    .map((block) => block.trim())
    .filter(Boolean)
);

const formatFee = (fee) => {
  if (!fee) return 'Đang cập nhật';

  const numericFee = Number(String(fee).replace(/[^\d]/g, ''));

  if (!Number.isNaN(numericFee) && numericFee > 0) {
    return `${new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(numericFee)}/năm`;
  }

  return fee;
};

const LookupPage = () => {
  const navigate = useNavigate();
  const [majors, setMajors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('Tất cả');
  const [selectedMajor, setSelectedMajor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMajors = async () => {
    setIsLoading(true);
    setError('');

    try {
      const res = await api.get('/api/v1/majors/');
      setMajors(res.data || []);
    } catch {
      setError('Không thể tải danh sách ngành. Vui lòng kiểm tra backend và thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMajors();
  }, []);

  const allBlocks = useMemo(() => {
    const blocks = majors.flatMap((major) => splitBlocks(major.admission_blocks));
    return ['Tất cả', ...new Set(blocks)].sort();
  }, [majors]);

  const filteredMajors = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return majors.filter((major) => {
      const blocks = splitBlocks(major.admission_blocks);
      const matchBlock = selectedBlock === 'Tất cả' || blocks.includes(selectedBlock);

      if (!query) return matchBlock;

      const searchableText = [
        major.code,
        major.name,
        major.admission_blocks,
        major.description,
      ].join(' ').toLowerCase();

      return matchBlock && searchableText.includes(query);
    });
  }, [majors, searchTerm, selectedBlock]);

  const askChatbotAboutMajor = (major) => {
    const prefillQuestion = `Tư vấn chi tiết cho tôi về ngành ${major.name} mã ngành ${major.code} của UIT.`;

    navigate('/chat', {
      state: { prefillQuestion },
    });
  };

  return (
    <div className="min-h-screen pt-32 pb-12 px-4 bg-[#f8fafc] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-[#003366] uppercase mb-4 tracking-tight">
            Tra cứu Ngành học UIT
          </h1>
          <p className="text-gray-500 mb-8">
            Tìm nhanh mã ngành, tổ hợp xét tuyển, học phí và thông tin mô tả.
          </p>

          <div className="relative max-w-2xl mx-auto group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[#0ea5e9] transition-colors" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-14 pr-12 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/50 focus:border-[#0ea5e9] shadow-sm transition-all text-base sm:text-lg"
              placeholder="Tìm theo mã, tên ngành, tổ hợp hoặc mô tả..."
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-700"
                aria-label="Xóa tìm kiếm"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {allBlocks.map((block) => (
            <button
              key={block}
              onClick={() => setSelectedBlock(block)}
              className={`px-4 sm:px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                selectedBlock === block
                  ? 'bg-[#003366] text-white shadow-md scale-105'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              {block === 'Tất cả' ? 'Tất cả Khối' : `Khối ${block}`}
            </button>
          ))}
        </div>

        {!isLoading && !error && majors.length > 0 && (
          <div className="mb-6 text-center text-sm font-bold text-gray-500">
            Hiển thị {filteredMajors.length}/{majors.length} ngành
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#0ea5e9]">
            <RefreshCw className="w-10 h-10 animate-spin mb-4" />
            <p className="font-bold">Đang tải dữ liệu từ máy chủ...</p>
          </div>
        ) : error ? (
          <div className="max-w-xl mx-auto text-center py-14 bg-white/70 backdrop-blur-md rounded-3xl border border-red-100 shadow-sm">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-700 font-bold mb-5">{error}</p>
            <button
              type="button"
              onClick={fetchMajors}
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#0ea5e9] text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Tải lại
            </button>
          </div>
        ) : majors.length === 0 ? (
          <div className="text-center py-20 bg-white/60 backdrop-blur-md rounded-3xl border border-white shadow-sm">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-bold">Chưa có dữ liệu ngành học.</p>
          </div>
        ) : filteredMajors.length === 0 ? (
          <div className="text-center py-20 bg-white/60 backdrop-blur-md rounded-3xl border border-white shadow-sm">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-bold">Không tìm thấy ngành học phù hợp.</p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedBlock('Tất cả');
              }}
              className="mt-5 px-5 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredMajors.map((major) => (
                <motion.button
                  type="button"
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  key={major.id}
                  onClick={() => setSelectedMajor(major)}
                  className="text-left bg-white/85 backdrop-blur-md rounded-3xl p-6 border border-white/70 shadow-[0_4px_20px_rgb(0,0,0,0.05)] hover:shadow-xl transition-all hover:-translate-y-1 group"
                >
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="bg-blue-50 text-[#0ea5e9] p-3 rounded-2xl group-hover:bg-[#0ea5e9] group-hover:text-white transition-colors">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-xl text-xs font-black">
                      <Fingerprint className="w-3.5 h-3.5" />
                      {major.code}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-gray-800 mb-3 line-clamp-2 min-h-[56px]">
                    {major.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-5 line-clamp-3 min-h-[60px]">
                    {major.description || 'Chưa có mô tả chi tiết.'}
                  </p>

                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex flex-wrap gap-1.5">
                      {splitBlocks(major.admission_blocks).map((block) => (
                        <span key={block} className="px-2.5 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold border border-purple-100">
                          {block}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-1.5 text-gray-500 font-medium">
                        <DollarSign className="w-4 h-4 text-green-500" /> Học phí
                      </span>
                      <span className="font-bold text-gray-800 text-right">{formatFee(major.fee)}</span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {selectedMajor && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMajor(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-2xl max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-6 sm:p-8 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-xl text-xs font-black mb-3">
                    <Fingerprint className="w-3.5 h-3.5" />
                    {selectedMajor.code}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#003366]">
                    {selectedMajor.name}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMajor(null)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
                  aria-label="Đóng chi tiết ngành"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="rounded-2xl bg-green-50 p-4">
                  <p className="text-xs font-black uppercase text-green-600 mb-1">Học phí</p>
                  <p className="font-bold text-gray-800">{formatFee(selectedMajor.fee)}</p>
                </div>
                <div className="rounded-2xl bg-purple-50 p-4">
                  <p className="text-xs font-black uppercase text-purple-600 mb-2">Tổ hợp xét tuyển</p>
                  <div className="flex flex-wrap gap-1.5">
                    {splitBlocks(selectedMajor.admission_blocks).map((block) => (
                      <span key={block} className="px-2.5 py-1 bg-white text-purple-600 rounded-lg text-xs font-bold border border-purple-100">
                        {block}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 mb-6">
                <p className="text-xs font-black uppercase text-gray-400 mb-2">Mô tả ngành</p>
                <p className="text-gray-700 leading-7 whitespace-pre-wrap">
                  {selectedMajor.description || 'Chưa có mô tả chi tiết.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => askChatbotAboutMajor(selectedMajor)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0ea5e9] px-5 py-4 text-white font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Hỏi chatbot về ngành này
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LookupPage;
