import { withUrqlClient } from "next-urql";
import { Layout } from "../components/Layout";
import {
  useDeletePostMutation,
  useMeQuery,
  usePostsQuery,
} from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import NextLink from "next/link";
import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { UpdootSection } from "../components/UpdootSection";
import { DeleteIcon, EditIcon } from "@chakra-ui/icons";
import { isServer } from "../utils/isServer";

const Index = () => {
  const [postsQueryVariables, setPostsQueryVariables] = useState({
    limit: 10,
    cursor: null as string | null,
  });

  const [{ data: meData }] = useMeQuery({
    pause: isServer(), // when I run the query on the server I get a hydration error
  });
  const [{ data, fetching }] = usePostsQuery({
    variables: postsQueryVariables,
  });

  const [, deletePost] = useDeletePostMutation();

  if (!data && !fetching) {
    return <div>No posts loaded for some reason...</div>;
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
                      {meData?.me?.id !== p.creator.id ? null : (
                        <Flex ml="auto">
                          <NextLink
                            href="/post/edit/[id]"
                            as={`/post/edit/${p.id}`}
                          >
                            <IconButton
                              mr={1}
                              icon={<EditIcon />}
                              aria-label="Edit Post"
                            />
                          </NextLink>
                          <IconButton
                            onClick={() => deletePost({ id: p.id })}
                            icon={<DeleteIcon />}
                            aria-label="Delete Post"
                          />
                        </Flex>
                      )}
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
