import { EditIcon, DeleteIcon } from "@chakra-ui/icons";
import { Flex, IconButton } from "@chakra-ui/react";
import NextLink from "next/link";
import React from "react";
import { useDeletePostMutation, useMeQuery } from "../generated/graphql";
import { isServer } from "../utils/isServer";

interface EditDeletePostButtonsProps {
  id: number;
  creatorId: number;
}

export const EditDeletePostButtons: React.FC<EditDeletePostButtonsProps> = ({
  id,
  creatorId,
}) => {
  const [{ data: meData }] = useMeQuery({
    pause: isServer(), // when I run the query on the server I get a hydration error
  });
  const [, deletePost] = useDeletePostMutation();

  if (meData?.me?.id !== creatorId) {
    return null;
  }

  return (
    <Flex>
      <NextLink href="/post/edit/[id]" as={`/post/edit/${id}`}>
        <IconButton mr={1} icon={<EditIcon />} aria-label="Edit Post" />
      </NextLink>
      <IconButton
        onClick={() => deletePost({ id })}
        icon={<DeleteIcon />}
        aria-label="Delete Post"
      />
    </Flex>
  );
};
