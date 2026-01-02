import {Bell, LogIn, Menu, Plus, Search, Zap} from 'lucide-react';

const Header = ({ toggleSidebar, user, onLogin,onOpenCreatePost }) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-black backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 z-50">
      {/* LEFT: Logo & Mobile Menu */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className=" p-2 text-zinc-400 hover:text-white transition-colors"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-3xl font-extrabold flex items-center gap-3 tracking-tight">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-black shadow-lg shadow-zinc-500/10 text-white border border-white/10">
            N
            <span className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full animate-pulse -mr-0.5 -mt-0.5 shadow-[0_0_10px_rgba(255,255,255,0.8)]"></span>
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500 hidden md:block">
            NEUTRON
          </span>
        </h1>
      </div>

      {/* CENTER: Search Bar */}
      <div className="flex-1 mx-2 md:mx-4 max-w-xl">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-0 group-focus-within:opacity-100 group-focus-within:animate-pulse transition duration-500 blur-[2px]"></div>

          {/* The Actual Input Container */}
          <div className="relative flex items-center bg-zinc-900 rounded-full group-focus-within:bg-black transition-colors">
            <Search
              className="absolute left-3 text-zinc-500 group-focus-within:text-blue-400 transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-transparent border-none rounded-full py-2 pl-10 pr-4 text-zinc-300 focus:outline-none placeholder:text-zinc-600 text-sm md:text-base relative z-10"
            />
          </div>
        </div>
      </div>

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {user && (
          <button
            onClick={onOpenCreatePost}
            className="hidden md:flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-full text-sm font-medium transition-all border border-white/5"
          >
            <Plus size={18} className="text-blue-400" />
            <span>Create</span>
          </button>
        )}
        {user && (
          <button
            onClick={onOpenCreatePost}
            className="md:hidden p-2 text-zinc-400 hover:text-white bg-zinc-800/50 rounded-full"
          >
            <Plus size={20} className="text-blue-400" />
          </button>
        )}
        <button className="text-zinc-400 hover:text-white transition-colors relative">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black"></span>
        </button>

        {user ? (
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-white leading-none">
                {user.name}
              </p>
              <p className="text-[10px] text-zinc-500 leading-none mt-1">
                {user.handle}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-900 border border-white/10 flex items-center justify-center text-white font-bold text-sm">
              {user.name?.charAt(0)}
            </div>
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-blue-500/20"
          >
            <LogIn size={16} /> <span className="hidden sm:inline">Login</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;