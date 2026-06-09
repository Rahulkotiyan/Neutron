const { PostHog } = require("posthog-node");

const POSTHOG_KEY = process.env.POSTHOG_KEY;
const POSTHOG_HOST = process.env.POSTHOG_HOST || "https://us.i.posthog.com";

let client = null;

const getClient = () => {
  if (!client && POSTHOG_KEY) {
    client = new PostHog(POSTHOG_KEY, { host: POSTHOG_HOST });
  }
  return client;
};

const capture = (event, distinctId, properties = {}) => {
  const c = getClient();
  if (!c) return;
  try {
    c.capture({ event, distinctId, properties });
  } catch {
    // Silently skip
  }
};

const identify = (distinctId, properties = {}) => {
  const c = getClient();
  if (!c) return;
  try {
    c.identify({ distinctId, properties });
  } catch {
    // Silently skip
  }
};

const shutdown = async () => {
  if (client) await client.shutdown();
};

module.exports = { capture, identify, shutdown };
