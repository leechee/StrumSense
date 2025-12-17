// This endpoint pings the Python service to keep it warm
// Tries multiple times with longer timeouts to handle cold starts
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const pythonServiceUrl = process.env.PYTHON_SERVICE_URL;

  if (!pythonServiceUrl) {
    return res.status(200).json({
      status: 'skipped',
      message: 'No PYTHON_SERVICE_URL configured'
    });
  }

  // Try 3 times with increasing timeouts to handle cold starts
  const attempts = [
    { timeout: 10000, delay: 0 },     // 10 seconds
    { timeout: 30000, delay: 2000 },  // 30 seconds, wait 2s before retry
    { timeout: 60000, delay: 5000 }   // 60 seconds, wait 5s before retry
  ];

  for (let i = 0; i < attempts.length; i++) {
    try {
      if (attempts[i].delay > 0) {
        await new Promise(resolve => setTimeout(resolve, attempts[i].delay));
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), attempts[i].timeout);

      const response = await fetch(`${pythonServiceUrl}/health`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return res.status(200).json({
          status: 'success',
          message: `Python service is warm (attempt ${i + 1})`,
          attempt: i + 1
        });
      }
    } catch (error) {
      // If this was the last attempt, return error
      if (i === attempts.length - 1) {
        return res.status(200).json({
          status: 'error',
          message: `Service failed after ${attempts.length} attempts: ${error.message}`,
          attempts: attempts.length
        });
      }
      // Otherwise, continue to next attempt
    }
  }

  return res.status(200).json({
    status: 'error',
    message: 'Failed to warm service'
  });
}
