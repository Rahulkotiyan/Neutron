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
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
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
