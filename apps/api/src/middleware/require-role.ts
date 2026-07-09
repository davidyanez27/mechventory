import type { NextFunction, Request, Response } from 'express';
import type { CompanyRole } from '../db/schema/index.js';

// Port of Backend-main's CheckRolesMiddleware.CheckCompanyRole, reading the
// role from `req.identity` instead of a loose `(req as any).companyRole`.
export const requireCompanyRole = (...allowedRoles: CompanyRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const companyRole = req.identity?.companyRole;

    if (!companyRole) {
      return res.status(401).json({ error: 'Missing company role information' });
    }

    if (!allowedRoles.includes(companyRole)) {
      return res.status(403).json({ error: 'Insufficient permissions for this action' });
    }

    return next();
  };
};
