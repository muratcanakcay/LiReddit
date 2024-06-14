import { withUrqlClient } from "next-urql";
import { Layout } from "../components/Layout";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import NextLink from "next/link";
import { Box, Button, Heading, Link, Stack, Text } from "@chakra-ui/react";

const Index = () => {
  const [{ data }] = usePostsQuery({
    variables: {
      limit: 10,
    },
  });
  return (
    <>
      <Layout>
        <Button mb={4} type="button" color="teal">
          <Link as={NextLink} href="/create-post">
            Create Post
          </Link>
        </Button>
        <br />
        {!data ? (
          <div>Loading...</div>
        ) : (
          <Stack spacing={8}>
            {data.posts.map((p) => (
              //<div key={p.id}>{p.title}</div>
              <Box key={p.id} p={5} shadow="md" borderWidth="1px">
                <Heading fontSize="xl">{p.title}</Heading>
                <Text>{p.text.slice(0, 150)}...</Text>
              </Box>
            ))}
          </Stack>
        )}
      </Layout>
    </>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
