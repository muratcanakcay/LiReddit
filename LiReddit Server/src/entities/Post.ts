import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, Int, ObjectType } from "type-graphql";

@ObjectType() // graphQL
@Entity() // mikro-orm
export class Post {
  @Field(() => Int)
  @PrimaryKey()
  id!: number;

  @Field(() => String) // explicitly set type for GraphQL
  @Property({ type: 'date' }) // explicitly set type for MikroORM
  createdAt = new Date();

  @Field(() => String)
  @Property({ type: 'date', onUpdate: () => new Date() })
  updatedAt = new Date();

  @Field()
  @Property({ type: 'text'})
  title!: string;
}