import { useState, useEffect } from "react";
import { Theme } from "../element/types";
import { RootBox } from "../../../objective-app/objective-plus/components/layout";
import { Flex, Text } from "@radix-ui/themes";
import { SymbolIcon } from "@radix-ui/react-icons";

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
        <SymbolIcon />
        <Text>loading</Text>
      </Flex>
    </RootBox>
  );
};
