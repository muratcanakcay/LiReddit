"use client";
import { Box, Button, Flex, Link } from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { isServer } from "../utils/isServer";

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
  const [{ fetching: logoutFetching }, logout] = useLogoutMutation();

  const [{ data, fetching }] = useMeQuery({
    pause: isServer(), // this will prevent the query from running on the server (there's no cookie on the server to look for)
  });

  let body = null;

  //data is loading
  if (fetching) {
    body = "Loading...";
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
        <Button
          variant="link"
          isLoading={logoutFetching}
          onClick={() => logout()}
        >
          Logout
        </Button>
      </Flex>
    );
  }

  return (
    <Flex bg="tan" p={4}>
      <Box ml={"auto"} suppressHydrationWarning>
        {body}
      </Box>
    </Flex>
  );
};
