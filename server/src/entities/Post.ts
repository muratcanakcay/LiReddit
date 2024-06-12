import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@ObjectType() // graphQL
@Entity() // typeorm
export class Post extends BaseEntity {
  // BaseEntity allows Post.find(), Post.insert(), some easy command to be used in SQL
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String) // explicitly set type for GraphQL
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field()
  @Column()
  title!: string;
}
