import { useContext, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, BarChart3, CheckCircle, Database, Edit3, FileText, RefreshCw, Plus, Search, Trash2, User, Lock, Unlock, X } from 'lucide-react';
import api from '../lib/api';
import { AuthContext } from '../context/AuthContext';

const emptyMajorForm = {
  code: '',
  name: '',
  fee: '',
  admission_blocks: '',
  description: '',
};

const splitBlocks = (blocks = '') => blocks.split(',').map((block) => block.trim()).filter(Boolean);

const MajorManagementTab = () => {
  const [majors, setMajors] = useState([]);
  const [majorSearch, setMajorSearch] = useState('');
  const [sortBy, setSortBy] = useState('code');
  const [modalMode, setModalMode] = useState(null);
  const [selectedMajor, setSelectedMajor] = useState(null);
  const [formData, setFormData] = useState(emptyMajorForm);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [toast, setToast] = useState(null);

  const fetchMajors = async () => {
    setIsLoading(true);
    setActionError('');
    try {
      const res = await api.get('/api/v1/majors/');
      setMajors(res.data);
    } catch (error) {
      setActionError(error.response?.data?.detail || 'Không thể tải danh sách ngành học.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMajors();
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 2500);
  };

  const filteredMajors = useMemo(() => {
    const query = majorSearch.trim().toLowerCase();

    return majors
      .filter((major) => {
        if (!query) return true;
        return [major.code, major.name, major.admission_blocks]
          .join(' ')
          .toLowerCase()
          .includes(query);
      })
      .sort((first, second) => (first[sortBy] || '').localeCompare(second[sortBy] || '', 'vi'));
  }, [majorSearch, majors, sortBy]);

  const openCreateModal = () => {
    setSelectedMajor(null);
    setFormData(emptyMajorForm);
    setFormError('');
    setModalMode('create');
  };

  const openEditModal = (major) => {
    setSelectedMajor(major);
    setFormData({
      code: major.code || '',
      name: major.name || '',
      fee: major.fee || '',
      admission_blocks: major.admission_blocks || '',
      description: major.description || '',
    });
    setFormError('');
    setModalMode('edit');
  };

  const closeMajorModal = () => {
    setModalMode(null);
    setSelectedMajor(null);
    setFormData(emptyMajorForm);
    setFormError('');
  };

  const validateMajorForm = () => {
    if (!formData.code.trim()) return 'Vui lòng nhập mã ngành.';
    if (!formData.name.trim()) return 'Vui lòng nhập tên ngành.';
    if (!String(formData.fee).trim()) return 'Vui lòng nhập học phí.';
    if (!formData.admission_blocks.trim()) return 'Vui lòng nhập tổ hợp xét tuyển.';
    return '';
  };

  const handleSubmitMajor = async (e) => {
    e.preventDefault();
    const validationMessage = validateMajorForm();

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    const payload = {
      code: formData.code.trim(),
      name: formData.name.trim(),
      fee: String(formData.fee).trim(),
      admission_blocks: splitBlocks(formData.admission_blocks).join(', '),
      description: formData.description.trim(),
    };

    setIsSubmitting(true);
    setFormError('');

    try {
      if (modalMode === 'edit' && selectedMajor) {
        await api.put(`/api/v1/majors/${selectedMajor.id}`, payload);
        showToast('success', 'Đã cập nhật ngành học.');
      } else {
        await api.post('/api/v1/majors/', payload);
        showToast('success', 'Đã thêm ngành học mới.');
      }
      closeMajorModal();
      await fetchMajors();
    } catch (error) {
      setFormError(error.response?.data?.detail || 'Có lỗi xảy ra khi lưu ngành học.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMajor = async () => {
    if (!deleteTarget) return;

    setIsSubmitting(true);
    setActionError('');

    try {
      await api.delete(`/api/v1/majors/${deleteTarget.id}`);
      setDeleteTarget(null);
      showToast('success', 'Đã xóa ngành học.');
      await fetchMajors();
    } catch (error) {
      setActionError(error.response?.data?.detail || 'Không thể xóa ngành học.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatMoney = (amount) => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount)) return amount || 'Chưa cập nhật';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numericAmount);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Dữ liệu Ngành học</h2>
          <p className="text-sm text-gray-500">Quản lý các ngành đào tạo và thông tin tuyển sinh</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-900 transition-all"
        >
          <Plus className="h-4 w-4" />
          Thêm ngành mới
        </button>
      </div>

      {toast && (
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
          toast.type === 'success' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-red-100 bg-red-50 text-red-700'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      <div className="grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:grid-cols-[1fr_auto_auto] md:items-center">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={majorSearch}
            onChange={(e) => setMajorSearch(e.target.value)}
            placeholder="Tìm theo mã ngành, tên ngành, tổ hợp..."
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-10 text-sm outline-none focus:border-[#0ea5e9]"
          />
          {majorSearch && (
            <button
              type="button"
              onClick={() => setMajorSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Xóa tìm kiếm"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:border-[#0ea5e9]"
        >
          <option value="code">Sắp xếp theo mã</option>
          <option value="name">Sắp xếp theo tên</option>
        </select>
        <button
          type="button"
          onClick={fetchMajors}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <AlertCircle className="h-4 w-4" />
          {actionError}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-black">
            <tr>
              <th className="px-6 py-4">Mã ngành</th>
              <th className="px-6 py-4">Tên ngành</th>
              <th className="px-6 py-4">Học phí</th>
              <th className="px-6 py-4">Tổ hợp</th>
              <th className="px-6 py-4">Mô tả</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoading ? (
              <tr>
                <td colSpan="6" className="py-10 text-center text-gray-500">Đang tải danh sách ngành...</td>
              </tr>
            ) : filteredMajors.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-10 text-center text-gray-400">Chưa có ngành học phù hợp.</td>
              </tr>
            ) : (
              filteredMajors.map((m) => (
                <tr key={m.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-[#003366]">{m.code}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">{m.name}</td>
                  <td className="px-6 py-4 text-gray-600">{formatMoney(m.fee)}/năm</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {splitBlocks(m.admission_blocks).map((block) => (
                        <span key={block} className="rounded-lg bg-sky-50 px-2 py-1 text-xs font-bold text-sky-700">{block}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    <p className="line-clamp-2 max-w-sm">{m.description || 'Chưa cập nhật'}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(m)}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-50"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(m)}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 py-6">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-gray-900">{modalMode === 'edit' ? 'Sửa ngành học' : 'Thêm ngành học'}</h3>
                <p className="text-sm text-gray-500">Nhập thông tin tuyển sinh hiển thị ở trang tra cứu.</p>
              </div>
              <button type="button" onClick={closeMajorModal} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Đóng">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                <AlertCircle className="h-4 w-4" />
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitMajor} className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5 text-sm font-bold text-gray-700">
                Mã ngành
                <input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#0ea5e9]" placeholder="VD: 7480101" />
              </label>
              <label className="space-y-1.5 text-sm font-bold text-gray-700">
                Tên ngành
                <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#0ea5e9]" placeholder="VD: Khoa học máy tính" />
              </label>
              <label className="space-y-1.5 text-sm font-bold text-gray-700">
                Học phí
                <input value={formData.fee} onChange={(e) => setFormData({ ...formData, fee: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#0ea5e9]" placeholder="VD: 35000000" />
              </label>
              <label className="space-y-1.5 text-sm font-bold text-gray-700">
                Tổ hợp xét tuyển
                <input value={formData.admission_blocks} onChange={(e) => setFormData({ ...formData, admission_blocks: e.target.value })} className="w-full rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#0ea5e9]" placeholder="VD: A00, A01, D01" />
              </label>
              <label className="space-y-1.5 text-sm font-bold text-gray-700 md:col-span-2">
                Mô tả
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="min-h-[120px] w-full resize-none rounded-xl border border-gray-200 px-4 py-3 font-normal outline-none focus:border-[#0ea5e9]" placeholder="Mô tả ngành học..." />
              </label>
              <div className="flex flex-col gap-3 md:col-span-2 md:flex-row md:justify-end">
                <button type="button" onClick={closeMajorModal} className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="rounded-xl bg-[#003366] px-4 py-3 text-sm font-bold text-white hover:bg-blue-900 disabled:opacity-60">
                  {isSubmitting ? 'Đang lưu...' : 'Lưu ngành học'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4 py-6">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-black text-gray-900">Xóa ngành học?</h3>
            <p className="mt-2 text-sm text-gray-600">Bạn sắp xóa ngành <span className="font-bold">{deleteTarget.name}</span>. Thao tác này không thể hoàn tác.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50">Hủy</button>
              <button type="button" onClick={handleDeleteMajor} disabled={isSubmitting} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">
                {isSubmitting ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

const userFilters = [
  { id: 'all', label: 'Tất cả' },
  { id: 'active', label: 'Hoạt động' },
  { id: 'locked', label: 'Bị khóa' },
  { id: 'admin', label: 'Admin' },
  { id: 'user', label: 'User' },
];

const formatDateTime = (value) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa cập nhật';
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const StatsTab = () => {
  const [stats, setStats] = useState(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');

  const fetchStats = async () => {
    setIsStatsLoading(true);
    setStatsError('');
    try {
      const response = await api.get('/api/v1/admin/stats');
      setStats(response.data);
    } catch (error) {
      setStatsError(error.response?.data?.detail || 'Không thể tải thống kê hệ thống.');
    } finally {
      setIsStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Tổng người dùng', value: stats?.total_users ?? 0, icon: <User className="h-5 w-5" />, tone: 'bg-sky-50 text-sky-700' },
    { label: 'Đang hoạt động', value: stats?.active_users ?? 0, icon: <Unlock className="h-5 w-5" />, tone: 'bg-emerald-50 text-emerald-700' },
    { label: 'Bị khóa', value: stats?.locked_users ?? 0, icon: <Lock className="h-5 w-5" />, tone: 'bg-orange-50 text-orange-700' },
    { label: 'Ngành học', value: stats?.total_majors ?? 0, icon: <Database className="h-5 w-5" />, tone: 'bg-indigo-50 text-indigo-700' },
    { label: 'Lịch sử chat', value: stats?.total_chat_histories ?? 0, icon: <FileText className="h-5 w-5" />, tone: 'bg-purple-50 text-purple-700' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Thống kê hệ thống</h2>
          <p className="text-sm text-gray-500">Tổng quan dữ liệu người dùng, ngành học và lịch sử hỏi đáp.</p>
        </div>
        <button
          type="button"
          onClick={fetchStats}
          disabled={isStatsLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-xs font-bold text-[#0ea5e9] transition-colors hover:bg-blue-100 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isStatsLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {statsError && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          <AlertCircle className="h-5 w-5" />
          {statsError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${card.tone}`}>
              {card.icon}
            </div>
            <p className="text-sm font-semibold text-gray-500">{card.label}</p>
            <p className="mt-2 text-3xl font-black text-gray-900">{isStatsLoading && !stats ? '...' : card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-gray-900">Câu hỏi gần đây</h3>
            <p className="text-sm text-gray-500">5 câu hỏi mới nhất trong lịch sử chat.</p>
          </div>
        </div>

        {isStatsLoading && !stats ? (
          <div className="rounded-2xl bg-gray-50 px-4 py-8 text-center text-sm font-semibold text-gray-500">Đang tải câu hỏi gần đây...</div>
        ) : stats?.recent_questions?.length ? (
          <div className="divide-y divide-gray-100">
            {stats.recent_questions.map((item) => (
              <div key={item.id} className="py-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <p className="font-semibold text-gray-800">{item.question}</p>
                  <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-black uppercase text-gray-500">{item.status || 'Không rõ'}</span>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  User: {item.user_id || 'guest'} · {formatDateTime(item.created_at)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-gray-50 px-4 py-8 text-center text-sm font-semibold text-gray-500">Chưa có câu hỏi nào.</div>
        )}
      </div>
    </motion.div>
  );
};

const KnowledgeTab = () => {
  const [showComingSoon, setShowComingSoon] = useState(false);
  const documents = [];

  const openComingSoon = () => setShowComingSoon(true);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Quản lý Tài liệu Tri thức</h2>
          <p className="text-sm text-gray-500">Phần quản lý tri thức sẽ được kết nối với pipeline prepare/ingest ở phase RAG sau.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={openComingSoon}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#003366] px-4 py-2 text-sm font-bold text-white opacity-60"
          >
            <Plus className="h-4 w-4" />
            Upload tài liệu
          </button>
          <button
            type="button"
            onClick={openComingSoon}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-500 opacity-70"
          >
            <RefreshCw className="h-4 w-4" />
            Re-index
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
        Không có thao tác nào ở tab này chạy script Python hoặc gọi pipeline RAG trong phase hiện tại.
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-black text-gray-900">Danh sách tài liệu</h3>
          <p className="text-sm text-gray-500">Chưa kết nối kho tài liệu. Bảng này chỉ là shell UI.</p>
        </div>

        {documents.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <FileText className="h-7 w-7" />
            </div>
            <p className="font-bold text-gray-700">Chưa có tài liệu hiển thị</p>
            <p className="mt-1 text-sm text-gray-500">Tài liệu sẽ được quản lý sau khi nối với pipeline prepare/ingest.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-gray-50 text-xs font-black uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-4">Tên tài liệu</th>
                  <th className="px-6 py-4">Nguồn</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody />
            </table>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-black text-gray-900">Action shell</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {['Upload tài liệu', 'Re-index knowledge base', 'Xóa tài liệu'].map((action) => (
            <button
              key={action}
              type="button"
              onClick={openComingSoon}
              className="rounded-2xl border border-dashed border-gray-200 px-4 py-5 text-sm font-bold text-gray-400 hover:bg-gray-50"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {showComingSoon && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-gray-900">Tính năng đang phát triển</h3>
                <p className="mt-2 text-sm text-gray-500">Phần quản lý tri thức sẽ được kết nối với pipeline prepare/ingest ở phase RAG sau.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowComingSoon(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
                aria-label="Đóng thông báo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowComingSoon(false)}
              className="w-full rounded-xl bg-[#003366] px-4 py-3 text-sm font-bold text-white hover:bg-blue-900"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const AdminPage = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('users'); // Mình để mặc định mở tab Users cho bạn dễ test
  const [usersList, setUsersList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const tabs = [
    { id: 'stats', name: 'Thống kê báo cáo', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'knowledge', name: 'Tri thức Chatbot', icon: <FileText className="w-4 h-4" /> },
    { id: 'data', name: 'Dữ liệu hệ thống', icon: <Database className="w-4 h-4" /> },
    { id: 'users', name: 'Quản lý Người dùng', icon: <User className="w-4 h-4" /> },
  ];

  // Hàm tải danh sách user từ Backend
  const fetchUsers = async () => {
    setIsLoading(true);
    setUsersError('');
    try {
      const response = await api.get('/api/v1/auth/users');
      setUsersList(response.data);
    } catch (error) {
      setUsersError(error.response?.data?.detail || 'Không thể tải danh sách người dùng.');
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
  const showToast = (type, message) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 2500);
  };

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();

    return usersList.filter((account) => {
      if (userFilter === 'active' && !account.is_active) return false;
      if (userFilter === 'locked' && account.is_active) return false;
      if (userFilter === 'admin' && account.role !== 'admin') return false;
      if (userFilter === 'user' && account.role !== 'user') return false;

      if (!query) return true;

      return [account.name, account.email]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [userFilter, userSearch, usersList]);

  const setActionState = (key, value) => {
    setActionLoading((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleStatus = async (targetUser) => {
    if (targetUser.id === currentUser?.id) return;

    const key = `toggle-${targetUser.id}`;
    setActionState(key, true);

    try {
      await api.put(`/api/v1/auth/users/${targetUser.id}/toggle-status`);
      await fetchUsers();
      showToast('success', 'Đã cập nhật trạng thái tài khoản.');
    } catch (error) {
      showToast('error', error.response?.data?.detail || 'Có lỗi xảy ra khi cập nhật trạng thái.');
    } finally {
      setActionState(key, false);
    }
  };

  // Hàm xử lý Xóa tài khoản
  const handleDeleteUser = async () => {
    if (!deleteTarget || deleteTarget.id === currentUser?.id) return;

    const key = `delete-${deleteTarget.id}`;
    setActionState(key, true);

    try {
      await api.delete(`/api/v1/auth/users/${deleteTarget.id}`);
      await fetchUsers();
      showToast('success', 'Đã xóa người dùng.');
      setDeleteTarget(null);
    } catch (error) {
      showToast('error', error.response?.data?.detail || 'Có lỗi xảy ra khi xóa người dùng.');
    } finally {
      setActionState(key, false);
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
              {toast && (
                <div className={`mb-5 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold ${
                  toast.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {toast.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  {toast.message}
                </div>
              )}

              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Danh sách Tài khoản ({filteredUsers.length}/{usersList.length})</h2>
                  <p className="text-sm text-gray-500">Tìm kiếm, khóa/mở khóa và xóa tài khoản người dùng</p>
                </div>
                <button onClick={fetchUsers} disabled={isLoading} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-[#0ea5e9] rounded-xl font-bold text-xs hover:bg-blue-100 disabled:opacity-60 transition-colors">
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Làm mới
                </button>
              </div>

              <div className="mb-6 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Tìm theo tên hoặc email..."
                    className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-11 text-gray-700 outline-none focus:border-[#0ea5e9] focus:ring-2 focus:ring-[#0ea5e9]/20"
                  />
                  {userSearch && (
                    <button
                      type="button"
                      onClick={() => setUserSearch('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                      aria-label="Xóa tìm kiếm"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {userFilters.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setUserFilter(filter.id)}
                      className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                        userFilter === filter.id
                          ? 'bg-[#003366] text-white'
                          : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {usersError && (
                <div className="mb-5 flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  {usersError}
                </div>
              )}
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-400 text-xs uppercase tracking-widest border-b border-gray-50">
                      <th className="py-4 pr-4 font-black">ID</th>
                      <th className="py-4 font-black">Người dùng</th>
                      <th className="py-4 font-black">Vai trò</th>
                      <th className="py-4 font-black">Trạng thái</th>
                      <th className="py-4 font-black text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {isLoading ? (
                      <tr>
                        <td colSpan="5" className="text-center py-10 text-gray-400">Đang tải danh sách người dùng...</td>
                      </tr>
                    ) : filteredUsers.map((account) => {
                      const isSelf = account.id === currentUser?.id;
                      const toggleKey = `toggle-${account.id}`;
                      const deleteKey = `delete-${account.id}`;

                      return (
                      <tr key={account.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-4 pr-4 font-bold text-gray-400">#{account.id}</td>
                        <td className="py-4">
                          <p className="font-bold text-gray-700">{account.name}</p>
                          <p className="text-xs text-gray-400">{account.email}</p>
                        </td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            account.role === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {account.role}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            account.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                          }`}>
                            {account.is_active ? 'Hoạt động' : 'Bị Khóa'}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleToggleStatus(account)}
                              disabled={isSelf || actionLoading[toggleKey]}
                              title={isSelf ? 'Không thể tự khóa tài khoản của mình' : ''}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 disabled:opacity-45 disabled:cursor-not-allowed ${
                                account.is_active 
                                  ? 'bg-orange-50 text-orange-500 hover:bg-orange-100' 
                                  : 'bg-green-50 text-green-600 hover:bg-green-100'
                              }`}
                            >
                              {account.is_active ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                              {actionLoading[toggleKey] ? 'Đang xử lý' : account.is_active ? 'Khóa' : 'Mở khóa'}
                            </button>
                            
                            <button 
                              onClick={() => setDeleteTarget(account)}
                              disabled={isSelf || actionLoading[deleteKey]}
                              title={isSelf ? 'Không thể tự xóa tài khoản của mình' : ''}
                              className="px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors inline-flex items-center gap-1 disabled:opacity-45 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    )})}
                    {filteredUsers.length === 0 && !isLoading && (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-gray-400">Không có người dùng phù hợp.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </motion.div>
        )}

        {activeTab === 'knowledge' && (
          <KnowledgeTab />
        )}
        {activeTab === 'stats' && (
          <StatsTab />
        )}
        {activeTab === 'data' && (
          <MajorManagementTab />
        )}

      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-gray-800">Xóa tài khoản?</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Tài khoản <span className="font-bold text-gray-700">{deleteTarget.email}</span> sẽ bị xóa vĩnh viễn.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
                aria-label="Đóng xác nhận xóa"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={actionLoading[`delete-${deleteTarget.id}`]}
                className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60"
              >
                {actionLoading[`delete-${deleteTarget.id}`] ? 'Đang xóa...' : 'Xóa tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
