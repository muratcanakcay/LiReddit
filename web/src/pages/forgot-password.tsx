import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { withUrqlClient } from "next-urql";
import React, { useState } from "react";
import { InputField } from "../components/InputField";
import { Wrapper } from "../components/Wrapper";
import { useForgotPasswordMutation } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

const ForgotPassword: React.FC<{}> = ({}) => {
  const [complete, setComplete] = useState(false);
  const [, forgotPassword] = useForgotPasswordMutation();
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ email: "" }}
        onSubmit={async (values, { setErrors }) => {
          if (!values.email || !values.email.includes("@")) {
            setErrors({ email: "Provide a valid email address" });
          } else {
            await forgotPassword(values);
            setComplete(true);
          }
        }}
      >
        {({ isSubmitting, values }) =>
          complete ? (
            <Flex flexDirection={"column"} alignItems={"center"}>
              <Text>Please check your email address</Text>
              <Text fontWeight={"bold"}>{values.email}</Text>
              <Text>for the password reset link</Text>
            </Flex>
          ) : (
            <Form>
              <InputField
                name="email"
                label="Email Address"
                placeholder="Email Address"
              />
              <Box mt={4}>
                <Button type="submit" isLoading={isSubmitting} color="teal">
                  Send password reset email
                </Button>
              </Box>
            </Form>
          )
        }
      </Formik>
    </Wrapper>
  );
};

export default withUrqlClient(createUrqlClient)(ForgotPassword);
