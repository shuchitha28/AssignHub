export const allowRoles = (...roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role)) {
      throw { status: 403, message: "Forbidden" };
    }
    next();
  };
};