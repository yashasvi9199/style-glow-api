import type { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';

dotenv.config();

export default function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '';
  const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1') || origin.startsWith('capacitor://');
  const allowedDomain = process.env.PRIMARY_DOMAIN || '';
  const allowLocalhost = process.env.LOCALHOST === 'true';

  // Set CORS Headers FIRST (before any checks)
  res.setHeader('Access-Control-Allow-Credentials', "true");
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Check if origin is allowed
  const isAllowed = 
    (allowLocalhost && isLocalhost) || 
    (allowedDomain && origin.includes(allowedDomain));

  if (!isAllowed) {
    return res.status(403).json({ 
      error: 'Access Forbidden', 
      message: 'This API is restricted to authorized domains only.' 
    });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const ip = (Array.isArray(req.headers['x-forwarded-for']) 
    ? req.headers['x-forwarded-for'][0] 
    : req.headers['x-forwarded-for'])?.split(',')[0] || 'unknown';
  
  const userAgent = req.headers['user-agent'] || 'unknown';
  const language = req.headers['accept-language']?.split(',')[0] || 'unknown';
  
  // Extract browser name from user-agent
  let browserName = 'unknown';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browserName = 'Chrome';
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browserName = 'Safari';
  else if (userAgent.includes('Firefox')) browserName = 'Firefox';
  else if (userAgent.includes('Edg')) browserName = 'Edge';
  else if (userAgent.includes('OPR') || userAgent.includes('Opera')) browserName = 'Opera';
  
  // Generate anonymous ID from IP + UA
  const crypto = require('crypto');
  const anonID = crypto.createHash('sha256').update(ip + userAgent).digest('hex').substring(0, 16);

  res.status(200).json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
    clientIp: ip,
    anonID,
    userAgent,
    language,
    browserName
  });
}
