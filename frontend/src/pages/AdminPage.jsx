import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Database, FileText, RefreshCw, Plus, Trash2, User, Lock, Unlock } from 'lucide-react';
import api from '../lib/api';

// Component con: Quản lý Ngành Học
// Component con: Quản lý Ngành Học
const MajorManagementTab = () => {
  const [majors, setMajors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ code: '', name: '', fee: '', admission_blocks: '', description: '' });
  
  // State mới để quản lý mảng các Tag tổ hợp môn
  const [blocks, setBlocks] = useState([]);
  const [blockInput, setBlockInput] = useState('');

  const fetchMajors = async () => {
    try {
      const res = await api.get('/api/v1/majors/');
      setMajors(res.data);
    } catch (error) { console.error("Lỗi lấy dữ liệu ngành:", error); }
  };

  React.useEffect(() => { fetchMajors(); }, []);

  // Hàm xử lý khi gõ tổ hợp môn và nhấn Enter
  const handleAddBlock = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Chặn form submit khi nhấn Enter
      const newBlock = blockInput.trim().toUpperCase();
      if (newBlock && !blocks.includes(newBlock)) {
        setBlocks([...blocks, newBlock]);
      }
      setBlockInput('');
    }
  };

  const removeBlock = (blockToRemove) => {
    setBlocks(blocks.filter(b => b !== blockToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (blocks.length === 0) {
      alert("Vui lòng nhập ít nhất 1 tổ hợp môn!");
      return;
    }
    try {
      // Ép mảng blocks thành chuỗi "A00, A01" trước khi gửi xuống Backend
      const dataToSubmit = { ...formData, admission_blocks: blocks.join(', ') };
      await api.post('/api/v1/majors/', dataToSubmit);
      
      setShowForm(false);
      setFormData({ code: '', name: '', fee: '', admission_blocks: '', description: '' }); 
      setBlocks([]); // Reset tags
      fetchMajors();
    } catch (error) {
      alert(error.response?.data?.detail || "Có lỗi xảy ra khi lưu ngành học!");
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Bạn có chắc chắn muốn xóa ngành này?")) {
      try {
        await api.delete(`/api/v1/majors/${id}`);
        fetchMajors();
      } catch { alert("Lỗi khi xóa!"); }
    }
  };

  // Hàm fomat tiền VNĐ cho bảng Admin
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Dữ liệu Ngành học</h2>
          <p className="text-sm text-gray-500">Quản lý các ngành đào tạo và thông tin tuyển sinh</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#003366] text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-900 transition-all"
        >
          {showForm ? 'Đóng Form' : '+ Thêm ngành mới'}
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required type="text" placeholder="Mã ngành (VD: 7480101)" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#0ea5e9]"/>
            <input required type="text" placeholder="Tên ngành (VD: Khoa học Máy tính)" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#0ea5e9]"/>
            
            {/* Input Học phí: Ép kiểu number */}
            <input required type="number" placeholder="Học phí (nhập số, VD: 35000000)" value={formData.fee} onChange={(e) => setFormData({...formData, fee: e.target.value})} className="px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#0ea5e9]"/>
            
            {/* Khu vực nhập Tag Tổ hợp môn */}
            <div className="px-4 py-2 rounded-xl border border-gray-200 bg-white flex flex-wrap gap-2 items-center focus-within:border-[#0ea5e9]">
              {blocks.map(b => (
                <span key={b} className="flex items-center gap-1 bg-[#0ea5e9] text-white px-2 py-1 rounded-md text-xs font-bold">
                  {b} <button type="button" onClick={() => removeBlock(b)} className="hover:text-red-200 ml-1">×</button>
                </span>
              ))}
              <input 
                type="text" 
                placeholder={blocks.length === 0 ? "Nhập tổ hợp (VD: A00) rồi nhấn Enter" : "Thêm tổ hợp..."}
                value={blockInput} 
                onChange={(e) => setBlockInput(e.target.value)}
                onKeyDown={handleAddBlock}
                className="flex-1 outline-none min-w-[150px] text-sm"
              />
            </div>

            <textarea required placeholder="Mô tả ngành học..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="md:col-span-2 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#0ea5e9] min-h-[100px] resize-none"></textarea>
            <button type="submit" className="md:col-span-2 py-3 bg-[#0ea5e9] text-white font-bold rounded-xl shadow-md hover:bg-blue-600 transition-all">Lưu vào Database</button>
          </form>
        </motion.div>
      )}

      {/* Bảng Danh sách */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-black">
            <tr>
              <th className="px-6 py-4">Mã - Tên Ngành</th>
              <th className="px-6 py-4">Học phí</th>
              <th className="px-6 py-4">Tổ hợp</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {majors.length === 0 ? (
              <tr><td colSpan="4" className="text-center py-8 text-gray-400">Chưa có dữ liệu. Hãy thêm ngành học mới!</td></tr>
            ) : (
              majors.map(m => (
                <tr key={m.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-800 block">{m.name}</span>
                    <span className="text-xs text-gray-400">{m.code}</span>
                  </td>
                  {/* Hiển thị tiền tệ */}
                  <td className="px-6 py-4 text-gray-600 font-medium">{formatMoney(m.fee)}/năm</td>
                  <td className="px-6 py-4 flex flex-wrap gap-1">
                    {/* Cắt chuỗi hiển thị thành các Tag nhỏ */}
                    {m.admission_blocks.split(',').map((block, idx) => (
                       <span key={idx} className="px-2 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold">{block.trim()}</span>
                    ))}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(m.id)} className="text-red-500 hover:bg-red-50 px-3 py-1 rounded-lg font-bold transition-all text-xs">Xóa</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('users'); // Mình để mặc định mở tab Users cho bạn dễ test
  const [usersList, setUsersList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const tabs = [
    { id: 'stats', name: 'Thống kê báo cáo', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'knowledge', name: 'Tri thức Chatbot', icon: <FileText className="w-4 h-4" /> },
    { id: 'data', name: 'Dữ liệu hệ thống', icon: <Database className="w-4 h-4" /> },
    { id: 'users', name: 'Quản lý Người dùng', icon: <User className="w-4 h-4" /> },
  ];

  // Hàm tải danh sách user từ Backend
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/v1/auth/users');
      setUsersList(response.data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Tự động tải data khi chuyển sang tab 'users'
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  // Hàm xử lý Khóa / Mở khóa tài khoản
  const handleToggleStatus = async (userId) => {
    try {
      await api.put(`/api/v1/auth/users/${userId}/toggle-status`);
      fetchUsers(); // Tải lại danh sách sau khi cập nhật
    } catch {
      alert("Có lỗi xảy ra khi cập nhật trạng thái!");
    }
  };

  // Hàm xử lý Xóa tài khoản
  const handleDeleteUser = async (userId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản này không?")) {
      try {
        await api.delete(`/api/v1/auth/users/${userId}`);
        fetchUsers(); // Tải lại danh sách sau khi xóa
      } catch {
        alert("Có lỗi xảy ra khi xóa người dùng!");
      }
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-12 px-4 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#003366] uppercase">Admin Dashboard</h1>
            <p className="text-gray-500">Quản lý tri thức và người dùng hệ thống UIT</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-[#0ea5e9] text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-95">
            <Plus className="w-5 h-5" />
            Thêm mới
          </button>
        </header>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-gray-200/50 rounded-2xl w-fit mb-8 backdrop-blur-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-[#003366] shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* TAB NỘI DUNG: QUẢN LÝ NGƯỜI DÙNG */}
        {/* ---------------------------------------------------------------- */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Danh sách Tài khoản ({usersList.length})</h2>
                <button onClick={fetchUsers} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-[#0ea5e9] rounded-xl font-bold text-xs hover:bg-blue-100 transition-colors">
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Làm mới
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-400 text-xs uppercase tracking-widest border-b border-gray-50">
                      <th className="py-4 font-black">Người dùng</th>
                      <th className="py-4 font-black">Vai trò</th>
                      <th className="py-4 font-black">Trạng thái</th>
                      <th className="py-4 font-black text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {usersList.map((user) => (
                      <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-4">
                          <p className="font-bold text-gray-700">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            user.role === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            user.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                          }`}>
                            {user.is_active ? 'Hoạt động' : 'Bị Khóa'}
                          </span>
                        </td>
                        <td className="py-4 text-right space-x-2">
                          {/* Ẩn nút Khóa/Xóa nếu đó là tài khoản Admin để tránh tự khóa mình */}
                          {user.role !== 'admin' && (
                            <>
                              <button 
                                onClick={() => handleToggleStatus(user.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex inline-flex items-center gap-1 ${
                                  user.is_active 
                                    ? 'bg-orange-50 text-orange-500 hover:bg-orange-100' 
                                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                                }`}
                              >
                                {user.is_active ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                {user.is_active ? 'Khóa' : 'Mở khóa'}
                              </button>
                              
                              <button 
                                onClick={() => handleDeleteUser(user.id)}
                                className="px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors flex inline-flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Xóa
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                    {usersList.length === 0 && !isLoading && (
                      <tr>
                        <td colSpan="4" className="text-center py-8 text-gray-400">Không có dữ liệu người dùng.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </motion.div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* CÁC TAB KHÁC (Chưa làm API nên mình để giao diện tĩnh như cũ) */}
        {/* ---------------------------------------------------------------- */}
        {activeTab === 'knowledge' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
             <h2 className="text-xl font-bold text-gray-800 mb-4">Quản lý Tài liệu Tri thức (BM 4.1)</h2>
             <p className="text-gray-500">Chức năng quản lý file PDF (RAG) sẽ được tích hợp ở giai đoạn sau.</p>
          </motion.div>
        )}
        {activeTab === 'stats' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
             <h2 className="text-xl font-bold text-gray-800 mb-4">Thống kê hệ thống</h2>
             <p className="text-gray-500">Khu vực hiển thị biểu đồ thống kê theo đồ án.</p>
          </motion.div>
        )}
        {activeTab === 'data' && (
          <MajorManagementTab />
        )}

      </div>
    </div>
  );
};

export default AdminPage;
