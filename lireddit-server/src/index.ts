import 'reflect-metadata'
import { MikroORM } from "@mikro-orm/core"
import { __prod__ } from "./constants"
// import { Post } from "./entities/Post"
import microConfig from "./mikro-orm.config"
import express from "express"
import { ApolloServer } from "apollo-server-express"
import { buildSchema } from "type-graphql"
import { HelloResolver } from "./resolvers/hello"
import { PostResolver } from './resolvers/post'
import { UserResolver } from './resolvers/user'
import connectRedis from "connect-redis"
import session from "express-session"
import redis from "redis"
import { MyContext } from './types'

const main = async () => {
  const orm = await MikroORM.init(microConfig)
  await orm.getMigrator().up() // run migration
  
  const app = express()

  const RedisStore = connectRedis(session)
  const redisClient = redis.createClient()

  // Initialize session storage before Apollo since it will be used from inside Apollo.
  app.use(
    session({
      name: 'qid', // cookie name
      store: new RedisStore({
        client: redisClient,
        disableTTL: true, // keep session alive forever
        disableTouch: true, // disable TTL reset at every touch 
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true, // prevent accessing the cookie in the JS code in the frontend
        sameSite: "lax",
        secure: __prod__ // cookie only works in https
      },
      saveUninitialized: false,
      secret: "asdfasdfasdf",  // used to sign cookie - should actually be hidden in an env variable 
      resave: false, 
    }),
  )

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false
    }),
    context: ({ req, res } : MyContext) => ({ em: orm.em, req, res }) // context is shared with all resolvers
  })

  apolloServer.applyMiddleware({ app })

  

  app.listen(4000, () => {
    console.log('server started on localhost:4000')
  })
  
  // const post = orm.em.create(Post, { title: "my first post" }) // the Post class is used to create the missing fields
  // await orm.em.persistAndFlush(post)
  // console.log("--------------sql 2----------------")
  // await orm.em.nativeInsert(Post, { title: 'my first post 2', createdAt: new Date(), updatedAt: new Date()}) // we must provide all fields

  // const posts = await orm.em.find(Post, {})
  // console.log(posts)
}

main().catch((err) => {
  console.log(err)
})


