import React from "react";
import { Field, Form, Formik } from "formik";
import {
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Button,
  Box,
} from "@chakra-ui/react";
import { Wrapper } from "../components/Wrapper";
import { InputField } from "../components/InputField";

interface registerProps {}

const Register: React.FC<registerProps> = ({}) => {
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ username: "", password: "" }}
        onSubmit={(values) => {
          console.log(values);
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="username"
              label="username"
              placeholder="Username"
            />
            <Box mt={4}>
              <InputField
                name="password"
                label="password"
                placeholder="Password"
                type="password"
              />
            </Box>
            <Button mt={4} type="submit" isLoading={isSubmitting} color="teal">
              Register
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default Register;
