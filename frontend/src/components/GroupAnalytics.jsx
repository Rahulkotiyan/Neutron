import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Activity,
  Calendar,
  Eye,
  Clock,
  Target,
  Zap,
  Award,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

const GroupAnalytics = ({ groupId, groupName }) => {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [groupId, dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case '24h':
          startDate.setHours(startDate.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      const response = await axios.get(`/api/premium/analytics/${groupId}`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      });

      setAnalytics(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const getLatestMetrics = () => {
    if (analytics.length === 0) return null;
    return analytics[0].metrics;
  };

  const getLatestDemographics = () => {
    if (analytics.length === 0) return null;
    return analytics[0].demographics;
  };

  const calculateGrowth = (metric) => {
    if (analytics.length < 2) return 0;
    const current = analytics[0].metrics[metric];
    const previous = analytics[1].metrics[metric];
    return previous > 0 ? ((current - previous) / previous) * 100 : 0;
  };

  const exportAnalytics = () => {
    const csvContent = [
      ['Date', 'Active Members', 'New Members', 'Messages Sent', 'Engagement Rate (%)'],
      ...analytics.map(item => [
        new Date(item.date).toLocaleDateString(),
        item.metrics.activeMembers,
        item.metrics.newMembers,
        item.metrics.messagesSent,
        item.metrics.engagementRate
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${groupName}-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  const latestMetrics = getLatestMetrics();
  const latestDemographics = getLatestDemographics();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <BarChart3 className="w-6 h-6 text-purple-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Group Analytics</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={exportAnalytics}
              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-zinc-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 bg-[#111827] border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      {latestMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Users className="w-5 h-5 text-blue-400 mr-2" />
                <span className="text-sm font-medium text-zinc-300">Active Members</span>
              </div>
              <div className={`flex items-center text-sm ${
                calculateGrowth('activeMembers') >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                <TrendingUp className="w-4 h-4 mr-1" />
                {Math.abs(calculateGrowth('activeMembers')).toFixed(1)}%
              </div>
            </div>
            <div className="text-2xl font-bold text-white">
              {latestMetrics.activeMembers.toLocaleString()}
            </div>
          </div>

          <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Award className="w-5 h-5 text-green-400 mr-2" />
                <span className="text-sm font-medium text-zinc-300">New Members</span>
              </div>
              <div className={`flex items-center text-sm ${
                calculateGrowth('newMembers') >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                <TrendingUp className="w-4 h-4 mr-1" />
                {Math.abs(calculateGrowth('newMembers')).toFixed(1)}%
              </div>
            </div>
            <div className="text-2xl font-bold text-white">
              {latestMetrics.newMembers.toLocaleString()}
            </div>
          </div>

          <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <MessageSquare className="w-5 h-5 text-purple-400 mr-2" />
                <span className="text-sm font-medium text-zinc-300">Messages Sent</span>
              </div>
              <div className={`flex items-center text-sm ${
                calculateGrowth('messagesSent') >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                <TrendingUp className="w-4 h-4 mr-1" />
                {Math.abs(calculateGrowth('messagesSent')).toFixed(1)}%
              </div>
            </div>
            <div className="text-2xl font-bold text-white">
              {latestMetrics.messagesSent.toLocaleString()}
            </div>
          </div>

          <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Target className="w-5 h-5 text-orange-400 mr-2" />
                <span className="text-sm font-medium text-zinc-300">Engagement Rate</span>
              </div>
              <div className={`flex items-center text-sm ${
                calculateGrowth('engagementRate') >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                <TrendingUp className="w-4 h-4 mr-1" />
                {Math.abs(calculateGrowth('engagementRate')).toFixed(1)}%
              </div>
            </div>
            <div className="text-2xl font-bold text-white">
              {latestMetrics.engagementRate.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Activity Overview</h3>
          <div className="h-64 flex items-center justify-center bg-[#0f172a] rounded-lg border border-white/5">
            <div className="text-center">
              <Activity className="w-12 h-12 text-zinc-400 mx-auto mb-2" />
              <p className="text-zinc-300">Interactive chart coming soon</p>
              <p className="text-sm text-zinc-500 mt-1">
                {analytics.length} data points available
              </p>
            </div>
          </div>
        </div>

        {/* Demographics */}
        {latestDemographics && (
          <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Member Demographics</h3>
            
            {/* Departments */}
            {latestDemographics.departments && latestDemographics.departments.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-zinc-300 mb-2">Departments</h4>
                <div className="space-y-2">
                  {latestDemographics.departments.slice(0, 5).map((dept, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-zinc-200">{dept.name}</span>
                      <div className="flex items-center">
                        <div className="w-24 bg-zinc-700 rounded-full h-2 mr-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full"
                            style={{ width: `${(dept.count / latestMetrics.activeMembers) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-zinc-400 w-8 text-right">{dept.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Years */}
            {latestDemographics.years && latestDemographics.years.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-zinc-300 mb-2">Academic Years</h4>
                <div className="space-y-2">
                  {latestDemographics.years.slice(0, 5).map((year, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-zinc-200">{year.year}</span>
                      <div className="flex items-center">
                        <div className="w-24 bg-zinc-700 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(year.count / latestMetrics.activeMembers) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-zinc-400 w-8 text-right">{year.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Top Channels */}
      {latestMetrics && latestMetrics.topChannels && latestMetrics.topChannels.length > 0 && (
        <div className="bg-[#111827] border border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Channels</h3>
          <div className="space-y-3">
            {latestMetrics.topChannels.slice(0, 5).map((channel, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-[#0f172a] rounded-lg border border-white/5">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center mr-3 border border-purple-500/30">
                    <span className="text-purple-400 font-semibold text-sm">#{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium text-white">{channel.name}</div>
                    <div className="text-sm text-zinc-400">Most active channel</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-white">{channel.messageCount}</div>
                  <div className="text-sm text-zinc-400">messages</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Premium Features Notice */}
      <div className="bg-gradient-to-r from-blue-600/20 to-green-600/20 border border-blue-500/30 rounded-xl p-6">
        <div className="flex items-start">
          <Zap className="w-5 h-5 text-green-400 mr-3 mt-0.5" />
          <div>
            <h4 className="font-semibold text-white mb-1">Free Analytics</h4>
            <p className="text-sm text-zinc-300">
              Advanced analytics, real-time insights, and detailed member demographics are now available for free! 
              Enjoy comprehensive group management tools at no cost.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupAnalytics;
