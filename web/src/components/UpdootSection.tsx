import { ChevronUpIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { Flex, IconButton } from "@chakra-ui/react";
import React from "react";
import { PostSnippetFragment } from "../generated/graphql";

interface UpdootSectionProps {
  post: PostSnippetFragment;
}

export const UpdootSection: React.FC<UpdootSectionProps> = ({ post }) => {
  return (
    <Flex direction="column" justifyContent="center" alignItems="center" mr={4}>
      <IconButton
        boxSize={6}
        icon={<ChevronUpIcon />}
        aria-label={"Upvote post"}
      />
      {post.points}
      <IconButton
        boxSize={6}
        icon={<ChevronDownIcon />}
        aria-label={"Downvote post"}
      />
    </Flex>
  );
};
