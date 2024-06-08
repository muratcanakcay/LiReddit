import { User } from "../entities/User";
import { MyContext } from "src/types";
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Resolver } from "type-graphql";
import argon2 from "argon2"


@InputType()  // InputType are used for arguments
class UsernamePasswordInput {
  @Field()
  username: string
  @Field(() => String) // can set type explicitly, or let typescript infer it
  password: string
}

@ObjectType()
class FieldError {
  @Field()
  field: string // which field the error is about
  @Field()
  message: string // error message
}

@ObjectType() // ObjectTypes are returned from Queries and Mutations
class UserResponse {
  @Field(() => [FieldError], { nullable: true})
  errors?: FieldError[]

  @Field(() => User, { nullable: true})
  user?: User
}

@Resolver()
export class UserResolver {
  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: UsernamePasswordInput, //  let typescript infer type UsernamePasswordInput
    @Ctx() { em } : MyContext
  ) : Promise<UserResponse> {
    
    if (options.username.length <= 2) {
      return {
        errors: [
          {
            field: "username",
            message: "Length must be greater than 2"
          }
        ]
      }
    }

    const isUserExists = await em.findOne(User, { username: options.username })
    if (isUserExists) {
      return {
        errors: [
          {
            field: "username",
            message: "That username is already taken"
          }
        ]
      }
    }

    if (options.password.length <= 3) {
      return {
        errors: [
          {
            field: "password",
            message: "Length must be greater than 3"
          }
        ]
      }
    }

    const hashedPassword = await argon2.hash(options.password)
    const user = em.create(User, { username: options.username, password: hashedPassword })
    await em.persistAndFlush(user)

    return { user }
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('options') options: UsernamePasswordInput, //  let typescript infer type UsernamePasswordInput
    @Ctx() { em } : MyContext
  ) : Promise<UserResponse> {
    const user = await em.findOne(User, {username: options.username})
    if (!user) {
      return {
        errors: [
          {
            field: "username",
            message: "That username does not exist"
          }
        ]
      }
    }
    
    const isPasswordValid = await argon2.verify(user.password, options.password)
    if (!isPasswordValid) {
      return {
        errors: [
          {
            field: "password",
            message: "Incorrect password"
          }
        ]
      }
    }

    return { user }
  }
}