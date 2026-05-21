import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpenCheck,
  Bot,
  ClipboardList,
  DatabaseZap,
  GraduationCap,
  History,
  LogIn,
  MessageCircleQuestion,
  Search,
  ShieldCheck,
  SplitSquareHorizontal,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import heroImage from '../assets/hero.png';

const sampleQuestions = [
  'UIT có những ngành nào?',
  'Học phí UIT khoảng bao nhiêu?',
  'Ngành Kỹ thuật phần mềm học gì?',
  'Ngành Khoa học dữ liệu phù hợp với ai?',
  'Tổ hợp xét tuyển của ngành An toàn thông tin là gì?',
];

const features = [
  {
    title: 'Hỏi đáp tuyển sinh',
    description: 'Đặt câu hỏi tự nhiên về phương thức xét tuyển, mốc thời gian và thông tin nhập học.',
    icon: MessageCircleQuestion,
  },
  {
    title: 'Tra cứu ngành học',
    description: 'Tìm nhanh ngành đào tạo, định hướng học tập, học phí và tổ hợp xét tuyển.',
    icon: Search,
  },
  {
    title: 'So sánh ngành',
    description: 'Đối chiếu các lựa chọn quan tâm để hiểu sự khác nhau về nội dung và định hướng.',
    icon: SplitSquareHorizontal,
  },
  {
    title: 'Lưu lịch sử tư vấn',
    description: 'Theo dõi lại các trao đổi đã hỏi để tiếp tục hành trình chọn ngành thuận tiện hơn.',
    icon: History,
  },
];

const stats = [
  { label: 'Ngành đào tạo', value: 'UIT' },
  { label: 'Tra cứu', value: '24/7' },
  { label: 'Nguồn dữ liệu', value: 'RAG' },
];

const HomePage = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const chatTarget = isAuthenticated ? '/chat' : '/login';

  const handleSampleQuestion = (question) => {
    localStorage.setItem('prefill_chat_message', question);
    navigate('/chat', { state: { prefillQuestion: question } });
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#f8fafc] text-slate-900">
      <section className="relative border-b border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#eef6ff_45%,#f2fbf7_100%)] px-4 pb-16 pt-32 sm:px-6 lg:px-8 lg:pb-20">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-wide text-[#003366] shadow-sm">
              <ShieldCheck className="h-4 w-4 text-[#0ea5e9]" />
              Demo tư vấn tuyển sinh UIT
            </div>

            <h1 className="text-4xl font-black leading-tight tracking-normal text-[#003366] sm:text-5xl lg:text-6xl">
              UIT Admission Chatbot
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Trợ lý tư vấn tuyển sinh UIT, hỗ trợ tra cứu ngành học, học phí, tổ hợp xét tuyển và thông tin tuyển sinh.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to={chatTarget}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#003366] px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-[#004987] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]/60"
              >
                <Bot className="h-5 w-5" />
                Bắt đầu hỏi chatbot
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/lookup"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-black text-[#003366] shadow-sm transition hover:-translate-y-0.5 hover:border-[#0ea5e9]/40 hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]/60"
              >
                <Search className="h-5 w-5 text-[#0ea5e9]" />
                Tra cứu ngành học
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-6 py-3.5 text-sm font-black text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-[#003366] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]/60"
                >
                  <LogIn className="h-5 w-5" />
                  Đăng nhập
                </Link>
              )}
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {stats.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white bg-white/70 p-4 shadow-sm">
                  <div className="text-lg font-black text-[#003366]">{item.value}</div>
                  <div className="mt-1 text-xs font-bold text-slate-500">{item.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="relative"
          >
            <div className="rounded-[2rem] border border-white bg-white/75 p-4 shadow-2xl shadow-slate-300/50 backdrop-blur-xl sm:p-6">
              <div className="rounded-[1.5rem] bg-[#003366] p-5 text-white">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-sky-200">Assistant preview</p>
                    <h2 className="mt-1 text-xl font-black">Tư vấn tuyển sinh nhanh</h2>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                    <Bot className="h-6 w-6" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="max-w-[86%] rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-700">
                    Bạn có thể hỏi về ngành học, học phí, tổ hợp xét tuyển và định hướng phù hợp.
                  </div>
                  <div className="ml-auto max-w-[82%] rounded-2xl rounded-tr-sm bg-[#0ea5e9] px-4 py-3 text-sm font-semibold leading-6">
                    Ngành Kỹ thuật phần mềm học gì?
                  </div>
                  <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-700">
                    Chatbot sẽ tổng hợp câu trả lời từ dữ liệu tri thức tuyển sinh đã được chuẩn bị.
                  </div>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <BookOpenCheck className="h-5 w-5 text-emerald-600" />
                  <p className="mt-3 text-sm font-black text-slate-800">Tra cứu có cấu trúc</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Thông tin ngành học được trình bày dễ quét.</p>
                </div>
                <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <img src={heroImage} alt="" className="absolute -right-6 -top-7 h-28 w-28 opacity-40" />
                  <ClipboardList className="relative h-5 w-5 text-[#0ea5e9]" />
                  <p className="relative mt-3 text-sm font-black text-slate-800">Phù hợp demo</p>
                  <p className="relative mt-1 text-xs leading-5 text-slate-500">Đủ nhanh để thử các luồng tuyển sinh chính.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-[#0ea5e9]">What can you ask?</p>
              <h2 className="mt-2 text-3xl font-black tracking-normal text-[#003366]">Câu hỏi mẫu để bắt đầu</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-500">
              Chọn một câu hỏi để chuyển sang chatbot và điền sẵn nội dung vào ô nhập.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {sampleQuestions.map((question, index) => (
              <motion.button
                key={question}
                type="button"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: index * 0.04, duration: 0.35 }}
                onClick={() => handleSampleQuestion(question)}
                className="group flex min-h-36 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#0ea5e9]/50 hover:shadow-xl hover:shadow-sky-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]/60"
              >
                <GraduationCap className="h-6 w-6 text-[#0ea5e9]" />
                <span className="mt-5 text-sm font-black leading-6 text-slate-800">{question}</span>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[#003366]">
                  Hỏi ngay
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-black uppercase tracking-wide text-emerald-600">Features</p>
            <h2 className="mt-2 text-3xl font-black tracking-normal text-[#003366]">Một nơi cho các nhu cầu tư vấn chính</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div key={feature.title} className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#0ea5e9] shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-black text-slate-900">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[#0ea5e9]">
                <DatabaseZap className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#003366]">Dữ liệu có thể được cập nhật bởi quản trị viên thông qua trang quản lý tri thức.</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Phase này chỉ hiển thị gợi ý về dữ liệu, chưa cần nối thêm backend.
                </p>
              </div>
            </div>
            <div className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600">
              <ClipboardList className="h-4 w-4" />
              Quản lý tri thức
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] bg-[#003366] px-6 py-10 text-white shadow-2xl shadow-blue-950/20 sm:px-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-sky-200">Sẵn sàng khám phá UIT?</p>
              <h2 className="mt-2 text-3xl font-black tracking-normal">Bắt đầu với ngành học hoặc hỏi chatbot ngay.</h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/lookup"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-[#003366] transition hover:-translate-y-0.5 hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <Search className="h-5 w-5" />
                Khám phá ngành học UIT
              </Link>
              <Link
                to={chatTarget}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <Bot className="h-5 w-5" />
                Hỏi chatbot ngay
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
