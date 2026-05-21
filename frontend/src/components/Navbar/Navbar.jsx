import { useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bot, History, Home, Search, LayoutDashboard, LogIn, LogOut } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hoveredPath, setHoveredPath] = useState(location.pathname);
  
  // Lấy thông tin user và hàm logout từ Context
  const { user, logout } = useContext(AuthContext);

  const isDarkPage = location.pathname === '/login';

  // Lọc danh sách tab cơ bản
  const navItems = [
    { path: '/', name: 'Trang chủ', icon: <Home className="w-4 h-4" />, activePaths: ['/', '/home'] },
    { path: '/chat', name: 'Chatbot', icon: <Bot className="w-4 h-4" /> },
    { path: '/lookup', name: 'Tra cứu', icon: <Search className="w-4 h-4" /> },
    { path: '/history', name: 'Lịch sử', icon: <History className="w-4 h-4" /> },
  ];

  // Nếu user đăng nhập và có quyền admin thì mới thấy tab Quản trị
  if (user && user.role === 'admin') {
    navItems.push({ path: '/admin', name: 'Quản trị', icon: <LayoutDashboard className="w-4 h-4" /> });
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-3 sm:top-6 sm:px-4">
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`relative w-full max-w-[calc(100vw-1.5rem)] overflow-x-auto backdrop-blur-xl border shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] rounded-2xl px-2 py-2 flex items-center gap-1 transition-all duration-500 sm:w-auto sm:rounded-full ${
          isDarkPage ? 'bg-white/10 border-white/10' : 'bg-white/40 border-white/20 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.25)]'
        }`}
        aria-label="Điều hướng chính"
      >
        {/* Brand Logo */}
        <Link to="/" className={`flex shrink-0 items-center gap-2 px-3 pr-4 border-r group sm:px-4 sm:pr-6 ${isDarkPage ? 'border-white/20' : 'border-gray-200/30'}`} aria-label="UIT Admission home">
          <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-[#003366] to-[#0ea5e9] flex items-center justify-center overflow-hidden">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-white/10"
            />
            <span className="relative font-black text-white text-[10px]">UIT</span>
          </div>
          <span className={`font-bold text-xs hidden md:block transition-colors ${isDarkPage ? 'text-white' : 'text-[#003366]'}`}>ADMISSION</span>
        </Link>

        {/* Navigation Items */}
        <div className="flex shrink-0 items-center gap-1 relative">
          {navItems.map((item) => {
            const isActive = item.activePaths?.includes(location.pathname) || location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onMouseEnter={() => setHoveredPath(item.path)}
                onMouseLeave={() => setHoveredPath(location.pathname)}
                aria-current={isActive ? 'page' : undefined}
                title={item.name}
                className={`relative px-3 py-2 rounded-full text-xs font-bold transition-colors duration-300 flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]/60 sm:px-4 ${
                  isActive 
                    ? (isDarkPage ? 'text-[#38bdf8]' : 'text-[#0ea5e9]') 
                    : (isDarkPage ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-800')
                }`}
              >
                {hoveredPath === item.path && (
                  <motion.div
                    layoutId="navbar-highlight"
                    className={`absolute inset-0 rounded-full -z-10 ${isDarkPage ? 'bg-white/10' : 'bg-blue-50/80'}`}
                    transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                  />
                )}
                
                {item.icon}
                <span className="hidden sm:inline">{item.name}</span>
                
                {isActive && (
                  <motion.div 
                    layoutId="active-dot"
                    className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isDarkPage ? 'bg-[#38bdf8]' : 'bg-[#0ea5e9]'}`}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Cụm Đăng Nhập / Thông tin tài khoản */}
        <div className="ml-auto flex shrink-0 items-center gap-2 border-l border-gray-200/30 pl-3 sm:pl-4">
          {user ? (
            <div className="flex items-center gap-3 pr-2">
              <span className={`text-sm font-bold hidden sm:block ${isDarkPage ? 'text-white' : 'text-[#003366]'}`}>
                Chào, {user.name.split(' ').pop()}
              </span>
              <button onClick={handleLogout} className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-red-300" title="Đăng xuất" aria-label="Đăng xuất">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            !isDarkPage && (
              <Link to="/login" className="relative group overflow-hidden flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-full text-xs font-bold transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-900/20 outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9]/60 sm:px-5">
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Đăng nhập</span>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                  animate={{ translateX: '200%' }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                />
              </Link>
            )
          )}
        </div>
      </motion.nav>
    </div>
  );
};

export default Navbar;
