"use client";
import { Box, Button, Flex, Heading, Link } from "@chakra-ui/react";
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
      <Flex align="center">
        <Button mr={4} type="button" color="teal">
          <Link as={NextLink} href="/create-post">
            Create Post
          </Link>
        </Button>
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
    <Flex zIndex={1} position="sticky" top={0} bg="tan" p={4}>
      <Flex flex={1} m="auto" align="center" maxW={800}>
        <Link as={NextLink} href="/">
          <Heading>LiReddit</Heading>
        </Link>
        <Box ml={"auto"} suppressHydrationWarning>
          {body}
        </Box>
      </Flex>
    </Flex>
  );
};
