const https = require('https');

const WEBHOOK_URL = process.env.DISCORD_REPORT_WEBHOOK_URL;

const sendReportToDiscord = async (report) => {
  if (!WEBHOOK_URL) {
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

  const payload = JSON.stringify({
    embeds: [{
      title: `New Report: ${report.targetType}`,
      color: 0xff4444,
      fields,
      timestamp: new Date().toISOString(),
    }],
    username: 'Report System',
  });

  return new Promise((resolve, reject) => {
    const url = new URL(WEBHOOK_URL);
    const data = Buffer.from(payload);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
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

module.exports = { sendReportToDiscord };
