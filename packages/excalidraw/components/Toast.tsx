import { useCallback, useEffect, useRef } from "react";
import "./Toast.scss";
import { Callout, Flex, IconButton } from "@radix-ui/themes";
import { Cross1Icon } from "@radix-ui/react-icons";
import { resetAPIError } from "../../../objective-app/objective-plus/store/projects/actions";
import { useDispatch } from "../../../objective-app/objective-plus/hooks/redux";

const DEFAULT_TOAST_TIMEOUT = 5000;

export const Toast = ({
  message,
  onClose,
  closable = false,
  // To prevent autoclose, pass duration as Infinity
  duration = DEFAULT_TOAST_TIMEOUT,
}: {
  message: string;
  onClose: () => void;
  closable?: boolean;
  duration?: number;
}) => {
  const timerRef = useRef<number>(0);
  const shouldAutoClose = duration !== Infinity;
  const scheduleTimeout = useCallback(() => {
    if (!shouldAutoClose) {
      return;
    }
    timerRef.current = window.setTimeout(() => onClose(), duration);
  }, [onClose, duration, shouldAutoClose]);

  // VBRN
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(resetAPIError());
  }, [dispatch]);

  useEffect(() => {
    if (!shouldAutoClose) {
      return;
    }
    scheduleTimeout();
    return () => clearTimeout(timerRef.current);
  }, [scheduleTimeout, message, duration, shouldAutoClose]);

  const onMouseEnter = shouldAutoClose
    ? () => clearTimeout(timerRef?.current)
    : undefined;
  const onMouseLeave = shouldAutoClose ? scheduleTimeout : undefined;

  return (
    <Flex className="allert-callout-container" justify={"center"} m={"4"}>
      <Callout.Root
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        color={"gray"}
        role={"banner"}
        size={"1"}
        style={{
          marginTop: "auto",
          marginBottom: "auto",
          height: "min-content",
        }}
      >
        <Flex justify={"between"} style={{ minWidth: 300 }}>
          <Callout.Text size={"1"} weight={"bold"}>
            {message}
          </Callout.Text>
          <IconButton onClick={() => onClose()} color="gray" variant="ghost">
            <Cross1Icon />
          </IconButton>
        </Flex>
      </Callout.Root>
    </Flex>
  );
};
