import { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Home, Loader2, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getFriendlyAuthError = (err, fallback) => {
  if (!err.response) {
    return 'Không thể kết nối backend. Vui lòng kiểm tra server API đang chạy.';
  }

  const detail = err.response?.data?.detail;

  if (typeof detail === 'string') {
    const normalized = detail.toLowerCase();

    if (normalized.includes('khóa') || normalized.includes('locked') || normalized.includes('inactive')) {
      return 'Tài khoản của bạn đang bị khóa. Vui lòng liên hệ quản trị viên.';
    }

    if (
      err.response.status === 401
      || normalized.includes('mật khẩu')
      || normalized.includes('password')
    ) {
      return 'Email hoặc mật khẩu không chính xác.';
    }

    return detail;
  }

  return fallback;
};

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotNotice, setShowForgotNotice] = useState(false);
  
  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();

  const validateForm = () => {
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail) {
      return 'Vui lòng nhập email.';
    }

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      return 'Email chưa đúng định dạng.';
    }

    if (!password) {
      return 'Vui lòng nhập mật khẩu.';
    }

    if (!isLogin) {
      if (!trimmedName) {
        return 'Vui lòng nhập họ và tên.';
      }

      if (password.length < 6) {
        return 'Mật khẩu cần có ít nhất 6 ký tự.';
      }

      if (!confirmPassword) {
        return 'Vui lòng xác nhận mật khẩu.';
      }

      if (password !== confirmPassword) {
        return 'Mật khẩu xác nhận không khớp.';
      }
    }

    return '';
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    if (isLogin) {
      try {
        await login({
          email: email.trim(),
          password,
        });
        navigate('/chat');
      } catch (err) {
        setError(getFriendlyAuthError(err, 'Email hoặc mật khẩu không chính xác.'));
      } finally {
        setIsSubmitting(false);
      }
    } else {
      try {
        const authData = await register({
          name: name.trim(),
          email: email.trim(),
          password,
        });

        if (authData?.access_token) {
          navigate('/chat');
          return;
        }

        setIsLogin(true);
        setPassword('');
        setConfirmPassword('');
        setSuccess('Đăng ký thành công. Vui lòng đăng nhập để tiếp tục.');
      } catch (err) {
        setError(getFriendlyAuthError(err, 'Đăng ký chưa thành công. Vui lòng kiểm tra thông tin và thử lại.'));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#002244] pt-24 pb-12 px-4">
      
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[0%] left-[-10%] w-[40%] h-[40%] bg-[#0ea5e9] rounded-full mix-blend-screen filter blur-[120px] opacity-40 animate-blob"></div>
        <div className="absolute bottom-[0%] right-[-10%] w-[50%] h-[50%] bg-[#8b5cf6] rounded-full mix-blend-screen filter blur-[150px] opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/15 backdrop-blur-2xl border border-white/30 p-8 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
          
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-4 hover:bg-white/30 transition-colors">
              <Home className="w-5 h-5 text-white" />
            </Link>
            <h2 className="text-3xl font-black text-white tracking-tight mb-2 drop-shadow-md">
              {isLogin ? 'Mừng trở lại!' : 'Tạo tài khoản'}
            </h2>
            <p className="text-blue-100 text-sm">
              {isLogin ? 'Đăng nhập để xem lịch sử tư vấn' : 'Trải nghiệm Chatbot tư vấn tuyển sinh UIT'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.form 
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleAuthSubmit}
              noValidate
              className="space-y-4"
            >
              {error && (
                <div className="text-red-100 text-sm font-bold text-center bg-red-500/25 py-3 px-4 rounded-2xl mb-4 border border-red-300/30">
                  {error}
                </div>
              )}
              {success && (
                <div className="text-emerald-100 text-sm font-bold text-center bg-emerald-500/25 py-3 px-4 rounded-2xl mb-4 border border-emerald-300/30">
                  {success}
                </div>
              )}

              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/80" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Họ và tên" 
                    className="w-full bg-white/20 border border-white/40 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white/30 transition-all"
                  />
                </div>
              )}
              
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/80" />
                <input 
                  type="text"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email" 
                  className="w-full bg-white/20 border border-white/40 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white/30 transition-all"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/80" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mật khẩu" 
                  className="w-full bg-white/20 border border-white/40 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white/30 transition-all"
                />
              </div>

              {!isLogin && (
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/80" />
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Xác nhận mật khẩu" 
                    className="w-full bg-white/20 border border-white/40 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white/30 transition-all"
                  />
                </div>
              )}

              {isLogin && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotNotice(true)}
                    className="text-sm text-blue-100 hover:text-white transition-colors"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-[#0ea5e9] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-400 hover:shadow-[0_0_20px_rgba(14,165,233,0.5)] transition-all hover:-translate-y-0.5 mt-6 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    {isLogin ? 'Đăng nhập' : 'Đăng ký ngay'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </motion.form>
          </AnimatePresence>
          <div className="mt-8 text-center text-sm text-blue-100">
            {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
            <button 
              onClick={() => {
                setIsLogin(!isLogin); // Lật trạng thái Đăng nhập/Đăng ký
                // Reset toàn bộ các ô nhập liệu và thông báo lỗi
                setError('');
                setSuccess('');
                setEmail('');
                setPassword('');
                setName('');
                setConfirmPassword('');
              }}
              className="text-white font-bold hover:underline"
            >
              {isLogin ? 'Đăng ký' : 'Đăng nhập'}
            </button>
          </div>

        </div>
      </motion.div>

      <AnimatePresence>
        {showForgotNotice && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setShowForgotNotice(false)}
                className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
                aria-label="Đóng thông báo"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#0ea5e9]">
                <Lock className="h-7 w-7" />
              </div>
              <h3 className="mb-2 text-xl font-black text-[#003366]">Quên mật khẩu</h3>
              <p className="mb-6 text-sm leading-6 text-gray-500">
                Tính năng quên mật khẩu đang được phát triển.
              </p>
              <button
                type="button"
                onClick={() => setShowForgotNotice(false)}
                className="w-full rounded-2xl bg-[#0ea5e9] py-3 font-bold text-white hover:bg-blue-600"
              >
                Đã hiểu
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
