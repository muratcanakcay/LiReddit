import { withUrqlClient } from "next-urql";
import React from "react";
import { createUrqlClient } from "../../utils/createUrqlClient";
import { Layout } from "../../components/Layout";
import { Box, Heading } from "@chakra-ui/react";
import { useGetPostFromUrl } from "../../utils/useGetPostFromUrl";

const Post = ({}) => {
  const [{ data, error, fetching }] = useGetPostFromUrl();

  if (fetching) {
    return (
      <Layout>
        <Box>Loading...</Box>
      </Layout>
    );
  }

  if (error) {
    return <div>error</div>;
  }

  if (!data?.post) {
    return (
      <Layout>
        <Box>Could not find post...</Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Heading mb={4}>{data.post.title}</Heading>
      {data.post.text}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Post);
