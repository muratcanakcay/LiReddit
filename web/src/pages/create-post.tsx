import { Box, Button } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import React from "react";
import { InputField } from "../components/InputField";
import { TextAreaField } from "../components/TextAreaField";
import { Wrapper } from "../components/Wrapper";

const CreatePost: React.FC<{}> = ({}) => {
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ title: "", text: "" }}
        onSubmit={async (values) => {
          console.log(values);
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
              Create post
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default CreatePost;
