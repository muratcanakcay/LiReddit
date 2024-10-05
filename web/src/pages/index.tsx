import { Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import { useState } from "react";
import { EditDeletePostButtons } from "../components/EditDeletePostButtons";
import { Layout } from "../components/Layout";
import { UpdootSection } from "../components/UpdootSection";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

const Index = () => {
  const [postsQueryVariables, setPostsQueryVariables] = useState({
    limit: 10,
    cursor: null as string | null,
  });

  const [{ data, fetching, error }] = usePostsQuery({
    variables: postsQueryVariables,
  });

  if (error || (!data && !fetching)) {
    return (
      <div>
        <div>No posts loaded for some reason...</div>;
        <div>{error?.message}</div>
      </div>
    );
  }

  return (
    <>
      <Layout>
        {!data ? (
          <div>Loading...</div>
        ) : (
          <Stack spacing={8}>
            {data!.posts.posts.map((p) =>
              !p ? null : (
                <Flex key={p.id} p={5} shadow="md" borderWidth="1px">
                  <UpdootSection post={p} />

                  <Box width="100%">
                    <Flex justifyContent="space-between">
                      <NextLink href={`/post/${p.id}`}>
                        <Heading marginEnd="auto" fontSize="xl">
                          {p.title}
                        </Heading>
                      </NextLink>
                      <Flex>
                        <Text>posted by:</Text>
                        <Text ml={2} fontWeight="bold">
                          {p.creator.username}
                        </Text>
                      </Flex>
                    </Flex>

                    <Flex mt={4} flex={1} align="center">
                      <Text>{p.textSnippet}</Text>
                      <EditDeletePostButtons
                        id={p.id}
                        creatorId={p.creator.id}
                      />
                    </Flex>
                  </Box>
                </Flex>
              )
            )}
          </Stack>
        )}
        {data && data.posts.hasMore ? (
          <Flex>
            <Button
              onClick={() =>
                setPostsQueryVariables({
                  limit: postsQueryVariables.limit,
                  cursor:
                    data.posts.posts[data.posts.posts.length - 1].createdAt,
                })
              }
              isLoading={fetching}
              m="auto"
              my={8}
            >
              Load more...
            </Button>
          </Flex>
        ) : null}
      </Layout>
    </>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
