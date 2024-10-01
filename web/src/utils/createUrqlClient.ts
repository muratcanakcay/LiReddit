import { Resolver, cacheExchange } from "@urql/exchange-graphcache";
import router from "next/router";
import {
  Exchange,
  dedupExchange,
  fetchExchange,
  stringifyVariables,
} from "urql";
import { pipe, tap } from "wonka";
import {
  LoginMutation,
  LogoutMutation,
  MeDocument,
  MeQuery,
  RegisterMutation,
  VoteMutationVariables,
} from "../generated/graphql";
import { betterUpdateQuery } from "./betterUpdateQuery";
import gql from "graphql-tag";
import { isServer } from "./isServer";

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

    const allFields = cache.inspectFields(entityKey);

    // filter allFields to get only the field infos related to the field we want to work on
    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);

    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }

    // create a new fieldKey to check the cache and update cache if needed
    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;

    const isItInTheCache = cache.resolve(
      cache.resolveFieldByKey(entityKey, fieldKey) as string,
      "posts"
    );

    info.partial = !isItInTheCache; // reload if new results are not in the cache

    // cache.readQuery() --> This will call the resolver again and enter an infinite loop
    // so we use this:
    const results: string[] = [];
    let hasMore = true;
    fieldInfos.forEach((fi) => {
      const key = cache.resolveFieldByKey(entityKey, fi.fieldKey) as string;
      const data = cache.resolve(key, "posts") as string[];
      if (!(cache.resolve(key, "hasMore") as boolean)) {
        hasMore = false;
      }

      results.push(...data);
    });

    return {
      __typename: "PaginatedPosts", // NOT PUTTING THIS WAS CAUSING AN ERROR graphql.tsx:374 Invalid resolver value: The field at `Query.posts({"limit":10})` is a scalar (number, boolean, etc), but the GraphQL query expects a selection set for this field.
      hasMore,
      posts: results,
    };
  };
};

// this code runs both on the browser and the server
export const createUrqlClient = (ssrExchange: any, ctx: any) => {
  let cookie = "";
  if (isServer()) {
    // we don't have the ctx object on the browser
    cookie = ctx.req.headers.cookie;
  }

  return {
    url: "http://localhost:4000/graphql",
    fetchOptions: {
      credentials: "include" as const,
      headers: cookie ? { cookie } : undefined,
    },
    exchanges: [
      dedupExchange,
      cacheExchange({
        keys: {
          PaginatedPosts: () => null,
        },
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
            vote: (result, args, cache, info) => {
              const { postId, value } = args as VoteMutationVariables;

              const data = cache.readFragment(
                gql`
                  fragment _ on Post {
                    id
                    points
                    voteStatus
                  }
                `,
                { id: postId } as any
              );

              if (data) {
                if (data.voteStatus === value) {
                  return;
                }

                const newPoints =
                  (data.points as number) + (!data.voteStatus ? 1 : 2) * value;

                cache.writeFragment(
                  gql`
                    fragment __ on Post {
                      points
                      voteStatus
                    }
                  `,
                  { id: postId, points: newPoints, voteStatus: value } as any
                );
              }
            },

            createPost: (result, args, cache, info) => {
              var previousLimit = cache
                .inspectFields("Query")
                .find((f) => f.fieldName === "posts")?.arguments
                ?.limit as number;
              cache.invalidate("Query", "posts", {
                limit: previousLimit,
              });
            },

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
  };
};
