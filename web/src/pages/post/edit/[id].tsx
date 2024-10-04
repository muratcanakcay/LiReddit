import { Box, Button } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import { InputField } from "../../../components/InputField";
import { Layout } from "../../../components/Layout";
import { TextAreaField } from "../../../components/TextAreaField";
import { useUpdatePostMutation } from "../../../generated/graphql";
import { createUrqlClient } from "../../../utils/createUrqlClient";
import { useGetPostFromUrl } from "../../../utils/useGetPostFromUrl";

const EditPost = ({}) => {
  const router = useRouter();
  const [{ data, fetching, error, postId }] = useGetPostFromUrl();
  const [, updatePost] = useUpdatePostMutation();

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
    <Layout variant="small">
      <Formik
        initialValues={{ title: data.post.title, text: data.post.text }}
        onSubmit={async (values) => {
          await updatePost({ id: postId, ...values });
          router.back();
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="title"
              label="Title"
              placeholder="Title of the post"
            />
            <Box mt={4}>
              <TextAreaField
                name="text"
                label="Body"
                placeholder="Enter your text"
              />
            </Box>
            <Button type="submit" isLoading={isSubmitting} mt={4} color="teal">
              Update Post
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(EditPost);
