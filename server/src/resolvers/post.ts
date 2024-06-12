import { Post } from "../entities/Post";
import { Arg, Int, Mutation, Query, Resolver } from "type-graphql";
// import { sleep } from "../utils/sleep";

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  posts(): Promise<Post[]> {
    //await sleep(3000); // simulate delay to test csr vs ssr load times
    return Post.find();
  }

  @Query(() => Post, { nullable: true })
  post(
    @Arg("id", () => Int) id: number // 'id' is just a name for using in GraphQL schema, id is the actual field in database
  ): Promise<Post | undefined> {
    return Post.findOne(id);
  }

  @Mutation(() => Post)
  async createPost(@Arg("title", () => String) title: string): Promise<Post> {
    return Post.create({ title }).save();
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
