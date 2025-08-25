// TypeScript declaration merging for Express Request.user
import type { Request } from "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
      username: string;
      email: string;
      name: string;
      plan: string;
      persona: string;
      createdAt: Date;
    };
  }
}
