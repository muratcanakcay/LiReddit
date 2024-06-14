import { Resolver, cacheExchange } from "@urql/exchange-graphcache";
import {
  Exchange,
  dedupExchange,
  fetchExchange,
  stringifyVariables,
} from "urql";
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
import { stringify } from "querystring";

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

//github.com/urql-graphql/urql/blob/a7d2b21f5c1d456709ac9c520e9132ba6e2e857e/exchanges/graphcache/src/extras/simplePagination.ts
const cursorPagination = (): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;
    //console.log("entityKey:", entityKey, "- fieldName:", fieldName);

    const allFields = cache.inspectFields(entityKey);
    //console.log("allFields:", allFields);

    // filter allFields to get only the field infos related to the field we want to work on
    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);

    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }
    //console.log("fieldArgs:", fieldArgs);

    // create a new fieldKey to check the cache and update cache if needed
    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
    console.log("FieldKey we created:", fieldKey);
    const isItInTheCache = cache.resolveFieldByKey(entityKey, fieldKey);
    console.log("isItInTheCache: ", isItInTheCache);
    info.partial = !isItInTheCache; // reload if new results are not in the cache

    // cache.readQuery() --> This will call the resolver again and enter an infinite loop
    // so we use this:
    const results: string[] = [];
    fieldInfos.forEach((fi) => {
      const data = cache.resolveFieldByKey(entityKey, fi.fieldKey) as string[];
      //console.log("data: ", data);
      results.push(...data);
    });

    return results;
  };
};

export const createUrqlClient = (ssrExchange: any) => ({
  url: "http://localhost:4000/graphql",
  fetchOptions: {
    credentials: "include" as const,
  },
  exchanges: [
    dedupExchange,
    cacheExchange({
      resolvers: {
        Query: {
          // this will run whenever the posts query is run
          // name of it matches what we used in posts.graphql
          posts: cursorPagination(),
        },
      },
      // this will update the cache everytime the defined mutations are run
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
