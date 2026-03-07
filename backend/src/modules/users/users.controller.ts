import { Request, Response, NextFunction } from 'express';
import { registerUserSchema, loginSchema, listUsersSchema } from './users.validators';
import { registerUser, loginUser, getUserProfile, listUsers, deactivateUserById } from './users.service';
import { AuthenticatedRequest } from '../../common/middleware';
import { UnauthorizedError, ForbiddenError } from '../../common/errors';

export async function registerHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = registerUserSchema.parse(req.body);
    const user = await registerUser(data);
    res.status(201).json({ status: 'success', data: user });
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = loginSchema.parse(req.body);
    const ip = req.ip ?? (req.socket?.remoteAddress);
    const result = await loginUser(data, ip);
    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
}


// export async function getMeHandler(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> {
//   try {
//     const authReq = req as AuthenticatedRequest;
//     if (!authReq.user) throw new UnauthorizedError();
//     const user = await getUserProfile(authReq.user.id);
//     res.status(200).json({ status: 'success', data: user });
//   } catch (err) {
//     next(err);
//   }
// }

// export async function listUsersHandler(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> {
//   try {
//     const authReq = req as AuthenticatedRequest;
//     if (authReq.user?.role !== 'admin') throw new ForbiddenError('Admin access required');
//     const q = listUsersSchema.parse(req.query);
//     const result = await listUsers(q);
//     res.status(200).json({ status: 'success', data: result });
//   } catch (err) {
//     next(err);
//   }
// }

// export async function deactivateUserHandler(
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> {
//   try {
//     const authReq = req as AuthenticatedRequest;
//     if (authReq.user?.role !== 'admin') throw new ForbiddenError('Admin access required');
//     const id = parseInt(req.params['id'] ?? '', 10);
//     if (isNaN(id)) {
//       res.status(400).json({ status: 'error', message: 'Invalid user id' });
//       return;
//     }
//     await deactivateUserById(id);
//     res.status(204).send();
//   } catch (err) {
//     next(err);
//   }
// }


// everything else is sync
export function getMeHandler(req: Request, res: Response, next: NextFunction): void {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) throw new UnauthorizedError();
      const user = getUserProfile(authReq.user.id);
      res.status(200).json({ status: 'success', data: user });
    } catch (err) { next(err); }
  }
  
  export function listUsersHandler(req: Request, res: Response, next: NextFunction): void {
    try {
      const authReq = req as AuthenticatedRequest;
      if (authReq.user?.role !== 'admin') throw new ForbiddenError('Admin access required');
      const q      = listUsersSchema.parse(req.query);
      const result = listUsers(q);
      res.status(200).json({ status: 'success', data: result });
    } catch (err) { next(err); }
  }
  
  export function deactivateUserHandler(req: Request, res: Response, next: NextFunction): void {
    try {
      const authReq = req as AuthenticatedRequest;
      if (authReq.user?.role !== 'admin') throw new ForbiddenError('Admin access required');
      const id = parseInt(req.params['id'] ?? '', 10);
      if (isNaN(id)) { res.status(400).json({ status: 'error', message: 'Invalid user id' }); return; }
      deactivateUserById(id);
      res.status(204).send();
    } catch (err) { next(err); }
  }
  