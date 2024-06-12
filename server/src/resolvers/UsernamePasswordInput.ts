import { Field, InputType } from "type-graphql";

@InputType() // InputType are used for arguments
export class UsernamePasswordInput {
  @Field()
  username: string;
  @Field()
  email: string;
  @Field(() => String) // can set type explicitly, or let typescript infer it
  password: string;
}
