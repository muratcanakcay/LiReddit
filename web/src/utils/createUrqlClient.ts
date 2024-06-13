import { cacheExchange } from "@urql/exchange-graphcache";
import { Exchange, dedupExchange, fetchExchange } from "urql";
import { pipe, tap } from "wonka";
import {
  CreatePostMutation,
  LoginMutation,
  LogoutMutation,
  MeDocument,
  MeQuery,
  RegisterMutation,
} from "../generated/graphql";
import { betterUpdateQuery } from "./betterUpdateQuery";
import router from "next/router";
import createPost from "../pages/create-post";

//github.com/FormidableLabs/urql/issues/225 - global error handling
const errorExchange: Exchange =
  ({ forward }) =>
  (ops$) => {
    return pipe(
      forward(ops$),
      tap(({ error }) => {
        if (error) {
          console.log(error);
          if (error.message.includes("not authenticated")) {
            router.replace("/login");
          }
        }
      })
    );
  };

export const createUrqlClient = (ssrExchange: any) => ({
  url: "http://localhost:4000/graphql",
  fetchOptions: {
    credentials: "include" as const,
  },
  exchanges: [
    dedupExchange,
    cacheExchange({
      // this will update the cache everytime the defined mutations are run run
      updates: {
        Mutation: {
          logout: (result, args, cache, info) => {
            betterUpdateQuery<LogoutMutation, MeQuery>(
              cache,
              { query: MeDocument },
              result,
              () => ({ me: null }) // clear the query
            );
          },
          login: (result, args, cache, info) => {
            // cache.updateQuery({ query: MeDocument }, (data: MeQuery) => { })
            betterUpdateQuery<LoginMutation, MeQuery>(
              cache,
              { query: MeDocument },
              result,
              (r, q) => {
                if (r.login.errors) {
                  return q; // return the current query if there's error
                } else {
                  return {
                    me: r.login.user, // return the user info received from successful login
                  };
                }
              }
            );
          },
          register: (result, args, cache, info) => {
            betterUpdateQuery<RegisterMutation, MeQuery>(
              cache,
              { query: MeDocument },
              result,
              (r, q) => {
                if (r.register.errors) {
                  return q; // return the current query if there's error
                } else {
                  return {
                    me: r.register.user, // return the user info received from successful register
                  };
                }
              }
            );
          },
        },
      },
    }),
    errorExchange,
    ssrExchange,
    fetchExchange,
  ],
});
