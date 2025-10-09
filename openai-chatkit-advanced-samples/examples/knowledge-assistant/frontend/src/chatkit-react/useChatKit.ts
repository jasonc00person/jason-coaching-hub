import * as React from "react";
import { useStableOptions } from "./useStableOptions";
import {
  ChatKitElement,
  ChatKitElementEventMap,
  ChatKitOptions,
} from "@openai/chatkit";

type DotToCamelCase<S extends string> = S extends `${infer Head}.${infer Tail}`
  ? `${Head}${Capitalize<DotToCamelCase<Tail>>}`
  : S;

const CHATKIT_METHOD_NAMES = Object.freeze([
  "focusComposer",
  "setThreadId",
  "sendUserMessage",
  "setComposerValue",
  "fetchUpdates",
  "sendCustomAction",
] as const);

type ChatKitMethod = (typeof CHATKIT_METHOD_NAMES)[number];

type ChatKitMethods = {
  [K in ChatKitMethod]: ChatKitElement[K];
};

export type ToEventHandlerKey<K extends keyof ChatKitElementEventMap> =
  DotToCamelCase<K> extends `chatkit${infer EventName}`
    ? `on${Capitalize<EventName>}`
    : never;

type ChatKitEventHandlers = Partial<{
  [K in keyof ChatKitElementEventMap as ToEventHandlerKey<K>]: ChatKitElementEventMap[K] extends CustomEvent<
    infer Detail
  >
    ? Detail extends void
      ? () => void
      : (event: Detail) => void
    : never;
}>;

export type UseChatKitOptions = ChatKitOptions & ChatKitEventHandlers;

export type ChatKitControl = {
  setInstance: (instance: ChatKitElement | null) => void;
  options: ChatKitOptions;
  handlers: ChatKitEventHandlers;
};

export type UseChatKitReturn = ChatKitMethods & {
  control: ChatKitControl;
};

export function useChatKit(options: UseChatKitOptions): UseChatKitReturn {
  const ref = React.useRef<ChatKitElement | null>(null);
  const stableOptions = useStableOptions(options);

  const methods: ChatKitMethods = React.useMemo(() => {
    return CHATKIT_METHOD_NAMES.reduce((acc, key) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      acc[key] = (...args: any[]) => {
        if (!ref.current) {
          console.warn("ChatKit element is not mounted");
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (ref.current as any)[key](...args);
      };
      return acc;
    }, {} as ChatKitMethods);
  }, []);

  const setInstance = React.useCallback(
    (instance: ChatKitElement | null): void => {
      ref.current = instance;
    },
    []
  );

  const control: ChatKitControl = React.useMemo(() => {
    const options = {} as ChatKitOptions;
    const handlers: ChatKitEventHandlers = {};

    for (const [key, value] of Object.entries(stableOptions)) {
      if (/^on[A-Z]/.test(key) && key !== "onClientTool") {
        handlers[key] = value;
      } else {
        options[key] = value;
      }
    }

    return {
      setInstance,
      options,
      handlers,
    };
  }, [stableOptions, setInstance]);

  return React.useMemo(() => ({ ...methods, control }), [methods, control]);
}
