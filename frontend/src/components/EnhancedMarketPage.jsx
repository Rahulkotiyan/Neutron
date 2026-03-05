import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import ListingDetailModal from "./ListingDetailModal";
import {
  Search,
  Filter,
  MapPin,
  Phone,
  Mail,
  Heart,
  Camera,
  MediaVideo,
  Star,
  Shield,
  Clock,
  ArrowDown,
  X,
  Plus,
  Edit,
  Trash,
  Message,
  Eye,
  Calendar,
  Dollar,
  Package,
  User,
  CheckCircle,
  WarningTriangle,
  ArrowLeft,
  ArrowRight,
  ViewGrid,
  List,
  Bell,
  DeliveryTruck,
} from "iconoir-react";
import CustomDropdown from "./CustomDropdown";
import CustomModal from "./CustomModal";

const EnhancedMarketPage = ({ isSidebarOpen, currentUser, token }) => {
  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [savedListings, setSavedListings] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "ALL",
    subcategory: "",
    minPrice: "",
    maxPrice: "",
    condition: "",
    brand: "",
    negotiable: "",
    deliveryAvailable: "",
    urgent: "",
    featured: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Form states for creating listing
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    originalPrice: "",
    category: "ELECTRONICS",
    subcategory: "",
    brand: "",
    model: "",
    year: "",
    condition: "GOOD",
    usage: "",
    negotiable: true,
    deliveryAvailable: false,
    shippingAvailable: false,
    warranty: "",
    returnPolicy: "",
    specifications: {},
    tags: [],
    urgent: false,
    images: [],
    location: {
      address: "",
      city: "",
      state: "",
      pincode: "",
      landmark: "",
    },
  });

  const API_URL = "http://localhost:5000/api";

  const categoriesList = [
    { value: "ALL", label: "All Categories", icon: ViewGrid },
    { value: "ELECTRONICS", label: "Electronics", icon: Package },
    { value: "MOBILES", label: "Mobile Phones", icon: Phone },
    { value: "VEHICLES", label: "Vehicles", icon: Truck },
    { value: "BICYCLES", label: "Bicycles", icon: Package },
    { value: "BOOKS", label: "Books", icon: Package },
    { value: "FURNITURE", label: "Furniture", icon: Package },
    { value: "FASHION", label: "Fashion", icon: Package },
    { value: "PETS", label: "Pets", icon: Package },
    { value: "SPORTS", label: "Sports", icon: Package },
    { value: "SERVICES", label: "Services", icon: Package },
    { value: "JOBS", label: "Jobs", icon: Package },
    { value: "REAL_ESTATE", label: "Real Estate", icon: Package },
    { value: "ACCOMMODATION", label: "Accommodation", icon: Package },
    { value: "OTHER", label: "Other", icon: Package },
  ];

  const conditions = [
    { value: "NEW", label: "New", color: "green" },
    { value: "LIKE_NEW", label: "Like New", color: "blue" },
    { value: "EXCELLENT", label: "Excellent", color: "purple" },
    { value: "GOOD", label: "Good", color: "yellow" },
    { value: "FAIR", label: "Fair", color: "orange" },
    { value: "POOR", label: "Poor", color: "red" },
  ];

  useEffect(() => {
    fetchListings();
    fetchCategories();
    if (currentUser) {
      fetchSavedListings();
    }
  }, [currentPage, filters, searchTerm]);

  useEffect(() => {
    if (searchTerm.length > 2) {
      fetchSearchSuggestions();
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "ALL" && value !== "") {
          params.append(key, value);
        }
      });

      if (searchTerm) params.append("search", searchTerm);
      params.append("page", currentPage);
      params.append("limit", 20);

      const res = await axios.get(`${API_URL}/marketplace/listings?${params}`);
      setListings(res.data.listings);
      setTotalPages(res.data.pagination.pages);
    } catch (err) {
      console.error("Error fetching listings:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/marketplace/categories`);
      setCategories(res.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchSavedListings = async () => {
    try {
      const res = await axios.get(`${API_URL}/marketplace/saved/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSavedListings(res.data.map((item) => item._id));
    } catch (err) {
      console.error("Error fetching saved listings:", err);
    }
  };

  const fetchSearchSuggestions = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/marketplace/suggestions?query=${searchTerm}`,
      );
      setSearchSuggestions(res.data);
      setShowSuggestions(true);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };

  const handleLikeListing = async (listingId) => {
    if (!currentUser) {
      setModalConfig({
        isOpen: true,
        title: "Login Required",
        message: "Please log in to save listings",
        type: "warning",
      });
      return;
    }

    try {
      await axios.post(
        `${API_URL}/marketplace/${listingId}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setSavedListings((prev) =>
        prev.includes(listingId)
          ? prev.filter((id) => id !== listingId)
          : [...prev, listingId],
      );

      fetchListings();
    } catch (err) {
      console.error("Error liking listing:", err);
    }
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setModalConfig({
        isOpen: true,
        title: "Login Required",
        message: "Please log in to create a listing",
        type: "warning",
      });
      return;
    }

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "images") {
          formData.images.forEach((image, index) => {
            formDataToSend.append(`images`, image);
          });
        } else if (key === "specifications" || key === "location") {
          formDataToSend.append(key, JSON.stringify(value));
        } else if (key === "tags") {
          formDataToSend.append(key, value.join(","));
        } else {
          formDataToSend.append(key, value);
        }
      });

      await axios.post(`${API_URL}/marketplace/listings`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setShowCreateModal(false);
      setFormData({
        title: "",
        description: "",
        price: "",
        originalPrice: "",
        category: "ELECTRONICS",
        subcategory: "",
        brand: "",
        model: "",
        year: "",
        condition: "GOOD",
        usage: "",
        negotiable: true,
        deliveryAvailable: false,
        shippingAvailable: false,
        warranty: "",
        returnPolicy: "",
        specifications: {},
        tags: [],
        urgent: false,
        images: [],
        location: {
          address: "",
          city: "",
          state: "",
          pincode: "",
          landmark: "",
        },
      });
      fetchListings();
      setModalConfig({
        isOpen: true,
        title: "Success",
        message: "Listing created successfully!",
        type: "success",
      });
    } catch (err) {
      console.error("Error creating listing:", err);
      setModalConfig({
        isOpen: true,
        title: "Error",
        message: "Error creating listing. Please try again.",
        type: "error",
      });
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setShowSuggestions(false);
    setCurrentPage(1);
  };

  const getConditionColor = (condition) => {
    const conditionObj = conditions.find((c) => c.value === condition);
    return conditionObj ? conditionObj.color : "gray";
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const ListingCard = ({ listing }) => (
    <div
      className="bg-zinc-900 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer border border-zinc-800"
      onClick={() => {
        setSelectedListing(listing);
        setShowDetailModal(true);
      }}
    >
      {/* Image Section */}
      <div className="relative">
        <img
          src={
            listing.thumbnail ||
            listing.images?.[0] ||
            "/api/placeholder/300/200"
          }
          alt={listing.title}
          className="w-full h-36 sm:h-40 lg:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {listing.featured && (
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3" />
              Featured
            </span>
          )}
          {listing.urgent && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <WarningTriangle className="w-3 h-3" />
              Urgent
            </span>
          )}
          <span
            className={`bg-${getConditionColor(listing.condition)}-500 text-white text-xs px-2 py-1 rounded-full`}
          >
            {listing.condition.replace("_", " ")}
          </span>
        </div>

        {/* Like Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleLikeListing(listing._id);
          }}
          className="absolute top-2 right-2 bg-zinc-800/90 backdrop-blur-sm p-1.5 sm:p-2 rounded-full hover:bg-zinc-700 transition-colors"
        >
          <Heart
            className={`w-3 h-3 sm:w-4 sm:h-4 ${savedListings.includes(listing._id) ? "fill-red-500 text-red-500" : "text-zinc-400"}`}
          />
        </button>

        {/* Image Count */}
        {listing.images && listing.images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Camera className="w-3 h-3" />
            {listing.images.length}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-3 sm:p-4">
        {/* Title */}
        <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors text-sm sm:text-base">
          {listing.title}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg sm:text-xl font-bold text-green-400">
            {formatPrice(listing.price)}
          </span>
          {listing.originalPrice && listing.originalPrice > listing.price && (
            <span className="text-xs sm:text-sm text-zinc-500 line-through">
              {formatPrice(listing.originalPrice)}
            </span>
          )}
          {listing.negotiable && (
            <span className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded">
              Negotiable
            </span>
          )}
        </div>

        {/* Brand and Model */}
        {(listing.brand || listing.model) && (
          <div className="text-xs sm:text-sm text-zinc-400 mb-2">
            {listing.brand && (
              <span className="font-medium">{listing.brand}</span>
            )}
            {listing.brand && listing.model && <span> • </span>}
            {listing.model && <span>{listing.model}</span>}
          </div>
        )}

        {/* Location */}
        <div className="flex items-center gap-1 text-xs sm:text-sm text-zinc-500 mb-3">
          <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>{listing.location?.city || listing.college}</span>
        </div>

        {/* Seller Info */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <img
              src={listing.seller.avatar || "/api/placeholder/40/40"}
              alt={listing.seller.name}
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-white truncate">
                {listing.seller.name}
              </p>
              {listing.seller.isVerified && (
                <div className="flex items-center gap-1">
                  <Shield className="w-2 h-2 sm:w-3 sm:h-3 text-blue-400" />
                  <span className="text-xs text-blue-400 hidden sm:inline">
                    Verified
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-zinc-500">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">
              {new Date(listing.createdAt).toLocaleDateString()}
            </span>
            <span className="sm:hidden">
              {new Date(listing.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const FilterSidebar = () => (
    <div className="bg-zinc-900 rounded-lg shadow-md p-6 space-y-6 border border-zinc-800">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-white">Filters</h3>
        <button
          onClick={() =>
            setFilters({
              category: "ALL",
              subcategory: "",
              minPrice: "",
              maxPrice: "",
              condition: "",
              brand: "",
              negotiable: "",
              deliveryAvailable: "",
              urgent: "",
              featured: "",
              sortBy: "createdAt",
              sortOrder: "desc",
            })
          }
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          Clear All
        </button>
      </div>

      {/* Category Filter */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Category
        </label>
        <CustomDropdown
          colorScheme="blue"
          options={categoriesList.map((cat) => ({
            value: cat.value,
            label: cat.label,
          }))}
          value={filters.category}
          onChange={(value) => handleFilterChange("category", value)}
        />
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Price Range
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => handleFilterChange("minPrice", e.target.value)}
            className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-zinc-400"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
            className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-zinc-400"
          />
        </div>
      </div>

      {/* Condition */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Condition
        </label>
        <CustomDropdown
          colorScheme="blue"
          options={[
            { value: "", label: "All Conditions" },
            ...conditions.map((cond) => ({
              value: cond.value,
              label: cond.label,
            })),
          ]}
          value={filters.condition}
          onChange={(value) => handleFilterChange("condition", value)}
        />
      </div>

      {/* Brand */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Brand
        </label>
        <input
          type="text"
          placeholder="Enter brand"
          value={filters.brand}
          onChange={(e) => handleFilterChange("brand", e.target.value)}
          className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-zinc-400"
        />
      </div>

      {/* Boolean Filters */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-zinc-300">
          <input
            type="checkbox"
            checked={filters.negotiable === "true"}
            onChange={(e) =>
              handleFilterChange("negotiable", e.target.checked ? "true" : "")
            }
            className="rounded text-blue-600 focus:ring-blue-500 bg-zinc-800 border-zinc-600"
          />
          <span className="text-sm">Negotiable</span>
        </label>

        <label className="flex items-center gap-2 text-zinc-300">
          <input
            type="checkbox"
            checked={filters.deliveryAvailable === "true"}
            onChange={(e) =>
              handleFilterChange(
                "deliveryAvailable",
                e.target.checked ? "true" : "",
              )
            }
            className="rounded text-blue-600 focus:ring-blue-500 bg-zinc-800 border-zinc-600"
          />
          <span className="text-sm">Delivery Available</span>
        </label>

        <label className="flex items-center gap-2 text-zinc-300">
          <input
            type="checkbox"
            checked={filters.urgent === "true"}
            onChange={(e) =>
              handleFilterChange("urgent", e.target.checked ? "true" : "")
            }
            className="rounded text-blue-600 focus:ring-blue-500 bg-zinc-800 border-zinc-600"
          />
          <span className="text-sm">Urgent</span>
        </label>

        <label className="flex items-center gap-2 text-zinc-300">
          <input
            type="checkbox"
            checked={filters.featured === "true"}
            onChange={(e) =>
              handleFilterChange("featured", e.target.checked ? "true" : "")
            }
            className="rounded text-blue-600 focus:ring-blue-500 bg-zinc-800 border-zinc-600"
          />
          <span className="text-sm">Featured</span>
        </label>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Sort By
        </label>
        <CustomDropdown
          colorScheme="blue"
          options={[
            { value: "createdAt", label: "Latest First" },
            { value: "price", label: "Price: Low to High" },
            { value: "-price", label: "Price: High to Low" },
            { value: "views", label: "Most Viewed" },
            { value: "likes", label: "Most Liked" },
          ]}
          value={filters.sortBy}
          onChange={(value) => handleFilterChange("sortBy", value)}
        />
      </div>
    </div>
  );

  return (
    <div
      className={`min-h-screen bg-zinc-950 font-sans text-zinc-300 ${isSidebarOpen ? "ml-64" : "ml-0"} transition-all duration-300`}
    >
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between h-auto sm:h-16 py-3 sm:py-0 gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                Marketplace
              </h1>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-auto flex-1 max-w-md lg:max-w-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Search for items, brands, and more..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() =>
                    searchTerm.length > 2 && setShowSuggestions(true)
                  }
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-zinc-400 text-sm sm:text-base"
                />
              </div>

              {/* Search Suggestions */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {searchSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onClick={() =>
                        handleSearch(suggestion.title || suggestion.brand)
                      }
                      className="px-3 sm:px-4 py-2 sm:py-3 hover:bg-zinc-800 cursor-pointer border-b border-zinc-700 last:border-b-0"
                    >
                      <div className="font-medium text-white text-sm">
                        {suggestion.title || suggestion.brand}
                      </div>
                      <div className="text-xs text-zinc-400">
                        {suggestion.category}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* View Mode Toggle - Hidden on mobile */}
              <div className="hidden sm:flex bg-zinc-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 sm:p-2 rounded ${viewMode === "grid" ? "bg-zinc-700 shadow-sm" : ""}`}
                >
                  <ViewGrid className="w-3 h-3 sm:w-4 sm:h-4 text-zinc-300" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 sm:p-2 rounded ${viewMode === "list" ? "bg-zinc-700 shadow-sm" : ""}`}
                >
                  <List className="w-3 h-3 sm:w-4 sm:h-4 text-zinc-300" />
                </button>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors text-xs sm:text-sm"
              >
                <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Filters</span>
              </button>

              {/* Create Listing */}
              {currentUser && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Sell Item</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Filters Sidebar - Mobile: Slide over, Desktop: Static */}
          {showFilters && (
            <>
              {/* Mobile Overlay */}
              <div
                className="lg:hidden fixed inset-0 bg-black/50 z-40"
                onClick={() => setShowFilters(false)}
              />

              {/* Filter Panel */}
              <div className="lg:hidden fixed top-0 right-0 h-full w-80 bg-zinc-900 border-l border-zinc-800 z-50 overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                  <h3 className="font-semibold text-lg text-white">Filters</h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-2 hover:bg-zinc-800 rounded-lg"
                  >
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>
                <div className="p-4">
                  <FilterSidebar />
                </div>
              </div>

              {/* Desktop Sidebar */}
              <div className="hidden lg:block w-80 flex-shrink-0">
                <FilterSidebar />
              </div>
            </>
          )}

          {/* Listings Grid */}
          <div className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {listings.length} Results Found
                </h2>
                <p className="text-sm text-zinc-400">
                  Showing page {currentPage} of {totalPages}
                </p>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="p-1.5 sm:p-2 rounded-lg border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 text-zinc-300"
                  >
                    <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>

                  <span className="px-2 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded-lg text-sm">
                    {currentPage}
                  </span>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-1.5 sm:p-2 rounded-lg border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 text-zinc-300"
                  >
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              /* Listings Grid - Responsive Grid */
              <div
                className={`grid gap-3 sm:gap-4 lg:gap-6 ${
                  viewMode === "grid"
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "grid-cols-1"
                }`}
              >
                {listings.map((listing) => (
                  <ListingCard key={listing._id} listing={listing} />
                ))}
              </div>
            )}

            {/* No Results */}
            {!loading && listings.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-8 h-8 sm:w-12 sm:h-12 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-white mb-2">
                  No listings found
                </h3>
                <p className="text-sm text-zinc-400">
                  Try adjusting your filters or search terms
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Listing Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-800">
            <div className="p-6 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  Create New Listing
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateListing} className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-white">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-zinc-400"
                      placeholder="What are you selling?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Category *
                    </label>
                    <CustomDropdown
                      colorScheme="blue"
                      options={categoriesList
                        .filter((cat) => cat.value !== "ALL")
                        .map((cat) => ({
                          value: cat.value,
                          label: cat.label,
                        }))}
                      value={formData.category}
                      onChange={(value) =>
                        setFormData((prev) => ({ ...prev, category: value }))
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Price *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          price: e.target.value,
                        }))
                      }
                      className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-zinc-400"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Original Price (Optional)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.originalPrice}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          originalPrice: e.target.value,
                        }))
                      }
                      className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-zinc-400"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Condition *
                    </label>
                    <CustomDropdown
                      colorScheme="blue"
                      options={conditions.map((cond) => ({
                        value: cond.value,
                        label: cond.label,
                      }))}
                      value={formData.condition}
                      onChange={(value) =>
                        setFormData((prev) => ({ ...prev, condition: value }))
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Brand
                    </label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          brand: e.target.value,
                        }))
                      }
                      className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-zinc-400"
                      placeholder="e.g., Apple, Samsung"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-zinc-400 resize-none"
                    placeholder="Describe your item in detail..."
                  />
                </div>
              </div>

              {/* Additional Options */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-white">
                  Additional Options
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 text-zinc-300">
                    <input
                      type="checkbox"
                      checked={formData.negotiable}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          negotiable: e.target.checked,
                        }))
                      }
                      className="rounded text-blue-600 focus:ring-blue-500 bg-zinc-800 border-zinc-600"
                    />
                    <span className="text-sm">Price is negotiable</span>
                  </label>

                  <label className="flex items-center gap-3 text-zinc-300">
                    <input
                      type="checkbox"
                      checked={formData.deliveryAvailable}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          deliveryAvailable: e.target.checked,
                        }))
                      }
                      className="rounded text-blue-600 focus:ring-blue-500 bg-zinc-800 border-zinc-600"
                    />
                    <span className="text-sm">Delivery available</span>
                  </label>

                  <label className="flex items-center gap-3 text-zinc-300">
                    <input
                      type="checkbox"
                      checked={formData.urgent}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          urgent: e.target.checked,
                        }))
                      }
                      className="rounded text-blue-600 focus:ring-blue-500 bg-zinc-800 border-zinc-600"
                    />
                    <span className="text-sm">Mark as urgent</span>
                  </label>
                </div>
              </div>

              {/* Images Upload */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-white">Photos</h3>
                <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center">
                  <Camera className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <p className="text-sm text-zinc-400 mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-zinc-500">
                    PNG, JPG, GIF up to 10MB each
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        images: Array.from(e.target.files),
                      }))
                    }
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  >
                    Select Images
                  </label>
                </div>

                {formData.images.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              images: prev.images.filter((_, i) => i !== index),
                            }))
                          }
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-6 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 border border-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Listing Detail Modal */}
      <ListingDetailModal
        listing={selectedListing}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedListing(null);
        }}
        currentUser={currentUser}
        token={token}
      />
      <CustomModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </div>
  );
};

export default EnhancedMarketPage;
