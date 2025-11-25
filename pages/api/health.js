export default function handler(req, res) {
  const checks = {
    server: 'running',
    timestamp: new Date().toISOString(),
    node_version: process.version,
    mode: '100% free - no API keys required',
    ai_engine: 'librosa (local ML) + rule-based matching',
  };

  res.status(200).json({
    status: 'healthy',
    checks,
  });
}
