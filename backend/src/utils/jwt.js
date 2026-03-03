import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Génère un access token JWT (24h)
 */
export const generateAccessToken = (user) => {
  const payload = {
    user_id: user.id,
    tenant_id: user.tenant_id,
    role: user.role,
    email: user.email
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRATION || '24h',
    algorithm: 'HS256'
  });
};

/**
 * Génère un refresh token JWT (7 jours)
 */
export const generateRefreshToken = (user) => {
  const payload = {
    user_id: user.id,
    token_type: 'refresh'
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    algorithm: 'HS256'
  });
};

/**
 * Génère un token unique pour stockage en DB
 */
export const generateTokenHash = () => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * Vérifie un refresh token
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Refresh token invalide ou expiré');
  }
};
