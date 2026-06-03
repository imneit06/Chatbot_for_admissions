import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  FileSearch,
  GraduationCap,
  History,
  LogIn,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import heroImage from '../assets/uit-campus.jpg';

const highlights = [
  {
    title: 'Tìm nhanh thông tin ngành',
    description: 'Xem mã ngành, chỉ tiêu, tổ hợp xét tuyển, học phí và mô tả ngành theo dữ liệu đã chuẩn bị.',
    icon: <Search className="h-5 w-5" />,
  },
  {
    title: 'Hỏi như đang tư vấn trực tiếp',
    description: 'Nhập câu hỏi bằng tiếng Việt tự nhiên về tuyển sinh, chương trình đào tạo hoặc học bổng UIT.',
    icon: <Bot className="h-5 w-5" />,
  },
  {
    title: 'Câu trả lời có nguồn tham khảo',
    description: 'Chatbot truy xuất từ kho tài liệu RAG và hiển thị nguồn để bạn kiểm tra lại khi cần.',
    icon: <FileSearch className="h-5 w-5" />,
  },
];

const steps = [
  'Bắt đầu bằng trang Tra cứu nếu bạn chỉ muốn xem nhanh thông tin ngành.',
  'Đăng nhập hoặc đăng ký tài khoản khi bạn muốn hỏi chatbot chi tiết hơn.',
  'Sau khi đăng nhập, hệ thống lưu lịch sử để bạn xem lại các câu trả lời quan trọng.',
];

const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen overflow-hidden bg-[#f8fafc] text-gray-800">
      <section className="relative min-h-[92vh] px-4 pt-32 pb-16 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#eef7ff_0%,#ffffff_46%,#e9f8f3_100%)]" />
        <div className="pointer-events-none absolute inset-y-0 right-[-16vw] hidden w-[72vw] lg:block">
          <div className="absolute inset-0 bg-[#0ea5e9]/10 blur-3xl" />
          <div className="relative h-full overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-[78%_center]"
              style={{
                backgroundImage: `url(${heroImage})`,
                WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.05) 11%, rgba(0,0,0,0.48) 34%, #000 62%)',
                maskImage: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.05) 11%, rgba(0,0,0,0.48) 34%, #000 62%)',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#eef7ff] via-white/42 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-transparent to-[#001a33]/42" />
            <div className="absolute inset-y-0 left-0 w-[34%] bg-gradient-to-r from-[#eef7ff] via-[#eef7ff]/78 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc]/35 to-transparent" />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#f8fafc] to-transparent" />

        <div className="relative z-10 mx-auto flex min-h-[calc(92vh-12rem)] max-w-7xl flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-3xl"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/70 px-4 py-2 text-xs font-black uppercase text-[#0b5c94] shadow-sm backdrop-blur-md">
              <GraduationCap className="h-4 w-4 text-[#0ea5e9]" />
              UIT Admission Assistant
            </div>

            <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-normal text-[#003366] sm:text-5xl lg:text-7xl">
              Trợ lý tra cứu và tư vấn tuyển sinh UIT.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-gray-600 sm:text-lg">
              Tìm thông tin ngành học, phương thức xét tuyển, học phí và chương trình đào tạo từ kho dữ liệu tuyển sinh đã được hệ thống hóa.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to={isAuthenticated ? '/chat' : '/login'}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#003366] px-6 py-4 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-[#02477f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]/70"
              >
                {isAuthenticated ? 'Vào chatbot' : 'Đăng nhập để hỏi chatbot'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/lookup"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white/80 px-6 py-4 text-sm font-black text-[#003366] shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]/50"
              >
                <Search className="h-4 w-4" />
                Tra cứu ngành ngay
              </Link>
            </div>
          </motion.div>

          <div className="mt-14 grid max-w-5xl grid-cols-1 gap-3 md:grid-cols-3">
            {highlights.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 + index * 0.08 }}
                className="rounded-2xl border border-white/80 bg-white/75 p-5 shadow-sm backdrop-blur-md"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0ea5e9]">
                  {item.icon}
                </div>
                <h2 className="text-base font-black text-[#003366]">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-500">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="mb-3 text-sm font-black uppercase text-[#0ea5e9]">Dành cho khách truy cập</p>
            <h2 className="text-3xl font-black text-[#003366] sm:text-4xl">Bắt đầu nhanh mà không cần đăng nhập.</h2>
            <p className="mt-5 text-base leading-8 text-gray-600">
              Nếu bạn chỉ cần xem danh sách ngành, hãy dùng trang Tra cứu. Khi cần hỏi sâu hơn, đăng nhập để chatbot có thể lưu lịch sử tư vấn và hỗ trợ các câu hỏi nối tiếp.
            </p>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <div className="mb-5 flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <p className="text-xs font-black uppercase text-gray-400">Cách sử dụng</p>
                <h3 className="text-xl font-black text-[#003366]">Luồng tư vấn gọn gàng</h3>
              </div>
              <ShieldCheck className="h-8 w-8 text-emerald-500" />
            </div>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step} className="flex gap-3 rounded-2xl bg-gray-50 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-[#0ea5e9] shadow-sm">
                    {index + 1}
                  </div>
                  <p className="pt-1 text-sm font-bold leading-6 text-gray-600">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 md:grid-cols-3">
          <div className="rounded-3xl bg-[#003366] p-7 text-white shadow-lg shadow-blue-900/15">
            <BookOpen className="mb-5 h-8 w-8 text-[#7dd3fc]" />
            <h3 className="text-xl font-black">Dữ liệu tuyển sinh</h3>
            <p className="mt-3 text-sm leading-6 text-blue-100">Tổng hợp thông tin từ đề án tuyển sinh, tài liệu ngành học và dữ liệu quản trị.</p>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm">
            <Bot className="mb-5 h-8 w-8 text-[#0ea5e9]" />
            <h3 className="text-xl font-black text-[#003366]">Chatbot RAG</h3>
            <p className="mt-3 text-sm leading-6 text-gray-500">Truy xuất tài liệu liên quan trước khi sinh câu trả lời, hạn chế trả lời ngoài dữ liệu.</p>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white p-7 shadow-sm">
            <History className="mb-5 h-8 w-8 text-[#0ea5e9]" />
            <h3 className="text-xl font-black text-[#003366]">Theo dõi lịch sử</h3>
            <p className="mt-3 text-sm leading-6 text-gray-500">Các phiên hỏi đáp sau khi đăng nhập được lưu lại để tiếp tục tra cứu khi cần.</p>
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-3xl bg-white p-7 shadow-[0_14px_40px_rgba(15,23,42,0.06)] md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              Sẵn sàng tư vấn
            </div>
            <h2 className="text-2xl font-black text-[#003366]">Bạn muốn hỏi chi tiết về ngành hoặc phương thức xét tuyển?</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">Đăng nhập hoặc đăng ký tài khoản để bắt đầu phiên tư vấn với chatbot.</p>
          </div>
          <Link
            to={isAuthenticated ? '/chat' : '/login'}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#0ea5e9] px-6 py-4 text-sm font-black text-white shadow-lg shadow-sky-500/20 transition hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003366]/30"
          >
            {isAuthenticated ? <Bot className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            {isAuthenticated ? 'Mở chatbot' : 'Đăng nhập / Đăng ký'}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
