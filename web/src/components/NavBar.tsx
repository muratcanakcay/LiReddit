import { Box, Button, Flex, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";
import { useMeQuery } from "../generated/graphql";

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
  const [{ data, fetching }] = useMeQuery();

  let body = null;

  //data is loading
  if (fetching) {
    //user not logged in
  } else if (!data?.me) {
    body = (
      <>
        <Link as={NextLink} href="/login" mr={4} color="white">
          Login
        </Link>

        <Link as={NextLink} href="/register" mr={4} color="white">
          Register
        </Link>
      </>
    );
    // user is logged in
  } else {
    body = (
      <Flex>
        <Box mr={4} color="white">
          {data.me.username}
        </Box>
        <Button variant="link">Logout</Button>
      </Flex>
    );
  }

  return (
    <Flex bg="tomato" p={4}>
      <Box ml={"auto"}>{body}</Box>
    </Flex>
  );
};
