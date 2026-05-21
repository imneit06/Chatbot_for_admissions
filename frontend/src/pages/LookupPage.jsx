import { useState, useEffect } from 'react';
import { Search, BookOpen, DollarSign, Fingerprint, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';

const LookupPage = () => {
  const [majors, setMajors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('Tất cả');
  const [isLoading, setIsLoading] = useState(true);

  // Gọi API lấy danh sách ngành
  const fetchMajors = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/api/v1/majors/');
      setMajors(res.data);
    } catch (error) {
      console.error("Lỗi lấy dữ liệu tra cứu:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMajors();
  }, []);

  // TỰ ĐỘNG TẠO BỘ LỌC TỔ HỢP: Quét toàn bộ data để tìm các tổ hợp môn (A00, A01...)
  const allBlocks = ['Tất cả', ...new Set(
    majors.flatMap(m => m.admission_blocks.split(',').map(b => b.trim()).filter(b => b))
  )].sort();

  // Logic lọc dữ liệu theo Từ khóa và Tổ hợp môn
  const filteredMajors = majors.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.code.includes(searchTerm);
    const matchBlock = selectedBlock === 'Tất cả' || m.admission_blocks.includes(selectedBlock);
    return matchSearch && matchBlock;
  });

  // Hàm fomat tiền VNĐ cho thẻ ngành học
  const formatMoney = (amount) => {
    if(!amount) return "Đang cập nhật";
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="min-h-screen pt-32 pb-12 px-4 bg-[#f8fafc] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Tiêu đề & Thanh tìm kiếm */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-black text-[#003366] uppercase mb-4 tracking-tight">Tra cứu Ngành học UIT</h1>
          <p className="text-gray-500 mb-8">Thông tin chi tiết về mã ngành, học phí và tổ hợp xét tuyển mới nhất.</p>
          
          <div className="relative max-w-2xl mx-auto group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[#0ea5e9] transition-colors" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-14 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9]/50 focus:border-[#0ea5e9] shadow-sm transition-all text-lg"
              placeholder="Nhập tên ngành hoặc mã ngành..."
            />
          </div>
        </div>

        {/* Thanh Lọc Tổ hợp môn */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {allBlocks.map(block => (
            <button
              key={block}
              onClick={() => setSelectedBlock(block)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                selectedBlock === block 
                  ? 'bg-[#003366] text-white shadow-md scale-105' 
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              {block === 'Tất cả' ? 'Tất cả Khối' : `Khối ${block}`}
            </button>
          ))}
        </div>

        {/* Danh sách Thẻ Ngành Học */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#0ea5e9]">
            <RefreshCw className="w-10 h-10 animate-spin mb-4" />
            <p className="font-bold">Đang tải dữ liệu từ máy chủ...</p>
          </div>
        ) : filteredMajors.length === 0 ? (
          <div className="text-center py-20 bg-white/60 backdrop-blur-md rounded-3xl border border-white">
            <p className="text-gray-500 text-lg font-bold">Không tìm thấy ngành học nào phù hợp với tìm kiếm của bạn.</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredMajors.map((major) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  key={major.id}
                  className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.05)] hover:shadow-xl transition-all hover:-translate-y-1 group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-blue-50 text-[#0ea5e9] p-3 rounded-2xl group-hover:bg-[#0ea5e9] group-hover:text-white transition-colors">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-xl text-xs font-black">
                      <Fingerprint className="w-3.5 h-3.5" />
                      {major.code}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-gray-800 mb-3 line-clamp-2 min-h-[56px]">{major.name}</h3>
                  <p className="text-sm text-gray-500 mb-5 line-clamp-3 min-h-[60px]">{major.description}</p>

                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    {/* Hiển thị Tổ hợp môn dạng Tag */}
                    <div className="flex flex-wrap gap-1.5">
                      {major.admission_blocks.split(',').map((block, index) => (
                        <span key={index} className="px-2.5 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold border border-purple-100">
                          {block.trim()}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-gray-500 font-medium">
                        <DollarSign className="w-4 h-4 text-green-500" /> Học phí:
                      </span>
                      <span className="font-bold text-gray-800">{formatMoney(major.fee)}/năm</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LookupPage;
