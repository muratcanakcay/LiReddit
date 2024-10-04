import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../../../utils/createUrqlClient";
import { Box, Button } from "@chakra-ui/react";
import { Formik, Form } from "formik";
import { InputField } from "../../../components/InputField";
import { Layout } from "../../../components/Layout";
import { TextAreaField } from "../../../components/TextAreaField";
import { useGetPostFromUrl } from "../../../utils/useGetPostFromUrl";

const EditPost = ({}) => {
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
    <Layout variant="small">
      <Formik
        initialValues={{ title: data.post.title, text: data.post.text }}
        onSubmit={async (values) => {}}
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
