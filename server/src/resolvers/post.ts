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
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";
// import { sleep } from "../utils/sleep";

@InputType()
class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(
    @Root() root: Post // get called for Post objects
  ) {
    return root.text.slice(0, 150);
  }

  @Query(() => [Post])
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<Post[]> {
    //await sleep(3000); // simulate delay to test csr vs ssr load times
    const realLimit = Math.min(50, limit);
    const qb = getConnection()
      .getRepository(Post)
      .createQueryBuilder("p")
      .orderBy('"createdAt"', "DESC") // mind the double quotes '" ... "'
      .take(realLimit);

    if (cursor) {
      qb.where('"createdAt" < :cursor', { cursor: new Date(parseInt(cursor)) });
    }

    return qb.getMany();
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
