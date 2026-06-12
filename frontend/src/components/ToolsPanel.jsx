import React, { useState, useEffect } from "react";
import api from "../utils/api";
import ToolSection from "./ToolSection";

const ToolsPanel = ({ slug, token }) => {
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchCategory = async () => {
      setLoading(true);
      try {
        const config = token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : {};
        const res = await api.get(`/tools/${slug}`, config);
        if (!cancelled) setCategory(res.data);
      } catch {
        if (!cancelled) setCategory(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchCategory();
    return () => { cancelled = true; };
  }, [slug, token]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="min-w-[300px] max-w-[300px] bg-zinc-900/50 border border-white/5 rounded-2xl p-5 animate-pulse shrink-0">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/5" />
                <div className="w-12 h-5 rounded-lg bg-white/5" />
              </div>
              <div className="h-5 bg-white/5 rounded w-3/4 mb-3" />
              <div className="h-3 bg-white/5 rounded w-full mb-2" />
              <div className="h-3 bg-white/5 rounded w-2/3 mb-4" />
              <div className="flex items-center justify-between">
                <div className="w-16 h-5 rounded-full bg-white/5" />
                <div className="w-14 h-8 rounded-lg bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-16">
        <p className="text-zinc-500 text-sm">Failed to load tools.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">{category.name}</h2>
        <p className="text-sm text-zinc-500 mt-1">
          {category.subcategories?.reduce((sum, s) => sum + (s.tools?.length || 0), 0)} tools across {category.subcategories?.length || 0} categories
        </p>
      </div>
      <div className="space-y-8">
        {category.subcategories?.map((sub) => (
          <ToolSection key={sub._id || sub.id} subcategory={sub} token={token} />
        ))}
      </div>
    </div>
  );
};

export default ToolsPanel;
