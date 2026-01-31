import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  X, 
  Eye, 
  Heart, 
  MessageCircle, 
  Clock,
  Image as ImageIcon,
  Video,
  Type,
  Palette,
  Upload,
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import axios from 'axios';

const GroupStories = ({ groupId, groupName, userCanPost = true, maxStoriesPerDay = 999 }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [creating, setCreating] = useState(false);
  const [storyType, setStoryType] = useState('IMAGE');
  const [storyContent, setStoryContent] = useState({
    type: 'IMAGE',
    url: '',
    text: '',
    backgroundColor: '#000000',
    textColor: '#FFFFFF',
    font: 'Arial'
  });

  useEffect(() => {
    fetchStories();
  }, [groupId]);

  const fetchStories = async () => {
    setLoading(true);
    try {
      // Mock stories data - replace with actual API call
      const mockStories = [
        {
          _id: '1',
          group: groupId,
          content: {
            type: 'IMAGE',
            url: 'https://picsum.photos/seed/story1/400/600.jpg'
          },
          author: {
            name: 'Alice Johnson',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice'
          },
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000), // 22 hours from now
          viewers: ['user1', 'user2'],
          reactions: [{ type: 'heart', count: 5 }, { type: 'like', count: 3 }]
        },
        {
          _id: '2',
          group: groupId,
          content: {
            type: 'TEXT',
            text: 'Welcome to our group! 🎉',
            backgroundColor: '#1e40af',
            textColor: '#ffffff',
            font: 'Arial'
          },
          author: {
            name: 'Bob Smith',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob'
          },
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000), // 20 hours from now
          viewers: ['user3'],
          reactions: [{ type: 'heart', count: 8 }]
        },
        {
          _id: '3',
          group: groupId,
          content: {
            type: 'IMAGE',
            url: 'https://picsum.photos/seed/story3/400/600.jpg'
          },
          author: {
            name: 'Carol Davis',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol'
          },
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000), // 18 hours from now
          viewers: [],
          reactions: []
        }
      ];
      setStories(mockStories);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stories:', error);
      setLoading(false);
    }
  };

  const handleCreateStory = async () => {
    setCreating(true);
    try {
      // Simulate successful story creation without API call
      const newStory = {
        _id: Date.now().toString(),
        group: groupId,
        content: storyContent,
        author: {
          name: 'Current User',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'
        },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        viewers: []
      };
      
      setStories([newStory, ...stories]);
      setCreating(false);
      setShowCreateModal(false);
      setStoryContent({
        type: 'IMAGE',
        url: '',
        text: '',
        backgroundColor: '#000000',
        textColor: '#FFFFFF',
        font: 'Arial'
      });
      
      alert('Story created successfully!');
    } catch (error) {
      console.error('Error creating story:', error);
      alert('Error creating story. Please try again.');
      setCreating(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // In a real app, upload to cloud storage
      const reader = new FileReader();
      reader.onloadend = () => {
        setStoryContent({
          ...storyContent,
          url: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const viewStory = (index) => {
    setCurrentStoryIndex(index);
    setShowStoryViewer(true);
  };

  const nextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const handleReaction = (type) => {
    const updatedStories = stories.map((story, index) => {
      if (index === currentStoryIndex) {
        const existingReaction = story.reactions?.find(r => r.type === type);
        if (existingReaction) {
          return {
            ...story,
            reactions: story.reactions.map(r => 
              r.type === type ? { ...r, count: r.count + 1 } : r
            )
          };
        } else {
          return {
            ...story,
            reactions: [...(story.reactions || []), { type, count: 1 }]
          };
        }
      }
      return story;
    });
    setStories(updatedStories);
  };

  const formatTimeRemaining = (expiresAt) => {
    const now = new Date();
    const diff = expiresAt - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  const currentStory = stories[currentStoryIndex];

  return (
    <>
      {/* Stories Header */}
      <div className="bg-[#111827] border border-white/5 rounded-xl p-4 sm:p-6 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Sparkles className="w-6 h-6 text-blue-400 mr-2" />
            <h2 className="text-xl font-bold text-white">Group Stories</h2>
            <span className="ml-2 text-sm text-zinc-400">
              (Unlimited stories)
            </span>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all border border-blue-500 hover:border-blue-400"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Story
          </button>
        </div>
      </div>

      {/* Stories Display */}
      {stories.length > 0 ? (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-4 sm:p-6">
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {stories.map((story, index) => (
              <div
                key={story._id}
                onClick={() => viewStory(index)}
                className="flex-shrink-0 cursor-pointer group"
              >
                <div className="relative">
                  {/* Story Thumbnail */}
                  <div className="w-24 h-36 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl overflow-hidden border border-white/10">
                    {story.content.type === 'IMAGE' && story.content.url ? (
                      <img 
                        src={story.content.url} 
                        alt="Story"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {story.content.type === 'TEXT' ? (
                          <Type className="w-8 h-8 text-white" />
                        ) : (
                          <Video className="w-8 h-8 text-white" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Author Avatar */}
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                    <div className="w-8 h-8 bg-[#111827] rounded-full p-0.5 border border-white/10">
                      <img
                        src={story.author.avatar}
                        alt={story.author.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  </div>
                  
                  {/* Viewed Indicator */}
                  <div className="absolute top-2 right-2">
                    <div className={`w-2 h-2 rounded-full border border-white/20 ${
                      story.viewers.length > 0 ? 'bg-zinc-400' : 'bg-blue-500'
                    }`} />
                  </div>
                </div>
                
                {/* Story Info */}
                <div className="mt-3 text-center">
                  <p className="text-xs font-medium text-white truncate w-24">
                    {story.author.name}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {formatTimeRemaining(new Date(story.expiresAt))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-8 sm:p-12 text-center">
          <Sparkles className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Stories Yet</h3>
          <p className="text-zinc-400 mb-4">
            Be the first to share a story with the group!
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all border border-blue-500 hover:border-blue-400"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Story
          </button>
        </div>
      )}

      {/* Story Viewer Modal */}
      {showStoryViewer && currentStory && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="relative w-full h-full max-w-2xl max-h-screen">
            {/* Close Button */}
            <button
              onClick={() => setShowStoryViewer(false)}
              className="absolute top-4 right-4 z-10 text-white hover:text-zinc-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Story Content */}
            <div className="w-full h-full flex items-center justify-center">
              {currentStory.content.type === 'IMAGE' ? (
                <img
                  src={currentStory.content.url}
                  alt="Story"
                  className="max-w-full max-h-full object-contain"
                />
              ) : currentStory.content.type === 'TEXT' ? (
                <div
                  className="w-full h-full flex items-center justify-center p-8"
                  style={{
                    backgroundColor: currentStory.content.backgroundColor,
                    color: currentStory.content.textColor
                  }}
                >
                  <p 
                    className="text-2xl text-center max-w-lg"
                    style={{ fontFamily: currentStory.content.font }}
                  >
                    {currentStory.content.text}
                  </p>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#0f172a]">
                  <Video className="w-16 h-16 text-zinc-400" />
                </div>
              )}
            </div>

            {/* Navigation */}
            <button
              onClick={prevStory}
              disabled={currentStoryIndex === 0}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed bg-black/50 rounded-full p-2"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextStory}
              disabled={currentStoryIndex === stories.length - 1}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed bg-black/50 rounded-full p-2"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Story Info Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center">
                  <img
                    src={currentStory.author.avatar}
                    alt={currentStory.author.name}
                    className="w-8 h-8 rounded-full mr-3"
                  />
                  <div>
                    <p className="font-semibold">{currentStory.author.name}</p>
                    <p className="text-sm opacity-75">
                      {formatTimeRemaining(new Date(currentStory.expiresAt))}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleReaction('heart')}
                    className="flex items-center hover:text-red-400 transition-colors"
                  >
                    <Heart className="w-4 h-4 mr-1" />
                    <span className="text-sm">{currentStory.reactions?.find(r => r.type === 'heart')?.count || 0}</span>
                  </button>
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    <span className="text-sm">{currentStory.viewers?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 flex space-x-1 p-4">
              {stories.map((_, index) => (
                <div
                  key={index}
                  className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                >
                  <div
                    className={`h-full bg-white transition-all duration-300 ${
                      index === currentStoryIndex ? 'w-full' : 'w-0'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Story Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-white/10 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Create Story</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Story Type Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Story Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setStoryType('IMAGE')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      storyType === 'IMAGE'
                        ? 'border-blue-500 bg-blue-600/20'
                        : 'border-white/10 hover:border-white/20 bg-[#0f172a]'
                    }`}
                  >
                    <ImageIcon className="w-6 h-6 mx-auto mb-1 text-blue-400" />
                    <span className="text-xs text-zinc-300">Image</span>
                  </button>
                  <button
                    onClick={() => setStoryType('VIDEO')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      storyType === 'VIDEO'
                        ? 'border-blue-500 bg-blue-600/20'
                        : 'border-white/10 hover:border-white/20 bg-[#0f172a]'
                    }`}
                  >
                    <Video className="w-6 h-6 mx-auto mb-1 text-blue-400" />
                    <span className="text-xs text-zinc-300">Video</span>
                  </button>
                  <button
                    onClick={() => setStoryType('TEXT')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      storyType === 'TEXT'
                        ? 'border-blue-500 bg-blue-600/20'
                        : 'border-white/10 hover:border-white/20 bg-[#0f172a]'
                    }`}
                  >
                    <Type className="w-6 h-6 mx-auto mb-1 text-blue-400" />
                    <span className="text-xs text-zinc-300">Text</span>
                  </button>
                </div>
              </div>

              {/* Content Input */}
              <div className="mb-6">
                {storyType === 'IMAGE' || storyType === 'VIDEO' ? (
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Upload {storyType === 'IMAGE' ? 'Image' : 'Video'}
                    </label>
                    <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center bg-[#0f172a]">
                      <input
                        type="file"
                        accept={storyType === 'IMAGE' ? 'image/*' : 'video/*'}
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                        <p className="text-sm text-zinc-400">
                          Click to upload {storyType === 'IMAGE' ? 'an image' : 'a video'}
                        </p>
                      </label>
                      {storyContent.url && (
                        <div className="mt-4">
                          {storyType === 'IMAGE' ? (
                            <img
                              src={storyContent.url}
                              alt="Preview"
                              className="max-w-full h-32 object-cover rounded mx-auto"
                            />
                          ) : (
                            <Video className="w-16 h-16 text-zinc-400 mx-auto" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Text Content
                    </label>
                    <textarea
                      value={storyContent.text}
                      onChange={(e) => setStoryContent({ ...storyContent, text: e.target.value })}
                      className="w-full px-3 py-2 bg-[#0f172a] border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-zinc-500"
                      rows={4}
                      placeholder="Write your story text..."
                    />
                    
                    {/* Text Styling */}
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">
                          Background Color
                        </label>
                        <input
                          type="color"
                          value={storyContent.backgroundColor}
                          onChange={(e) => setStoryContent({ ...storyContent, backgroundColor: e.target.value })}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">
                          Text Color
                        </label>
                        <input
                          type="color"
                          value={storyContent.textColor}
                          onChange={(e) => setStoryContent({ ...storyContent, textColor: e.target.value })}
                          className="w-full h-10 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Preview */}
              {(storyContent.url || storyContent.text) && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Preview
                  </label>
                  <div className="w-full h-48 bg-[#0f172a] border border-white/10 rounded-lg overflow-hidden">
                    {storyType === 'IMAGE' && storyContent.url ? (
                      <img
                        src={storyContent.url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : storyType === 'TEXT' ? (
                      <div
                        className="w-full h-full flex items-center justify-center p-4"
                        style={{
                          backgroundColor: storyContent.backgroundColor,
                          color: storyContent.textColor
                        }}
                      >
                        <p 
                          className="text-lg text-center"
                          style={{ fontFamily: storyContent.font }}
                        >
                          {storyContent.text || 'Your text will appear here...'}
                        </p>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-12 h-12 text-zinc-400" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={handleCreateStory}
                  disabled={creating || (!storyContent.url && !storyContent.text)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-blue-500 hover:border-blue-400"
                >
                  {creating ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </span>
                  ) : (
                    'Create Story'
                  )}
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-zinc-700 text-white py-2 px-4 rounded-lg font-semibold hover:bg-zinc-600 transition-all border border-zinc-600 hover:border-zinc-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GroupStories;
