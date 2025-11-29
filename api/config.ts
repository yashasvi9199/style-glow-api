import type { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';

dotenv.config();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '';
  const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1') || origin.startsWith('capacitor://');
  const allowedDomain = process.env.PRIMARY_DOMAIN || '';
  const allowLocalhost = process.env.LOCALHOST === 'true';

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

  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', "true");
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { file, tags, context } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('Received tags:', tags);
    console.log('Received context:', context);

    // Extract both IPv4 and IPv6
    const forwardedFor = Array.isArray(req.headers['x-forwarded-for']) 
      ? req.headers['x-forwarded-for'][0] 
      : req.headers['x-forwarded-for'];
    
    const ips = forwardedFor?.split(',').map(ip => ip.trim()) || ['unknown'];
    
    // Separate IPv4 and IPv6 - simplified without regex
    const ipv4 = ips.find(ip => ip.includes('.') && !ip.includes(':')) || 'none';
    const ipv6 = ips.find(ip => ip.includes(':')) || 'none';
    
    // Simple sanitization - remove all slashes and special chars
    const cleanString = (str: string) => {
      return str.split('/').join('_').split('\\').join('_').split('|').join('_').split('=').join('_');
    };

    // Sanitize and append IPs to tags and context
    let updatedTags = tags || '';
    let updatedContext = context || '';
    
    if (ipv4 !== 'none') {
      const cleanIpv4 = cleanString(ipv4);
      updatedTags += `,ipv4:${cleanIpv4}`;
      updatedContext += `|ipv4=${cleanIpv4}`;
    }
    
    if (ipv6 !== 'none') {
      const cleanIpv6 = cleanString(ipv6);
      updatedTags += `,ipv6:${cleanIpv6}`;
      updatedContext += `|ipv6=${cleanIpv6}`;
    }

    // Apply sanitization to entire strings
    updatedTags = cleanString(updatedTags);
    updatedContext = cleanString(updatedContext);

    console.log('Sanitized tags:', updatedTags);
    console.log('Sanitized context:', updatedContext);

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      console.error('Cloudinary configuration missing on server');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    
    const formData = new URLSearchParams();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('tags', updatedTags);
    formData.append('context', updatedContext);

    const cloudinaryResponse = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData,
    });

    if (!cloudinaryResponse.ok) {
      const errorData = await cloudinaryResponse.json();
      console.error('Cloudinary upload failed:', errorData);
      return res.status(cloudinaryResponse.status).json({ error: 'Upload failed', details: errorData });
    }

    const data: any = await cloudinaryResponse.json();
    
    // Add public_id to response
    res.status(200).json({
      ...data,
      metadata: {
        ipv4,
        ipv6,
        public_id: data.public_id
      }
    });

  } catch (error) {
    console.error('Server upload error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
