import { ImageIcon, Plus, ShoppingBag,Menu } from "lucide-react";
import { useEffect } from "react";
import { useState } from "react";
import axios from "axios";

const MarketPage = ({ isSidebarOpen }) => {
  const [listings, setListings] = useState([]);
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/listings")
      .then((res) => setListings(res.data))
      .catch(console.error);
  }, []);

  return (
    <main
      className={`flex-1 w-full transition-all duration-300 p-6 pt-24 overflow-y-auto no-scrollbar ${
        isSidebarOpen ? "lg:ml-72" : "lg:ml-0"
      }`}
    >
      <div className="max-w-4xl mx-auto pb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="text-blue-500" /> Marketplace
          </h2>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-500">
            <Plus size={16} /> Sell
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => (
            <div
              key={item._id}
              className="bg-black border border-white/10 rounded-xl overflow-hidden group hover:border-blue-500/50 transition-all"
            >
              <div className="h-40 bg-zinc-800 flex items-center justify-center text-zinc-600">
                <ImageIcon size={40} />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-white truncate">
                    {item.title}
                  </h3>
                  <span className="text-green-400 font-mono font-bold">
                    ${item.price}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-1 mb-4 line-clamp-2">
                  {item.desc}
                </p>
                <button className="w-full bg-zinc-900 text-zinc-300 py-2 rounded-lg text-sm font-bold hover:bg-white hover:text-black transition-colors">
                  Contact Seller
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};
export default MarketPage;