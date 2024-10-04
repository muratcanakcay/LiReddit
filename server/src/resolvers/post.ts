import { MyContext } from "src/types";
import { Post } from "../entities/Post";
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";
import { Updoot } from "../entities/Updoot";
import { User } from "../entities/User";
// import { sleep } from "../utils/sleep";

@InputType()
class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field()
  hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(
    @Root() post: Post // get called for Post objects
  ) {
    return post.text.slice(0, 150) + (post.text.length > 150 ? "..." : "");
  }

  @FieldResolver(() => User)
  creator(
    @Root() post: Post // get called for Post objects
  ) {
    return User.findOne(post.creatorId);
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("value", () => Int) value: number,
    @Arg("postId", () => Int) postId: number,
    @Ctx() { req }: MyContext
  ) {
    const isUpdoot = value !== -1;
    const realValue = isUpdoot ? 1 : -1;
    const userId = req.session.userId;

    // check to see if the user has voted before
    const updoot = await Updoot.findOne({ where: { postId, userId } });

    // user has voted before and is changing the vote
    if (updoot && updoot.value !== realValue) {
      await getConnection().transaction(async (tm) => {
        // update the updoot table
        await tm.query(
          `
            update updoot
            set value = $1
            where "postId" = $2 and "userId" = $3
          `,
          [realValue, postId, userId]
        );

        // update the post
        await tm.query(
          `
            update post
            set points = points + $1
            where id = $2
          `,
          [2 * realValue, postId] // 2*realValue so that 1 changes to -1 and vice versa
        );
      });
    } // user has not voted before
    else if (!updoot) {
      await getConnection().transaction(async (tm) => {
        // update the updoot table
        await tm.query(
          `
            insert into updoot("userId", "postId", "value")
            values ($1, $2, $3)
          `,
          [userId, postId, realValue]
        );

        // update the post
        await tm.query(
          `
            update post
            set points = points + $1
            where id = $2
          `,
          [realValue, postId]
        );
      });
    }

    return true;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: MyContext
  ): Promise<PaginatedPosts> {
    //await sleep(3000); // simulate delay to test csr vs ssr load times

    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = Math.min(50, limit) + 1;

    // Use SQL query to get the data from DB:

    const replacements: any[] = [realLimitPlusOne];

    if (req.session.userId) {
      replacements.push(req.session.userId);
    }

    let cursorIdx = 3;
    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
      cursorIdx = replacements.length;
    }

    const posts = await getConnection().query(
      `
      select p.*,
      ${
        req.session.userId
          ? '(select value from updoot where "userId" = $2 and "postId" = p.id) "voteStatus"'
          : 'null as "voteStatus"'
      }
      from post p
      ${cursor ? `where p."createdAt" < $${cursorIdx}` : ""}
      order by p."createdAt" DESC
      limit $1
      `,
      replacements
    );

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne,
    }; // see if there's more posts to retrieve
  }

  @Query(() => Post, { nullable: true })
  post(
    @Arg("id", () => Int) id: number // 'id' is just a name for using in GraphQL schema, id is the actual field in database
  ): Promise<Post | undefined> {
    return Post.findOne(id);
  }

  @UseMiddleware(isAuth)
  @Mutation(() => Post)
  async createPost(
    @Arg("input") input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    /* Instead of this we use UseMiddleware() to wrap resolver*/
    // if (!req.session.userId) {
    //   // if user not logged in
    //   throw new Error("not authenticated");
    // }

    return Post.create({
      ...input,
      creatorId: req.session.userId,
    }).save();
  }

  @UseMiddleware(isAuth)
  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title") title: string,
    @Arg("text") text: string,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    const result = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('id = :id and "creatorId" = :creatorId', {
        id,
        creatorId: req.session.userId,
      })
      .returning("*")
      .execute();

    return result.raw[0];
  }

  @UseMiddleware(isAuth)
  @Mutation(() => Boolean)
  async deletePost(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    const post = await Post.findOne(id);

    if (!post) {
      return false;
    }

    await Post.delete({ id, creatorId: req.session.userId });
    return true;
  }
}
