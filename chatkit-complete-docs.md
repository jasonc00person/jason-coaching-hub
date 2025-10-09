# OpenAI ChatKit - Complete Documentation

Official documentation from: https://openai.github.io/chatkit-js/

---

## Table of Contents

1. [Overview](#overview)
2. [Quickstart](#quickstart)
3. [Authentication](#authentication)
4. [Theming and Customization](#theming-and-customization)
5. [Methods (Imperative API)](#methods-imperative-api)
6. [Events](#events)
7. [Client Tools](#client-tools)
8. [Custom Backends](#custom-backends)
9. [Entity Tagging](#entity-tagging)
10. [Localization](#localization)

---

## Overview

ChatKit is a framework for building high-quality, AI-powered chat experiences. It's designed for developers who want to add advanced conversational intelligence to their apps fast—with minimal setup and no reinventing the wheel. ChatKit delivers a complete, production-ready chat interface out of the box.

### Key Features

- **Deep UI customization** so that ChatKit feels like a first-class part of your app
- **Built-in response streaming** for interactive, natural conversations
- **Tool and workflow integration** for visualizing agentic actions and chain-of-thought reasoning
- **Rich interactive widgets** rendered directly inside the chat
- **Attachment handling** with support for file and image uploads
- **Thread and message management** for organizing complex conversations
- **Source annotations and entity tagging** for transparency and references

### What Makes ChatKit Different?

ChatKit is a framework-agnostic, drop-in chat solution. You don't need to build custom UIs, manage low-level chat state, or patch together various features yourself. Just add the ChatKit component, give it a client token, and customize the chat experience as needed, no extra work needed.

Simply drop the ChatKit component into your app, configure a few options, and you're good to go.

---

## Quickstart

### React Implementation

```jsx
import { ChatKit, useChatKit } from '@openai/chatkit-react';

function MyChat({ clientToken }) {
  const { control } = useChatKit({ 
    api: { clientToken } 
  });
  
  return (
    <ChatKit 
      control={control} 
      className="h-[600px] w-[320px]" 
    />
  );
}
```

### Vanilla JavaScript Implementation

```javascript
function InitChatkit({ clientToken }) {
  const chatkit = document.createElement('openai-chatkit');
  chatkit.setOptions({ 
    api: { clientToken } 
  });
  chatkit.classList.add('h-[600px]', 'w-[320px]');
  document.body.appendChild(chatkit);
}
```

### Installation

```bash
# React
npm install @openai/chatkit-react

# Web Component
npm install @openai/chatkit-web-component
```

---

## Authentication

> **Note:** This guide is for hosted integrations. If you are using ChatKit.js with a custom backend, see [Custom Backends](#custom-backends).

ChatKit uses **short-lived client tokens** issued by your server. Your backend creates a session and returns a token to trusted clients. **Clients never use your API key directly.**

To keep sessions alive, refresh the token just before its expiration and reconnect the widget with the new secret.

### Generate Tokens on Your Server

1. Create a session on your server using the OpenAI API
2. Return it to the client
3. Create a way to refresh the token when it nears expiration
4. Connect ChatKit to your token refresh endpoint

### Configure ChatKit

#### React

```typescript
const { control } = useChatKit({
  api: {
    async getClientSecret(currentClientSecret) {
      if (!currentClientSecret) {
        // Initial token request
        const res = await fetch('/api/chatkit/start', { 
          method: 'POST' 
        });
        const { client_secret } = await res.json();
        return client_secret;
      }
      
      // Token refresh
      const res = await fetch('/api/chatkit/refresh', {
        method: 'POST',
        body: JSON.stringify({ currentClientSecret }),
        headers: { 
          'Content-Type': 'application/json' 
        },
      });
      const { client_secret } = await res.json();
      return client_secret;
    }
  },
});
```

#### Vanilla JavaScript

```javascript
const chatkit = document.getElementById('my-chat');

chatkit.setOptions({
  api: {
    async getClientSecret(currentClientSecret) {
      if (!currentClientSecret) {
        const res = await fetch('/api/chatkit/start', { 
          method: 'POST' 
        });
        const { client_secret } = await res.json();
        return client_secret;
      }
      
      const res = await fetch('/api/chatkit/refresh', {
        method: 'POST',
        body: JSON.stringify({ currentClientSecret }),
        headers: { 
          'Content-Type': 'application/json' 
        },
      });
      const { client_secret } = await res.json();
      return client_secret;
    }
  },
});
```

---

## Theming and Customization

ChatKit is customized by passing an options object:
- In React: options are passed to `useChatKit({...})`
- In direct integration: options are set with `chatkit.setOptions({...})`

In both cases, the shape of the options object is the same.

### Complete Customization Example

```typescript
const options: Partial<ChatKitOptions> = {
  theme: {
    colorScheme: "dark",
    color: {
      accent: {
        primary: "#D7263D",
        level: 2
      }
    },
    radius: "round",
    density: "normal",
    typography: {
      fontFamily: "Open Sans, sans-serif"
    },
  },
  header: {
    customButtonLeft: {
      icon: "settings-cog",
      onClick: () => alert("Profile settings"),
    },
  },
  composer: {
    placeholder: "Type your product feedback…",
    tools: [{
      id: "rate",
      label: "Rate",
      icon: "star",
      pinned: true
    }],
  },
  startScreen: {
    greeting: "Welcome to FeedbackBot!",
    prompts: [{
      name: "Bug",
      prompt: "Report a bug",
      icon: "bolt"
    }],
  },
  entities: {
    onTagSearch: async (query) => [
      { id: "user_123", title: "Jane Doe" },
    ],
    onRequestPreview: async (entity) => ({
      preview: {
        type: "Card",
        children: [
          { type: "Text", value: `Profile: ${entity.title}` },
          { type: "Text", value: "Role: Developer" },
        ],
      },
    }),
  },
};
```

### Change the Theme

Match your app's aesthetic by switching between light and dark themes, setting an accent color, controlling the density, rounding of corners, etc.

```typescript
const options: Partial<ChatKitOptions> = {
  theme: {
    colorScheme: "dark",
    color: {
      accent: {
        primary: "#2D8CFF",
        level: 2
      }
    },
    radius: "round",
    density: "compact",
    typography: {
      fontFamily: "'Inter', sans-serif"
    },
  },
};
```

### Override Text in the Composer and Start Screen

Let users know what to ask or guide their first input by changing the composer's placeholder text.

```typescript
const options: Partial<ChatKitOptions> = {
  composer: {
    placeholder: "Ask anything about your data…",
  },
  startScreen: {
    greeting: "Welcome to FeedbackBot!",
  },
};
```

### Show Starter Prompts for New Threads

Guide users on what to ask or do by suggesting prompt ideas when starting a conversation.

```typescript
const options: Partial<ChatKitOptions> = {
  startScreen: {
    greeting: "What can I help you build today?",
    prompts: [
      {
        name: "Check on the status of a ticket",
        prompt: "Can you help me check on the status of a ticket?",
        icon: "search"
      },
      {
        name: "Create Ticket",
        prompt: "Can you help me create a new support ticket?",
        icon: "write"
      },
    ],
  },
};
```

### Add Custom Buttons to the Header

Custom header buttons help you add navigation, context, or actions relevant to your integration.

```typescript
const options: Partial<ChatKitOptions> = {
  header: {
    customButtonLeft: {
      icon: "settings-cog",
      onClick: () => openProfileSettings(),
    },
    customButtonRight: {
      icon: "home",
      onClick: () => openHomePage(),
    },
  },
};
```

### Enable File Attachments

Attachments are disabled by default. To enable them, add attachments configuration.

> **Important:** Unless you are doing a custom backend, you must use the `hosted` upload strategy.

You can also control the number, size, and types of files that users can attach to messages.

```typescript
const options: Partial<ChatKitOptions> = {
  composer: {
    attachments: {
      uploadStrategy: { type: 'hosted' },
      maxSize: 20 * 1024 * 1024, // 20MB per file
      maxCount: 3,
      accept: {
        "application/pdf": [".pdf"],
        "image/*": [".png", ".jpg"]
      },
    },
  },
};
```

### Enable @mentions in the Composer with Entity Tags

Let users tag custom "entities" with @-mentions. This enables richer conversation context and interactivity.

- Use `onTagSearch` to return a list of entities based on the input query
- Use `onClick` to handle the click event of an entity

```typescript
const options: Partial<ChatKitOptions> = {
  entities: {
    async onTagSearch(query) {
      return [
        {
          id: "user_123",
          title: "Jane Doe",
          group: "People",
          interactive: true,
        },
        {
          id: "document_123",
          title: "Quarterly Plan",
          group: "Documents",
          interactive: true,
        },
      ];
    },
    onClick: (entity) => {
      navigateToEntity(entity.id);
    },
  },
};
```

### Customize How Entity Tags Appear

You can customize the appearance of entity tags on mouseover using widgets. Show rich previews such as a business card, document summary, or image when the user hovers over an entity tag.

```typescript
const options: Partial<ChatKitOptions> = {
  entities: {
    async onTagSearch() { /* ... */ },
    onRequestPreview: async (entity) => ({
      preview: {
        type: "Card",
        children: [
          { type: "Text", value: `Profile: ${entity.title}` },
          { type: "Text", value: "Role: Developer" },
        ],
      },
    }),
  },
};
```

### Add Custom Tools to the Composer

Enhance productivity by letting users trigger app-specific actions from the composer bar. The selected tool will be sent to the model as a tool preference.

```typescript
const options: Partial<ChatKitOptions> = {
  composer: {
    tools: [
      {
        id: 'add-note',
        label: 'Add Note',
        icon: 'write',
        pinned: true,
      },
    ],
  },
};
```

### Toggle UI Regions/Features

Disable major UI regions/features:
- Disabling the header can be useful when you need more customization
- Disabling history can be useful when the concept of threads/history doesn't make sense for your use case (e.g., a support chatbot)

```typescript
const options: Partial<ChatKitOptions> = {
  history: { enabled: false },
  header: { enabled: false },
};
```

### Override the Locale

Override the default locale, e.g., if you have an app-wide language setting. By default the locale is set to the browser's locale.

```typescript
const options: Partial<ChatKitOptions> = {
  locale: 'de-DE',
};
```

---

## Methods (Imperative API)

ChatKit exposes a compact set of imperative helpers for tasks that fall outside the declarative flow, such as switching threads, sending composed messages, or manually syncing data. These helpers are exposed on both the `useChatKit` hook and the `<openai-chatkit>` web component.

### React Usage

```typescript
import { ChatKit, useChatKit } from '@openai/chatkit-react';

export function Inbox({ clientToken }: { clientToken: string }) {
  const {
    control,
    focusComposer,
    setThreadId,
    sendUserMessage,
    setComposerValue,
    fetchUpdates,
    sendCustomAction,
  } = useChatKit({ api: { clientToken } });

  return <ChatKit control={control} className="h-[600px]" />;
}
```

### Vanilla JavaScript Usage

```typescript
const chatkit = document.getElementById('my-chat') as OpenAIChatKit;

await chatkit.focusComposer();
await chatkit.setThreadId(null); // new chat
await chatkit.setThreadId('thread_123');
await chatkit.sendUserMessage({ text: 'Hello there!' });
await chatkit.setComposerValue({ text: 'Draft message' });
await chatkit.fetchUpdates();
await chatkit.sendCustomAction({
  type: 'refresh-dashboard',
  payload: { page: 'settings' }
});
```

### Method Reference

#### `focusComposer()`

Focuses the ChatKit composer input. The method resolves once the focus request is delivered.

> **Note:** Focusing the composer may not work reliably on mobile browsers because many mobile platforms block programmatic focus routines outside of direct user gestures.

#### `setThreadId(threadId: string | null)`

Loads an existing thread or passes `null` to start a new draft conversation. Useful when a user selects a thread in your own navigation UI.

#### `sendUserMessage({ text, reply, attachments, newThread })`

Sends a message as the current user. Supply:
- `reply` (to be displayed as quoted text) when responding to an assistant message
- `attachments` with uploaded attachment descriptors
- `newThread: true` to force creation of a new thread

#### `setComposerValue({ text, reply, attachments })`

Replaces the composer contents without sending. Handy for drafting suggested replies or restoring saved state.

#### `fetchUpdates()`

Requests new events from your backend immediately instead of waiting for the normal polling cadence. Call this after mutating the thread externally (for example, when importing history).

#### `sendCustomAction(action, itemId?)`

Dispatches an arbitrary action payload back to your backend, optionally namespaced to a widget item ID. Use this to react to UI events (button clicks, widget commands) that require server-side handling.

> **Note:** All methods return `Promise<void>` and can be awaited to ensure the call completes before performing follow-up logic.

---

## Events

ChatKit emits CustomEvents that mirror the same lifecycle hooks exposed through `useChatKit`. Use them to keep local UI, analytics, and background workflows aligned with what the assistant is doing.

### Listening to Events

#### React

```typescript
import { ChatKit, useChatKit } from '@openai/chatkit-react';

export function Inbox({ clientToken }: { clientToken: string }) {
  const { control } = useChatKit({
    api: { clientToken },
    onThreadChange: ({ threadId }) => setActiveThread(threadId),
    onResponseStart: () => setIsResponding(true),
    onResponseEnd: () => setIsResponding(false),
    onLog: ({ name, data }) => logAnalytics(name, data),
  });

  return <ChatKit control={control} className="h-[600px]" />;
}
```

#### Vanilla JavaScript

```typescript
const chatkit = document.getElementById('my-chat') as OpenAIChatKit;

chatkit.addEventListener('chatkit.thread.change', (event) => {
  const { threadId } = event.detail;
  setActiveThread(threadId);
});

chatkit.addEventListener('chatkit.response.start', () => {
  setIsResponding(true);
});

chatkit.addEventListener('chatkit.response.end', () => {
  setIsResponding(false);
});
```

### Error Events

`chatkit.error` fires whenever ChatKit encounters a problem. Capture it to feed logs or telemetry.

```javascript
chatkit.addEventListener('chatkit.error', ({ detail }) => {
  reportError(detail.error);
});
```

When using React, pass `onError={({ error }) => ... }` to `useChatKit` for the same effect.

> **Note:** Most emitted errors are scoped (for example, a failed attachment upload) and are often paired with a toast or inline notice inside ChatKit.

### Log Events

Use `chatkit.log` (or `onLog`) for verbose, structured diagnostics.

```javascript
chatkit.addEventListener('chatkit.log', ({ detail }) => {
  console.debug('[chatkit]', detail.name, detail.data);
});
```

This channel is intentionally noisier than the error events, surfacing granular lifecycle details that help with debugging and operational monitoring.

### Other Events

- **`chatkit.response.start` / `chatkit.response.end`**: Emitted when the assistant begins or finishes streaming a response
- **`chatkit.thread.load.start` / `chatkit.thread.load.end`**: Emitted while ChatKit loads conversation history for a thread
- **`chatkit.thread.change`**: Dispatched whenever the active thread ID updates; pair it with `initialThread` when persisting sessions

> **Important:** Track whether ChatKit is responding or loading before invoking imperative helpers. Methods such as `sendUserMessage`, `focusComposer`, and `setThreadId` can reject if called during a response or thread load.

### Telemetry

ChatKit emits internal telemetry events to monitor runtime health and diagnose implementation issues. These events never include user-entered content, agent-generated output, or callback data.

---

## Client Tools

Client tools let your backend agent delegate work to the browser. When the agent calls a client tool, ChatKit pauses the response until your UI resolves `onClientTool`.

Use this option to reach APIs that only exist in the browser (local storage, UI state, hardware tokens, etc.) or when client views need to update in step with server-side changes. Return a JSON-serializable payload back to the server after you're done.

### Lifecycle Overview

1. Configure the same client tool names on your backend agent and in ChatKit
2. ChatKit receives a tool call from the agent and invokes `onClientTool({ name, params })`
3. Your handler runs in the browser and returns an object (or `Promise`) describing the result. ChatKit forwards that payload to your backend
4. If the handler throws, the tool call fails and the assistant gets the error message

### Register the Handler in Your UI

#### React

```typescript
import { ChatKit, useChatKit } from '@openai/chatkit-react';
import type { ChatKitOptions } from '@openai/chatkit';

type ClientToolCall =
  | { name: 'send_email'; params: { email_id: string } }
  | { name: 'open_tab'; params: { url: string } };

export function SupportInbox({ clientToken }: { clientToken: string }) {
  const { control } = useChatKit({
    api: { clientToken },
    onClientTool: async (toolCall) => {
      const { name, params } = toolCall as ClientToolCall;

      switch (name) {
        case 'send_email':
          const result = await sendEmail(params.email_id);
          return { success: result.ok, id: result.id };

        case 'open_tab':
          window.open(params.url, '_blank', 'noopener');
          return { opened: true };

        default:
          throw new Error(`Unhandled client tool: ${name}`);
      }
    },
  } satisfies ChatKitOptions);

  return <ChatKit control={control} className="h-[600px] w-[320px]" />;
}
```

#### Vanilla JavaScript

```javascript
const chatkit = document.getElementById('chatkit');

chatkit.setOptions({
  api: { clientToken },
  async onClientTool({ name, params }) {
    if (name === 'get_geolocation') {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    }

    throw new Error(`Unknown client tool: ${name}`);
  },
});
```

### Returning Values

- Return only **JSON-serializable objects**. They are sent straight back to your backend
- **Async work is supported**—`onClientTool` can return a promise
- **Throwing an error** surfaces the message to the agent and halts the tool call
- If a tool does not need to return data, return `{}` to mark the invocation as success

---

## Custom Backends

Use a custom backend when you need full control over routing, tools, memory, or security. Provide a custom fetch function to use for API requests and orchestrate model calls yourself.

### Approaches

1. Use the ChatKit Python SDK for fast integration
2. Or integrate directly with your model provider and implement compatible events

### Configure ChatKit

#### React

```typescript
const auth = getUserAuth(); // your custom auth info

const { control } = useChatKit({
  api: {
    url: 'https://your-domain.com/your/chatkit/api',

    // Any info you inject in the custom fetch callback is invisible to ChatKit
    fetch(url: string, options: RequestInit) {
      return fetch(url, {
        ...options,
        // Inject your auth header here
        headers: {
          ...options.headers,
          "Authorization": `Bearer ${auth}`,
        },
        // You can override any options here
      });
    },

    // Required when attachments are enabled
    uploadStrategy: {
      type: "direct",
      uploadUrl: "https://your-domain.com/your/chatkit/api/upload",
    },

    // Register your domain in the dashboard at
    // https://platform.openai.com/settings/organization/security/domain-allowlist
    domainKey: "your-domain-key",
  },
});
```

#### Vanilla JavaScript

```javascript
const chatkit = document.getElementById('my-chat');

chatkit.setOptions({
  api: {
    url: 'https://your-domain.com/your/chatkit/api',
    fetch(url: string, options: RequestInit) {
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          // Inject your auth header here
          // Anything you do in this callback is invisible to ChatKit
          "Authorization": `Bearer ${auth}`,
        },
        // You can override any options here
      });
    },
    // Register your domain in the dashboard at
    // https://platform.openai.com/settings/organization/security/domain-allowlist
    domainKey: "your-domain-key",
    // Required when attachments are enabled
    uploadStrategy: {
      type: "direct",
      uploadUrl: "https://your-domain.com/your/chatkit/api/upload",
    }
  },
});
```

---

## Entity Tagging

> **Note:** Entities are supported only in custom integrations. If you are using ChatKit.js with a hosted backend, entity features are not available.

Entities are structured pieces of information your system can recognize during a conversation—such as names, dates, IDs, or product-specific objects. They represent meaningful objects in your app's domain.

### Examples

- In a notes app, entities might be documents
- In a news site, they might be articles
- In an online store, they might be products

When detected, entities can link messages to real data and power richer actions and previews.

### Using Entities

Entities can be used as cited sources in assistant responses. You can customize the popover preview rendered on hover by providing `entities.onRequestPreview` in options.

```typescript
const options: Partial<ChatKitOptions> = {
  entities: {
    async onTagSearch(query) {
      // Return entities matching the search query
      return [
        {
          id: "doc_123",
          title: "Quarterly Report",
          group: "Documents",
          interactive: true,
        },
      ];
    },
    onRequestPreview: async (entity) => ({
      preview: {
        type: "Card",
        children: [
          { type: "Text", value: `Document: ${entity.title}` },
          { type: "Text", value: "Last modified: 2 days ago" },
        ],
      },
    }),
    onClick: (entity) => {
      // Handle entity click
      navigateToDocument(entity.id);
    },
  },
};
```

---

## Localization

ChatKit translates its built-in UI (system messages, default header labels, generic errors) using the browser's preferred locale. If the requested locale is not available, ChatKit falls back to English.

### Automatic Locale Detection

When ChatKit resolves a locale (either from the browser or the `locale` option), it sends that value in the `Accept-Language` header for each API request.

### Set a Specific Locale

Set the `locale` option whenever you need to lock ChatKit to a specific translation, regardless of browser preferences.

```typescript
const options: Partial<ChatKitOptions> = {
  locale: 'de-DE',
};
```

> **Important:** `setOptions` fully replaces the previous configuration, so each call should include the entire options object.

### Provide Localized Option Strings

Options such as:
- `startScreen.greeting`
- `startScreen.prompts`
- `header.title.text`
- Other text fields

...are **not auto-translated**. Pass fully translated values that match the locale you resolved for the user.

### Runtime Locale Switching

If you switch locales at runtime, update every user-facing string in your options at the same time to avoid mixing languages.

### Supported Locales

The list of supported locales is available in the API reference.

---

## Best Practices

### Security

1. **Never expose your API key in client-side code**
2. Always use server-generated client tokens
3. Implement proper token refresh logic
4. Use custom backends for sensitive operations

### Performance

1. Use the `onLog` event selectively—it's verbose
2. Implement proper error handling for network issues
3. Consider disabling features you don't need (e.g., history, attachments)

### User Experience

1. Provide clear starter prompts to guide users
2. Customize the theme to match your brand
3. Use entity tagging for richer interactions
4. Implement proper loading states using events

### Integration

1. Use React hooks when possible for better state management
2. Leverage client tools for browser-specific functionality
3. Implement proper cleanup in unmount handlers
4. Test token refresh logic thoroughly

---

## Common Patterns

### Pattern: Sidebar Chat

```typescript
function SidebarChat() {
  const [isOpen, setIsOpen] = useState(false);
  const { control } = useChatKit({
    api: { clientToken: getToken() },
    onThreadChange: ({ threadId }) => {
      // Save thread ID to local storage
      localStorage.setItem('lastThreadId', threadId);
    },
  });

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      {isOpen && (
        <ChatKit
          control={control}
          className="h-full w-80"
        />
      )}
    </div>
  );
}
```

### Pattern: Multi-Agent Chat

```typescript
function MultiAgentChat() {
  const [currentAgent, setCurrentAgent] = useState('support');
  
  const { control } = useChatKit({
    api: {
      clientToken: getToken(),
      // Custom headers to specify agent
      fetch: (url, options) => fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'X-Agent-Type': currentAgent,
        },
      }),
    },
  });

  return (
    <>
      <AgentSelector onChange={setCurrentAgent} />
      <ChatKit control={control} className="flex-1" />
    </>
  );
}
```

### Pattern: Contextual Chat

```typescript
function DocumentChat({ documentId }) {
  const { control, sendUserMessage } = useChatKit({
    api: { clientToken: getToken() },
    entities: {
      onTagSearch: async () => [
        { id: documentId, title: 'Current Document' },
      ],
    },
  });

  useEffect(() => {
    // Auto-send context when document changes
    sendUserMessage({
      text: `I'm now viewing document ${documentId}`,
      newThread: true,
    });
  }, [documentId]);

  return <ChatKit control={control} />;
}
```

---

## Troubleshooting

### Issue: ChatKit not loading

**Solution:** Check that:
1. Client token is valid
2. Network requests are succeeding
3. Domain is allowlisted (for custom backends)

### Issue: Token refresh failing

**Solution:** Ensure your refresh endpoint:
1. Returns valid `client_secret`
2. Accepts the current token
3. Has proper error handling

### Issue: Attachments not working

**Solution:** Verify:
1. `uploadStrategy` is configured
2. Upload endpoint is accessible
3. File size/type restrictions are met

### Issue: Custom tools not executing

**Solution:** Check that:
1. Tool names match between backend and frontend
2. `onClientTool` returns JSON-serializable data
3. No errors are thrown in the handler

---

## API Reference

For complete API reference including all types, interfaces, and options, visit:
- React API: https://openai.github.io/chatkit-js/api/openai/chatkit-react/
- Web Component API: https://openai.github.io/chatkit-js/api/openai/chatkit/

---

## Resources

- **Official Documentation**: https://openai.github.io/chatkit-js/
- **Platform Guide**: https://platform.openai.com/docs/guides/chatkit
- **GitHub**: https://github.com/openai/chatkit-js
- **Community**: https://community.openai.com/

---

## Version Information

This documentation is for ChatKit.js as of October 2025. For the latest updates, always refer to the official documentation.