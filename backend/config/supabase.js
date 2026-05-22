const { createClient } = require("@supabase/supabase-js");
const WebSocket = require("ws");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const hasUrl = supabaseUrl && supabaseUrl.startsWith("https://") && !supabaseUrl.includes("<");
const hasKey = supabaseKey && supabaseKey.length > 10;

if (!hasUrl || !hasKey) {
  console.warn("Supabase storage not configured (missing/invalid URL or key). File uploads will fail.");
}

const supabase = (hasUrl && hasKey)
  ? createClient(supabaseUrl, supabaseKey, { realtime: { transport: WebSocket } })
  : null;

const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || "chat-uploads";

module.exports = { supabase, SUPABASE_BUCKET };
