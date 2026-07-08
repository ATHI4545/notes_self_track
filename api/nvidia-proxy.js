/**
 * Vercel Serverless Function — NVIDIA API Proxy
 * Proxies requests to the NVIDIA NIM API server-side to avoid CORS issues
 * and keep the API key out of the client bundle.
 *
 * POST /api/nvidia-proxy
 * Body: same JSON payload as NVIDIA /chat/completions
 */
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.VITE_NVIDIA_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'NVIDIA API key not configured on server.' });
  }

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('NVIDIA proxy error:', err);
    return res.status(500).json({ error: err.message || 'Proxy request failed' });
  }
}
