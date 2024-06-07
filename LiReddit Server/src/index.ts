// graphql@15.3.0 type-graphql@1.0.0
// apollo-server-express@2.16.1
// npm install @types/express-session@1.17.0. Also make sure secure option in the cookie is set to false. "secure: false

import { MikroORM } from "@mikro-orm/core"
import { __prod__ } from "./constants"
import { Post } from "./entities/Post"
import microConfig from "./mikro-orm.config"
import express from "express"

const main = async () => {
  const orm = await MikroORM.init(microConfig)
  await orm.getMigrator().up() // run migration
  
  const app = express()
  // test express
  // app.get('/', (req, res) => {
  //   res.send("hello") // localhost:4000 will show "hello"
  // })

  

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


