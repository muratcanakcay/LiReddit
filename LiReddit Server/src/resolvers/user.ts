import { User } from "../entities/User";
import { MyContext } from "src/types";
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import argon2 from "argon2"
import { NullCacheAdapter } from "@mikro-orm/core";


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
  @Query(() => User, { nullable: true })
  async me(
    @Ctx() { em, req } : MyContext
  ) {
    // you are not logged in
    if (!req.session.userId) {
      return null
    }
    
    const user = await em.findOne(User, { id: req.session.userId })
    return user
  }    
  
  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: UsernamePasswordInput, //  let typescript infer type UsernamePasswordInput
    @Ctx() { em, req } : MyContext
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
    try {
      await em.persistAndFlush(user)
    } catch (err) {
      // duplicate username error
      if (err.code === "23505") { // || err.detail.includes("already exists"))
        return {
          errors: [{
            field: "username",
            message: "That username is already taken"
          }]
        }
      }
    }

    req.session.userId = user.id // logs in the user (by sending cookie to browser)

    return { user }
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('options') options: UsernamePasswordInput, //  let typescript infer type UsernamePasswordInput
    @Ctx() { em, req } : MyContext
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

    req.session.userId = user.id // created new type for req in types.ts to make this work

    return { user }
  }
}