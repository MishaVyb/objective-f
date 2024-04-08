import { useState, useEffect } from "react";
import { Theme } from "../element/types";
import { RootBox } from "../../../objective-app/objective-plus/components/layout";
import { Flex, Spinner, Text } from "@radix-ui/themes";

export const LoadingMessage: React.FC<{ delay?: number; theme?: Theme }> = ({
  delay,
  theme,
}) => {
  const [isWaiting, setIsWaiting] = useState(!!delay);

  useEffect(() => {
    if (!delay) {
      return;
    }
    const timer = setTimeout(() => {
      setIsWaiting(false);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (isWaiting) {
    return null;
  }

  return (
    <RootBox>
      <Flex justify={"center"} align={"center"} gap={"2"}>
        <Spinner loading />
        <Text>loading</Text>
      </Flex>
    </RootBox>
  );
};
