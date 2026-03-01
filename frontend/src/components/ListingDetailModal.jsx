import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  X,
  Heart,
  Send,
  Message,
  Phone,
  Mail,
  MapPin,
  Camera,
  MediaVideo,
  Star,
  CardShield,
  Calendar,
  Clock,
  Dollar,
  Label,
  Package,
  DeliveryTruck,
  InfoCircle,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  User,
  MapsArrow,
  Trophy,
  Medal,
  Flash,
  GraphUp,
  Eye,
  ThumbsUp,
  TriangleFlag
} from "iconoir-react";
import CustomModal from "./CustomModal";

const ListingDetailModal = ({ listing, isOpen, onClose, currentUser, token }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [similarListings, setSimilarListings] = useState([]);
  const [sellerReviews, setSellerReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const API_URL = "http://localhost:5000/api";

  useEffect(() => {
    if (listing && isOpen) {
      fetchSimilarListings();
      fetchSellerReviews();
    }
  }, [listing, isOpen]);

  const fetchSimilarListings = async () => {
    try {
      const res = await axios.get(`${API_URL}/marketplace/listings`, {
        params: {
          category: listing.category,
          college: listing.college,
          limit: 6
        }
      });
      setSimilarListings(res.data.listings.filter(item => item._id !== listing._id));
    } catch (err) {
      console.error("Error fetching similar listings:", err);
    }
  };

  const fetchSellerReviews = async () => {
    try {
      const res = await axios.get(`${API_URL}/marketplace/reviews/seller/${listing.seller._id}`);
      setSellerReviews(res.data);
    } catch (err) {
      console.error("Error fetching seller reviews:", err);
    }
  };

  const handleContactSeller = async () => {
    if (!currentUser) {
      setModalConfig({
        isOpen: true,
        title: "Login Required",
        message: "Please log in to contact the seller",
        type: "warning",
      });
      return;
    }

    if (!contactMessage.trim()) {
      setModalConfig({
        isOpen: true,
        title: "Empty Message",
        message: "Please enter a message",
        type: "warning",
      });
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/marketplace/conversations`, {
        listingId: listing._id,
        message: contactMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setModalConfig({
        isOpen: true,
        title: "Success",
        message: "Message sent successfully!",
        type: "success",
      });
      setContactMessage("");
      setShowContactForm(false);
    } catch (err) {
      console.error("Error sending message:", err);
      setModalConfig({
        isOpen: true,
        title: "Error",
        message: "Error sending message. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: listing.description,
          url: window.location.href
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      setModalConfig({
        isOpen: true,
        title: "Link Copied",
        message: "Link copied to clipboard!",
        type: "success",
      });
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(price);
  };

  const getConditionColor = (condition) => {
    const colors = {
      NEW: "green",
      LIKE_NEW: "blue",
      EXCELLENT: "purple",
      GOOD: "yellow",
      FAIR: "orange",
      POOR: "red"
    };
    return colors[condition] || "gray";
  };

  if (!listing || !isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">Listing Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-[calc(90vh-80px)]">
          {/* Left Column - Images */}
          <div className="lg:w-1/2 p-6 border-r border-zinc-800">
            {/* Main Image */}
            <div className="relative">
              <img
                src={listing.images?.[currentImageIndex] || listing.thumbnail || "/api/placeholder/600/400"}
                alt={listing.title}
                className="w-full h-96 object-cover rounded-lg"
              />
              
              {/* Image Navigation */}
              {listing.images && listing.images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(prev => Math.max(0, prev - 1))}
                    disabled={currentImageIndex === 0}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-zinc-800/80 backdrop-blur-sm p-2 rounded-full disabled:opacity-50"
                  >
                    <ArrowLeft className="w-5 h-5 text-zinc-300" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(prev => Math.min(listing.images.length - 1, prev + 1))}
                    disabled={currentImageIndex === listing.images.length - 1}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-zinc-800/80 backdrop-blur-sm p-2 rounded-full disabled:opacity-50"
                  >
                    <ArrowRight className="w-5 h-5 text-zinc-300" />
                  </button>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {listing.featured && (
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <Flash className="w-4 h-4" />
                    Featured
                  </span>
                )}
                {listing.urgent && (
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <InfoCircle className="w-4 h-4" />
                    Urgent
                  </span>
                )}
                <span className={`bg-${getConditionColor(listing.condition)}-500 text-white px-3 py-1 rounded-full text-sm`}>
                  {listing.condition.replace("_", " ")}
                </span>
              </div>

              {/* Image Counter */}
              {listing.images && listing.images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {listing.images.length}
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {listing.images && listing.images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto">
                {listing.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      index === currentImageIndex ? "border-blue-500" : "border-zinc-700"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Video Link */}
            {listing.videoUrl && (
              <div className="mt-4">
                <a
                  href={listing.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                >
                  <MediaVideo className="w-5 h-5" />
                  Watch Video
                </a>
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="lg:w-1/2 p-6 overflow-y-auto">
            {/* Title and Price */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">{listing.title}</h1>
              
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl font-bold text-green-400">
                  {formatPrice(listing.price)}
                </span>
                {listing.originalPrice && listing.originalPrice > listing.price && (
                  <>
                    <span className="text-lg text-zinc-500 line-through">
                      {formatPrice(listing.originalPrice)}
                    </span>
                    <span className="bg-red-900 text-red-300 px-2 py-1 rounded-full text-sm">
                      {Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {listing.negotiable && (
                  <span className="bg-blue-900 text-blue-300 px-3 py-1 rounded-full text-sm">
                    Negotiable
                  </span>
                )}
                {listing.deliveryAvailable && (
                  <span className="bg-green-900 text-green-300 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <DeliveryTruck className="w-4 h-4" />
                    Delivery Available
                  </span>
                )}
                {listing.shippingAvailable && (
                  <span className="bg-purple-900 text-purple-300 px-3 py-1 rounded-full text-sm">
                    Shipping Available
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-white">Description</h3>
              <p className="text-zinc-300 whitespace-pre-wrap">{listing.description}</p>
            </div>

            {/* Specifications */}
            {(listing.brand || listing.model || listing.year || listing.usage) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-white">Specifications</h3>
                <div className="grid grid-cols-2 gap-4">
                  {listing.brand && (
                    <div>
                      <span className="text-sm text-zinc-500">Brand</span>
                      <p className="font-medium text-white">{listing.brand}</p>
                    </div>
                  )}
                  {listing.model && (
                    <div>
                      <span className="text-sm text-zinc-500">Model</span>
                      <p className="font-medium text-white">{listing.model}</p>
                    </div>
                  )}
                  {listing.year && (
                    <div>
                      <span className="text-sm text-zinc-500">Year</span>
                      <p className="font-medium text-white">{listing.year}</p>
                    </div>
                  )}
                  {listing.usage && (
                    <div>
                      <span className="text-sm text-zinc-500">Usage</span>
                      <p className="font-medium text-white">{listing.usage}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Location */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-white">Location</h3>
              <div className="flex items-center gap-2 text-zinc-300">
                <MapPin className="w-5 h-5 text-zinc-500" />
                <span>
                  {listing.location?.address && `${listing.location.address}, `}
                  {listing.location?.city && `${listing.location.city}, `}
                  {listing.location?.state && listing.location.state}
                  {listing.college && ` (${listing.college})`}
                </span>
              </div>
            </div>

            {/* Seller Information */}
            <div className="mb-6 p-4 bg-zinc-800 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 text-white">Seller Information</h3>
              <div className="flex items-center gap-4">
                <img
                  src={listing.seller.avatar || "/api/placeholder/60/60"}
                  alt={listing.seller.name}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">{listing.seller.name}</p>
                    {listing.seller.isVerified && (
                      <CardShield className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      {listing.seller.rating || "New"}
                    </span>
                    <span>{listing.seller.totalSales || 0} sales</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setShowContactForm(!showContactForm)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Message className="w-5 h-5" />
                Contact Seller
              </button>
              
              <button
                onClick={handleShare}
                className="px-4 py-3 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-300"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            {/* Contact Form */}
            {showContactForm && (
              <div className="mb-6 p-4 bg-blue-900/20 rounded-lg border border-blue-800">
                <h4 className="font-medium mb-3 text-white">Send Message to Seller</h4>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Hi, I'm interested in this item. Is it still available?"
                  className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg resize-none text-white placeholder-zinc-400"
                  rows={3}
                />
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={handleContactSeller}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? "Sending..." : "Send Message"}
                  </button>
                  <button
                    onClick={() => setShowContactForm(false)}
                    className="px-4 py-2 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-zinc-500 mb-6">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {listing.views} views
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {listing.likes?.length || 0} likes
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Posted {new Date(listing.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Tags */}
            {listing.tags && listing.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 text-white">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full text-sm border border-zinc-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Similar Listings */}
        {similarListings.length > 0 && (
          <div className="border-t border-zinc-800 p-6">
            <h3 className="text-lg font-semibold mb-4 text-white">Similar Listings</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {similarListings.map((item) => (
                <div
                  key={item._id}
                  className="cursor-pointer group"
                  onClick={() => {
                    // Handle opening similar listing
                    window.open(`/marketplace/${item._id}`, '_blank');
                  }}
                >
                  <img
                    src={item.thumbnail || item.images?.[0] || "/api/placeholder/150/150"}
                    alt={item.title}
                    className="w-full h-32 object-cover rounded-lg group-hover:scale-105 transition-transform"
                  />
                  <h4 className="font-medium text-sm mt-2 line-clamp-2 group-hover:text-blue-400 text-white">
                    {item.title}
                  </h4>
                  <p className="text-green-400 font-semibold">{formatPrice(item.price)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Custom Modal for Alerts */}
        <CustomModal
          isOpen={modalConfig.isOpen}
          onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
        />
      </div>
    </div>
  );
};

export default ListingDetailModal;
