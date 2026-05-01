export type AuthUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
