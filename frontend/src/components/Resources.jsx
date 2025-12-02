import { Menu } from "lucide-react";

function Resources({toggleSidebar}){
    return (
      <main className="fixed top-16 flex-1 w-full p-10 text-white lg:ml-72">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 bg-zinc-900 rounded-xl text-zinc-400 mb-4"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-2xl font-bold">Notes Library</h1>
        <p className="text-zinc-500 mt-2">Folder structure coming soon...</p>
      </main>
    );
}
export default Resources;