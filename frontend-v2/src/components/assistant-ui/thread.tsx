import {
  ActionBarPrimitive,
  BranchPickerPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react";
import type { FC } from "react";
import {
  ArrowDownIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  PencilIcon,
  RefreshCwIcon,
  SendHorizontalIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { ToolFallback } from "./tool-fallback";

export const Thread: FC = () => {
  return (
    <ThreadPrimitive.Root
      className="bg-[#0F0F0F] text-white box-border flex h-full flex-col overflow-hidden"
      style={{
        ["--thread-max-width" as string]: "42rem",
      }}
    >
      <ThreadPrimitive.Viewport className="flex h-full flex-col items-center overflow-y-scroll scroll-smooth bg-inherit px-4">
        {/* Centered start screen */}
        <ThreadPrimitive.Empty>
          <div className="flex flex-col items-center justify-center min-h-full w-full max-w-[var(--thread-max-width)] py-8">
            <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full">
              <h1 className="text-4xl font-medium text-white">
                What can I help you create today?
              </h1>
              
              <ThreadWelcomeSuggestions />
              
              {/* Centered composer for start screen */}
              <div className="w-full max-w-[var(--thread-max-width)] mt-8">
                <Composer />
              </div>
            </div>
          </div>
        </ThreadPrimitive.Empty>

        {/* Regular messages view */}
        <ThreadPrimitive.If empty={false}>
          <div className="w-full pt-8">
            <ThreadPrimitive.Messages
              components={{
                UserMessage: UserMessage,
                EditComposer: EditComposer,
                AssistantMessage: AssistantMessage,
              }}
            />
          </div>

          <div className="min-h-8 flex-grow" />

          <div className="sticky bottom-0 mt-3 flex w-full max-w-[var(--thread-max-width)] flex-col items-center justify-end rounded-t-lg bg-inherit pb-4">
            <ThreadScrollToBottom />
            <Composer />
          </div>
        </ThreadPrimitive.If>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <TooltipIconButton
        tooltip="Scroll to bottom"
        variant="outline"
        className="absolute -top-8 rounded-full disabled:invisible"
      >
        <ArrowDownIcon />
      </TooltipIconButton>
    </ThreadPrimitive.ScrollToBottom>
  );
};

const ThreadWelcomeSuggestions: FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
      <ThreadPrimitive.Suggestion
        className="hover:bg-white/10 flex flex-col items-start justify-center rounded-xl border border-white/10 p-4 transition-colors cursor-pointer"
        prompt="Hook Templates"
        method="replace"
        autoSend
      >
        <span className="text-sm font-medium">✨ Hook Templates</span>
        <span className="text-xs text-gray-400 mt-1">
          Get proven hooks for your content
        </span>
      </ThreadPrimitive.Suggestion>

      <ThreadPrimitive.Suggestion
        className="hover:bg-white/10 flex flex-col items-start justify-center rounded-xl border border-white/10 p-4 transition-colors cursor-pointer"
        prompt="Content Strategy"
        method="replace"
        autoSend
      >
        <span className="text-sm font-medium">📋 Content Strategy</span>
        <span className="text-xs text-gray-400 mt-1">
          Build your content calendar
        </span>
      </ThreadPrimitive.Suggestion>

      <ThreadPrimitive.Suggestion
        className="hover:bg-white/10 flex flex-col items-start justify-center rounded-xl border border-white/10 p-4 transition-colors cursor-pointer"
        prompt="ICP Framework"
        method="replace"
        autoSend
      >
        <span className="text-sm font-medium">🎯 ICP Framework</span>
        <span className="text-xs text-gray-400 mt-1">
          Define your ideal customer
        </span>
      </ThreadPrimitive.Suggestion>

      <ThreadPrimitive.Suggestion
        className="hover:bg-white/10 flex flex-col items-start justify-center rounded-xl border border-white/10 p-4 transition-colors cursor-pointer"
        prompt="Script Templates"
        method="replace"
        autoSend
      >
        <span className="text-sm font-medium">📝 Script Templates</span>
        <span className="text-xs text-gray-400 mt-1">
          Ready-to-use video scripts
        </span>
      </ThreadPrimitive.Suggestion>
    </div>
  );
};

const Composer: FC = () => {
  return (
    <ComposerPrimitive.Root className="focus-within:border-white/20 flex w-full flex-wrap items-end rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-2.5 shadow-lg transition-colors">
      <ComposerPrimitive.Input
        rows={1}
        autoFocus
        placeholder="What do you want to know?"
        className="placeholder:text-gray-500 max-h-40 flex-grow resize-none border-none bg-transparent px-2 py-4 text-sm text-white outline-none focus:ring-0 disabled:cursor-not-allowed"
      />
      <ComposerAction />
    </ComposerPrimitive.Root>
  );
};

const ComposerAction: FC = () => {
  return (
    <>
      <ThreadPrimitive.If running={false}>
        <ComposerPrimitive.Send asChild>
          <TooltipIconButton
            tooltip="Send"
            variant="default"
            className="my-2.5 size-8 p-2 bg-white text-black hover:bg-white/90 rounded-full transition-opacity"
          >
            <SendHorizontalIcon />
          </TooltipIconButton>
        </ComposerPrimitive.Send>
      </ThreadPrimitive.If>
      <ThreadPrimitive.If running>
        <ComposerPrimitive.Cancel asChild>
          <TooltipIconButton
            tooltip="Cancel"
            variant="default"
            className="my-2.5 size-8 p-2 bg-white text-black hover:bg-white/90 rounded-full transition-opacity"
          >
            <CircleStopIcon />
          </TooltipIconButton>
        </ComposerPrimitive.Cancel>
      </ThreadPrimitive.If>
    </>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="grid w-full max-w-[var(--thread-max-width)] mx-auto auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 py-4 [&:where(>*)]:col-start-2">
      <UserActionBar />

      <div className="bg-white/10 text-white col-start-2 row-start-2 max-w-[calc(var(--thread-max-width)*0.8)] break-words rounded-3xl px-5 py-2.5 backdrop-blur-xl">
        <MessagePrimitive.Content />
      </div>

      <BranchPicker className="col-span-full col-start-1 row-start-3 -mr-1 justify-end" />
    </MessagePrimitive.Root>
  );
};

const UserActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      className="col-start-1 row-start-2 mr-3 mt-2.5 flex flex-col items-end"
    >
      <ActionBarPrimitive.Edit asChild>
        <TooltipIconButton tooltip="Edit" className="text-white hover:bg-white/10">
          <PencilIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <ComposerPrimitive.Root className="bg-white/10 backdrop-blur-xl my-4 flex w-full max-w-[var(--thread-max-width)] mx-auto flex-col gap-2 rounded-xl">
      <ComposerPrimitive.Input className="text-white flex h-8 w-full resize-none bg-transparent p-4 pb-0 outline-none" />

      <div className="mx-3 mb-3 flex items-center justify-center gap-2 self-end">
        <ComposerPrimitive.Cancel asChild>
          <Button variant="ghost" className="text-white hover:bg-white/10">Cancel</Button>
        </ComposerPrimitive.Cancel>
        <ComposerPrimitive.Send asChild>
          <Button className="bg-white text-black hover:bg-white/90">Send</Button>
        </ComposerPrimitive.Send>
      </div>
    </ComposerPrimitive.Root>
  );
};

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="relative grid w-full max-w-[var(--thread-max-width)] mx-auto grid-cols-[auto_auto_1fr] grid-rows-[auto_1fr] py-4">
      <div className="text-white col-span-2 col-start-2 row-start-1 my-1.5 max-w-[calc(var(--thread-max-width)*0.8)] break-words leading-7">
        <MessagePrimitive.Parts
          components={{ Text: MarkdownText, tools: { Fallback: ToolFallback } }}
        />
      </div>

      <AssistantActionBar />

      <BranchPicker className="col-start-2 row-start-2 -ml-2 mr-2" />
    </MessagePrimitive.Root>
  );
};

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      className="text-gray-400 data-[floating]:bg-black/50 data-[floating]:backdrop-blur-xl col-start-3 row-start-2 -ml-1 flex gap-1 data-[floating]:absolute data-[floating]:rounded-md data-[floating]:border data-[floating]:border-white/10 data-[floating]:p-1 data-[floating]:shadow-sm"
    >
      <ActionBarPrimitive.Copy asChild>
        <TooltipIconButton tooltip="Copy" className="text-white hover:bg-white/10">
          <MessagePrimitive.If copied>
            <CheckIcon />
          </MessagePrimitive.If>
          <MessagePrimitive.If copied={false}>
            <CopyIcon />
          </MessagePrimitive.If>
        </TooltipIconButton>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <TooltipIconButton tooltip="Refresh" className="text-white hover:bg-white/10">
          <RefreshCwIcon />
        </TooltipIconButton>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  );
};

const BranchPicker: FC<BranchPickerPrimitive.Root.Props> = ({
  className,
  ...rest
}) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        "text-gray-400 inline-flex items-center text-xs",
        className,
      )}
      {...rest}
    >
      <BranchPickerPrimitive.Previous asChild>
        <TooltipIconButton tooltip="Previous" className="text-white hover:bg-white/10">
          <ChevronLeftIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Previous>
      <span className="font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <TooltipIconButton tooltip="Next" className="text-white hover:bg-white/10">
          <ChevronRightIcon />
        </TooltipIconButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};

const CircleStopIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      width="16"
      height="16"
    >
      <rect width="10" height="10" x="3" y="3" rx="2" />
    </svg>
  );
};

