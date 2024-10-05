import { Request, Response } from "express";
import { Session, SessionData } from "express-session";
import { Redis } from "ioredis";
import { createUserLoader } from "./utils/createUserLoader";
interface ExtendedRequest extends Request {
  session: Session &
    Partial<SessionData> &
    Express.Request & { userId: number };
}

export type MyContext = {
  req: ExtendedRequest;
  res: Response;
  redis: Redis;
  userLoader: ReturnType<typeof createUserLoader>;
};
