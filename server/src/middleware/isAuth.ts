import { MyContext } from "src/types";
import { MiddlewareFn } from "type-graphql";

// MiddlewareFn runs before the resolver
export const isAuth: MiddlewareFn<MyContext> = ({ context }, next) => {
  if (!context.req.session.userId) {
    // if user is not logged in
    throw new Error("Not authenticated!");
  }

  // if user is logged in continue with resolver
  return next();
};
