// This endpoint pings the Python service to keep it warm
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL;

    if (!pythonServiceUrl) {
      return res.status(200).json({
        status: 'skipped',
        message: 'No PYTHON_SERVICE_URL configured'
      });
    }

    const response = await fetch(`${pythonServiceUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (response.ok) {
      return res.status(200).json({
        status: 'success',
        message: 'Python service is warm'
      });
    } else {
      return res.status(200).json({
        status: 'warning',
        message: `Service responded with ${response.status}`
      });
    }
  } catch (error) {
    return res.status(200).json({
      status: 'error',
      message: error.message
    });
  }
}
