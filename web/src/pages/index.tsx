import { withUrqlClient } from "next-urql";
import { Layout } from "../components/Layout";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import NextLink from "next/link";
import {
  Box,
  Button,
  Flex,
  Heading,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";

const Index = () => {
  const [postsQueryVariables, setPostsQueryVariables] = useState({
    limit: 10,
    cursor: null as string | null,
  });

  const [{ data, fetching }] = usePostsQuery({
    variables: postsQueryVariables,
  });

  if (!data && !fetching) {
    return <div>No posts loaded for some reason...</div>;
  }

  return (
    <>
      <Layout>
        <Flex mb={4} align="center">
          <Heading>LiReddit</Heading>
          <Button ml="auto" type="button" color="teal">
            <Link as={NextLink} href="/create-post">
              Create Post
            </Link>
          </Button>
        </Flex>
        <br />
        {!data ? (
          <div>Loading...</div>
        ) : (
          <Stack spacing={8}>
            {data!.posts.posts.map((p) => (
              <Box key={p.id} p={5} shadow="md" borderWidth="1px">
                <Flex>
                  <Heading fontSize="xl">{p.title}</Heading>
                  <Flex ml="auto">
                    <Text>posted by:</Text>
                    <Text ml={2} fontWeight="bold">
                      {p.creator.username}
                    </Text>
                  </Flex>
                </Flex>
                <Text>{p.textSnippet}...</Text>
              </Box>
            ))}
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
