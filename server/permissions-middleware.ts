// Permission middleware for Express routes
import { ROLE_PERMISSIONS, hasPermission } from "@shared/permissions";
import { Request, Response, NextFunction } from "express";
import { User } from "@shared/schema";

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}

/**
 * Express middleware to check if the user has the required permission.
 * Usage: app.get('/api/some-route', requirePermission('PERMISSION_NAME'), handler)
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user || !user.persona) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const userPermissions = ROLE_PERMISSIONS[user.persona] || [];
    if (!hasPermission(userPermissions, permission)) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }
    next();
  };
}
