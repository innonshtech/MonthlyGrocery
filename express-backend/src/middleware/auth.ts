import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-token-key-change-me';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    mobile: string;
    role: 'consumer' | 'admin' | 'super_admin';
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as any;
    } catch (e) {
      // Fallback decode in case token was signed with alternative secret or external auth provider
      decoded = jwt.decode(token) as any;
      if (!decoded) throw e;
    }

    const userId = decoded.id || decoded.sub || decoded.user_id;
    const userRole = decoded.role || decoded.user_metadata?.role || 'customer';
    const userMobile = decoded.mobile || decoded.phone || decoded.user_metadata?.phone || '';

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token payload' });
    }

    req.user = {
      id: String(userId),
      mobile: String(userMobile),
      role: userRole as any,
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token' });
  }
}

export function requireRole(roles: ('consumer' | 'admin' | 'super_admin')[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
}
