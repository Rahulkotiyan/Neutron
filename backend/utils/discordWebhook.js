const https = require('https');

const REPORT_WEBHOOK_URL = process.env.DISCORD_REPORT_WEBHOOK_URL;
const FEEDBACK_WEBHOOK_URL = process.env.DISCORD_FEEDBACK_WEBHOOK_URL;

const sendToWebhook = (url, payload) => {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const data = Buffer.from(JSON.stringify(payload));
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
};

const sendReportToDiscord = async (report) => {
  if (!REPORT_WEBHOOK_URL) {
    console.warn('[Discord] DISCORD_REPORT_WEBHOOK_URL not configured — report not sent');
    return;
  }

  const fields = [
    { name: 'Target Type', value: report.targetType, inline: true },
    { name: 'Target ID', value: report.targetId, inline: true },
    { name: 'Reason', value: report.reason, inline: false },
  ];

  if (report.reporter) fields.push({ name: 'Reported by', value: report.reporter, inline: true });
  if (report.additionalInfo) fields.push({ name: 'Additional Info', value: report.additionalInfo, inline: false });

  return sendToWebhook(REPORT_WEBHOOK_URL, {
    embeds: [{
      title: `New Report: ${report.targetType}`,
      color: 0xff4444,
      fields,
      timestamp: new Date().toISOString(),
    }],
    username: 'Report System',
  });
};

const sendFeedbackToDiscord = async (feedback) => {
  if (!FEEDBACK_WEBHOOK_URL) {
    console.warn('[Discord] DISCORD_FEEDBACK_WEBHOOK_URL not configured — feedback not sent');
    return;
  }

  const fields = [
    { name: 'Category', value: feedback.category, inline: true },
    { name: 'Rating', value: feedback.rating ? `${'★'.repeat(feedback.rating)}${'☆'.repeat(5 - feedback.rating)}` : 'Not rated', inline: true },
    { name: 'From', value: feedback.name, inline: true },
  ];

  if (feedback.email) fields.push({ name: 'Email', value: feedback.email, inline: true });
  if (feedback.userId) fields.push({ name: 'User ID', value: feedback.userId, inline: true });
  fields.push({ name: 'Message', value: feedback.message, inline: false });

  return sendToWebhook(FEEDBACK_WEBHOOK_URL, {
    embeds: [{
      title: `New Feedback: ${feedback.category}`,
      color: 0x44aaff,
      fields,
      timestamp: new Date().toISOString(),
      footer: { text: 'Neutron Feedback' },
    }],
    username: 'Feedback System',
  });
};

module.exports = { sendReportToDiscord, sendFeedbackToDiscord };
