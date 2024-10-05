import DataLoader from "dataloader";
import { User } from "../entities/User";

// [1, 5, 6, 9] ==> [{user with id 1}, {user with id 5}, {user with id 6}, {user with id 9}]
export const createUserLoader = () =>
  new DataLoader<number, User>(async (userIds) => {
    const users = await User.findByIds(userIds as number[]);
    // we don't directly return this since it could be out of order, and order matters here

    const userIdToUser: Record<number, User> = {};
    users.forEach((user) => {
      userIdToUser[user.id] = user;
    });

    return userIds.map((userId) => userIdToUser[userId]);
  });
