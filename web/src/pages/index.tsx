import { withUrqlClient } from "next-urql";
import { Layout } from "../components/Layout";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";
import NextLink from "next/link";
import { Button, Link } from "@chakra-ui/react";

const Index = () => {
  const [{ data }] = usePostsQuery();
  return (
    <>
      <Layout>
        <Button type="button" color="teal">
          <Link as={NextLink} href="/create-post">
            Create Post
          </Link>
        </Button>
        <br />
        {!data ? (
          <div>Loading...</div>
        ) : (
          data.posts.map((p) => <div key={p.id}>{p.title}</div>)
        )}
      </Layout>
    </>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
