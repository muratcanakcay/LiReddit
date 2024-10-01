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
    @Root() root: Post // get called for Post objects
  ) {
    return root.text.slice(0, 150) + (root.text.length > 150 ? "..." : "");
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
    } // use has not voted before
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
    console.log("userId: ", req.session.userId);

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
    json_build_object(
      'id', u.id,
      'username', u.username,
      'email', u.email
      ) creator,
    ${
      req.session.userId
        ? '(select value from updoot where "userId" = $2 and "postId" = p.id) "voteStatus"'
        : 'null as "voteStatus"'
    }
       from post p
       inner join public.user u on u.id = p."creatorId"
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

  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg("id") id: number, // here we ommitted type declaration in @Arg - type inference works for Int and String
    @Arg("title", () => String, { nullable: true }) title: string // here we explicitly set type since we want to make it nullable
  ): Promise<Post | null> {
    const post = await Post.findOne(id);

    if (!post) {
      return null;
    }

    if (typeof title !== "undefined") {
      await Post.update({ id }, { title });
    }

    return post;
  }

  @Mutation(() => Boolean)
  async deletePost(@Arg("id") id: number): Promise<boolean> {
    const post = await Post.findOne(id);

    if (!post) {
      return false;
    }

    await Post.delete(id);
    return true;
  }
}
