# Guides for AI Agents and Vibecoding

Better read [README.md](README.md) first for instructions on how to run the project in development mode.

## Project Structure & Modularity

- Core Framework: Vue 3.5+ (Composition API) + TypeScript + Vite
- Components: Prefer modular and feature-oriented structure. Group components for specific features under `components/<feature>/...`.
- Services: API requests should be encapsulated in separate files under the `services/` directory (e.g., `services/MailService.ts`), exported as objects using `export const XXXService = { ... }`.
  - Example:
    ```typescript
    export const MailService = {
        getStatus: async (userId: string): Promise<MailUserStatus> => {
            const response = await fetch(`${API_HOST}/syncer/sync/status?user_id=${userId}`)
            if (!response.ok) throw new Error(`fetch error: ${response.status} - ${response.statusText}`);
            return (await response.json()) as MailUserStatus;
        },
        updateAccount: async (userId: string, account: string, password: string): Promise<void> => {
            const response = await fetch(`${API_HOST}/syncer/sync/update`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({user_id: userId, account, password})
            });
            if (!response.ok) throw new Error(`fetch error: ${response.status} - ${response.statusText}`);
            return;
        }
    };
    ```

## Vue Single File Component (SFC) Guidelines

- Script Setup: Always use `<script setup lang="ts">`.
- Props Definition & Destructuring: Must use Vue 3.5's reactive props destructure syntax with default values directly. Avoid using `props.xxx` in templates or scripts.
  - Example:
    ```typescript
    const {
      defaultInputMode = 'text',
      enabledTemplate,
      enabledToollist,
      templates = []
    } = defineProps<{
      defaultInputMode?: "text" | "audio";
      enabledTemplate?: boolean;
      enabledToollist?: boolean;
      templates?: Template[];
    }>();
    ```
- Emits Definition: Use Vue 3.3's tuple type syntax to define emits. Avoid the old parentheses-based syntax.
  - Example:
    ```typescript
    const emit = defineEmits<{
      select: [agent: Bot]
    }>();
    ```
- Two-way Binding (v-model): Deprecate the old `prop` with `emit('update:xxx')` pattern. Use Vue 3.4's `defineModel` instead.
  - Single Binding:
    ```typescript
    // Inside component
    const templates: ModelRef<Template[]> = defineModel<Template[]>({ required: true });
    ```
    ```html
    <!-- External usage -->
    <AgentSettings
      v-model="templates"
    />
    ```
  - Multiple Named Bindings:
    ```typescript
    // Inside component
    const agent: ModelRef<Bot> = defineModel<Bot>('agent', { required: true });
    const userId: ModelRef<string | undefined> = defineModel<string>('userId');
    const chatId: ModelRef<string | undefined> = defineModel<string>('chatId');
    ```
    ```html
    <!-- External usage -->
    <ChatBoxComponent
      v-model:agent="selectAgent"
      v-model:user-id="userId"
      v-model:chat-id="chatId"
    />
    ```

## Types & Code Quality

- Strict Typing: Strictly require TypeScript type definitions. Using `any` is absolutely prohibited.
- Linting: Code must pass `ESLint` checks.
  - Current config: Vue flat/recommended with Vue macros for Composition API, TypeScript recommendedTypeChecked and stylisticTypeChecked rules.
  - Enforces `import type` for type-only imports, allows unused variables prefixed with `_`, disables `vue/multi-word-component-names`.
  - Warns on `no-console` (except `warn`/`error`) and `prefer-const`.
- Quality Assurance: All code must pass the full quality gate. The required checks are, in order:
  1. Type Check – Run `npm run typecheck` to ensure zero TypeScript type errors.
  2. Lint – Run `npm run lint:fix` to auto-fix where possible and verify all ESLint rules pass.
  3. Unit Tests – Run `npm run test:coverage` to execute all Vitest tests with coverage.
  4. Build – Run `npm run build` to confirm the production bundle compiles without errors.
