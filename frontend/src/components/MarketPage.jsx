import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  ShoppingBag,
  Plus,
  X,
  Search,
  Filter,
  MapPin,
  Phone,
  Mail,
  Zap,
  Loader,
  Trash2,
  Edit2,
  Image as ImageIcon,
} from "lucide-react";

const MarketPage = ({ isSidebarOpen, currentUser, token }) => {
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedCondition, setSelectedCondition] = useState("ALL");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "BOOKS",
    condition: "GOOD",
    image: "",
  });

  const API_URL = "http://localhost:5000/api";
  const categories = ["BOOKS", "LAPTOPS", "PHONES", "ACCESSORIES", "OTHER"];
  const conditions = ["LIKE_NEW", "GOOD", "FAIR"];

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    filterListings();
  }, [listings, searchTerm, selectedCategory, selectedCondition]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/listings`);
      setListings(res.data);
    } catch (err) {
      console.error("Error fetching listings:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterListings = () => {
    let filtered = listings;

    if (selectedCategory !== "ALL") {
      filtered = filtered.filter((l) => l.category === selectedCategory);
    }

    if (selectedCondition !== "ALL") {
      filtered = filtered.filter((l) => l.condition === selectedCondition);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (l) =>
          l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    filtered = filtered.filter((l) => l.status === "AVAILABLE");
    setFilteredListings(filtered);
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      alert("Please log in to create a listing");
      return;
    }

    const authToken = token || localStorage.getItem("token");
    if (!authToken) {
      alert("Authentication required");
      return;
    }

    try {
      const config = {
        headers: { Authorization: `Bearer ${authToken}` },
      };

      const dataToSend = {
        ...formData,
        price: parseFloat(formData.price),
        image:
          formData.image ||
          `https://via.placeholder.com/300x300?text=${encodeURIComponent(
            formData.category
          )}`,
      };

      const res = await axios.post(`${API_URL}/listings`, dataToSend, config);

      setListings([res.data, ...listings]);
      setFormData({
        title: "",
        description: "",
        price: "",
        category: "BOOKS",
        condition: "GOOD",
        image: "",
      });
      setShowCreateModal(false);
      alert("Listing created successfully!");
    } catch (err) {
      console.error("Error creating listing:", err);
      alert("Failed to create listing");
    }
  };

  const handleDeleteListing = async (id) => {
    if (!window.confirm("Are you sure you want to delete this listing?"))
      return;

    const authToken = token || localStorage.getItem("token");
    if (!authToken) {
      alert("Authentication required");
      return;
    }

    try {
      const config = {
        headers: { Authorization: `Bearer ${authToken}` },
      };

      await axios.delete(`${API_URL}/listings/${id}`, config);
      setListings(listings.filter((l) => l._id !== id));
      setShowDetailModal(false);
      alert("Listing deleted successfully!");
    } catch (err) {
      console.error("Error deleting listing:", err);
      alert("Failed to delete listing");
    }
  };

  const canDeleteListing = (listing) => {
    return currentUser && currentUser._id === listing.seller._id;
  };

  return (
    <div
      className={`flex-1 w-full transition-all duration-300 pt-20 pb-10 overflow-y-auto bg-[#0f172a] ${
        isSidebarOpen ? "lg:ml-72" : "lg:ml-0"
      }`}
    >
      {/* Create Listing Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Create Listing</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-zinc-900 rounded-lg transition-colors"
              >
                <X size={24} className="text-white" />
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Item Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Python Programming Book"
                  required
                  className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe your item..."
                  required
                  rows="3"
                  className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="500"
                    required
                    className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Condition
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) =>
                    setFormData({ ...formData, condition: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  {conditions.map((cond) => (
                    <option key={cond} value={cond}>
                      {cond.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Create Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Listing Detail Modal */}
      {showDetailModal && selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowDetailModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-zinc-900 rounded-lg transition-colors z-10"
            >
              <X size={24} className="text-white" />
            </button>

            <div className="max-h-96 overflow-y-auto">
              {/* Image */}
              <div className="h-64 bg-zinc-800 flex items-center justify-center text-zinc-600 overflow-hidden">
                {selectedListing.image ? (
                  <img
                    src={selectedListing.image}
                    alt={selectedListing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon size={80} />
                )}
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {selectedListing.title}
                  </h2>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-bold text-green-400">
                      ₹{selectedListing.price}
                    </span>
                    <span className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-sm font-medium">
                      {selectedListing.category}
                    </span>
                    <span className="px-3 py-1 bg-yellow-600/20 text-yellow-300 rounded-full text-sm font-medium">
                      {selectedListing.condition.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-zinc-400 font-medium mb-2">
                    Description
                  </h3>
                  <p className="text-zinc-300">{selectedListing.description}</p>
                </div>

                {/* Seller Info */}
                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-zinc-400 font-medium mb-3">Seller</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                        {selectedListing.seller.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {selectedListing.seller.name}
                        </p>
                        <p className="text-zinc-500 text-sm flex items-center gap-1">
                          <MapPin size={14} />
                          {selectedListing.seller.college}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {selectedListing.seller.phoneNumber && (
                        <a
                          href={`tel:${selectedListing.seller.phoneNumber}`}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-300 rounded-lg hover:bg-green-600/30 transition-colors"
                        >
                          <Phone size={18} />
                          {selectedListing.seller.phoneNumber}
                        </a>
                      )}
                      {selectedListing.seller.email && (
                        <a
                          href={`mailto:${selectedListing.seller.email}`}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/30 transition-colors"
                        >
                          <Mail size={18} />
                          {selectedListing.seller.email}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div className="border-t border-white/10 pt-4 flex items-center gap-4 text-sm text-zinc-500">
                  <span>👁️ {selectedListing.views} views</span>
                  <span>
                    📅{" "}
                    {new Date(selectedListing.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Delete Button */}
                {canDeleteListing(selectedListing) && (
                  <button
                    onClick={() => {
                      handleDeleteListing(selectedListing._id);
                    }}
                    className="w-full mt-4 px-4 py-2 bg-red-600/20 text-red-300 hover:bg-red-600/30 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Trash2 size={18} />
                    Delete Listing
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <ShoppingBag size={32} className="text-blue-500" />
            Marketplace
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Sell Item
          </button>
        </div>

        {/* Filters */}
        <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search size={20} className="absolute left-3 top-3 text-zinc-600" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Category & Condition Filters */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
              >
                <option value="ALL">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-2 block">
                Condition
              </label>
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 text-sm"
              >
                <option value="ALL">All Conditions</option>
                {conditions.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-zinc-400">
              <Loader size={24} className="animate-spin" />
              <span>Loading listings...</span>
            </div>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag
              size={48}
              className="mx-auto text-zinc-600 mb-4 opacity-50"
            />
            <p className="text-zinc-400 text-lg">No listings found</p>
            <p className="text-zinc-600 text-sm mt-1">
              Try adjusting your filters or create a new listing
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <div
                key={listing._id}
                onClick={() => {
                  setSelectedListing(listing);
                  setShowDetailModal(true);
                }}
                className="group bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-blue-500/10"
              >
                {/* Image */}
                <div className="h-48 bg-zinc-800 flex items-center justify-center text-zinc-600 overflow-hidden group-hover:scale-105 transition-transform">
                  {listing.image ? (
                    <img
                      src={listing.image}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon size={48} />
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                      {listing.title}
                    </h3>
                    <p className="text-sm text-zinc-500 line-clamp-2 mt-1">
                      {listing.description}
                    </p>
                  </div>

                  {/* Price & Category */}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-green-400">
                      ₹{listing.price}
                    </span>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded text-xs font-medium">
                        {listing.category}
                      </span>
                      <span className="px-2 py-1 bg-yellow-600/20 text-yellow-300 rounded text-xs font-medium">
                        {listing.condition.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  {/* Seller Info */}
                  <div className="border-t border-white/5 pt-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {listing.seller.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">
                        {listing.seller.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {listing.seller.college}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketPage;
