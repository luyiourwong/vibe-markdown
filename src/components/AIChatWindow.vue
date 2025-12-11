<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, type Ref, nextTick } from 'vue';
import OpenAI from 'openai';
import DiffMatchPatch from 'diff-match-patch';
import type { Message, Settings, Lang, HighlightRange } from '@/types';
import { I18N } from '@/constants/i18n';

const show = defineModel<boolean>('show');
const selectedText = defineModel<string>('selectedText');
const markdownContent = defineModel<string>('markdownContent');
const diffHighlights = defineModel<HighlightRange[]>('diffHighlights');
const { currentLang, settings } = defineProps<{
  currentLang: Lang;
  settings: Settings;
}>();

const emit = defineEmits<{
  openSettings: []
}>();

const t = computed(() => I18N[currentLang]);
const chatMessages: Ref<Message[]> = ref<Message[]>([
  { role: 'assistant', content: t.value.initialGreeting }
]);
const chatInput = ref('');
const isSending = ref(false);
const chatPosition = ref({ x: window.innerWidth - 380, y: 80 });
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });
const chatMessagesRef = ref<HTMLDivElement | null>(null);

const truncatedSelection = computed(() => {
  if (!selectedText.value) return '';
  return selectedText.value.length > 50
    ? selectedText.value.substring(0, 50) + '...'
    : selectedText.value;
});

const clearChat = () => {
  chatMessages.value = [];
};

const applyDiff = (original: string | undefined, diff: string): { content: string; ranges: HighlightRange[] } => {
  const dmp = new DiffMatchPatch();
  // Increase Match_Distance to allow finding matches anywhere in the file
  // Default is 1000, which causes failures for content further down in the file
  dmp.Match_Distance = 100000;
  dmp.Match_Threshold = 0.5;

  let newContent = original ?? '';
  const ranges: HighlightRange[] = [];
  const lines = diff.split('\n');
  const blocks: { search: string; replace: string }[] = [];

  let i = 0;
  while (i < lines.length) {
    if (lines[i].includes('<<<<<<< SEARCH')) {
      const start = i;
      let middle = -1;
      let end = -1;

      for (let j = start + 1; j < lines.length; j++) {
        if (lines[j].includes('=======')) {
          middle = j;
          break;
        }
      }

      if (middle !== -1) {
        for (let k = middle + 1; k < lines.length; k++) {
          if (lines[k].includes('>>>>>>> REPLACE')) {
            end = k;
            break;
          }
        }
      }

      if (middle !== -1 && end !== -1) {
        const search = lines.slice(start + 1, middle).join('\n');
        const replace = lines.slice(middle + 1, end).join('\n');
        blocks.push({ search, replace });
        i = end + 1;
        continue;
      }
    }
    i++;
  }

  for (const block of blocks) {
    const patches = dmp.patch_make(block.search, block.replace);
    const [appliedText, results] = dmp.patch_apply(patches, newContent);
    if (results.some(r => r)) {
      const diffs = dmp.diff_main(newContent, appliedText);
      dmp.diff_cleanupSemantic(diffs);

      let currentIndex = 0;
      for (const [type, text] of diffs) {
        if (type === 0) { // Equal
          currentIndex += text.length;
        }
        else if (type === 1) { // Insert
          ranges.push({ start: currentIndex, end: currentIndex + text.length });
          currentIndex += text.length;
        }
      }
      newContent = appliedText;
    }
    else {
      console.warn('Failed to apply block:', block.search);
    }
  }

  return { content: newContent, ranges };
};

const formatToolCall = (toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall) => {
  if (toolCall.type !== 'function') return;
  try {
    const args = JSON.parse(toolCall.function.arguments) as { diff: string };
    if (toolCall.function.name === 'edit' && args.diff) {
      const match = /=======\s*([\s\S]*?)\s*>>>>>>> REPLACE/.exec(args.diff);
      const content = match ? match[1].trim() : args.diff;
      return content.length > 150 ? content.substring(0, 150) + '...' : content;
    }
    return JSON.stringify(args);
  }
  catch {
    return toolCall.function.arguments;
  }
};

const sendMessage = async () => {
  if (!chatInput.value.trim() || isSending.value) return;

  diffHighlights.value = [];

  if (!settings.apiKey) {
    alert(t.value.noKeyWarning);
    emit('openSettings');
    return;
  }

  let sysMsg = 'You are a helpful Markdown editor assistant. You help the user write, edit, and improve their markdown content. The markdown has the following content,\n';
  sysMsg += `\n\nFull Content:\n<BEGIN_FILES>\n${markdownContent.value}\n<END_FILES>`;
  if (selectedText.value) {
    sysMsg += `\n\nResponse based on user selected part:\n\`\`\`\n${selectedText.value}\n\`\`\``;
  }

  chatMessages.value.push({ role: 'user', content: chatInput.value });
  chatInput.value = '';
  await scrollToBottom();

  isSending.value = true;

  try {
    const openai = new OpenAI({
      baseURL: settings.apiUrl,
      apiKey: settings.apiKey,
      dangerouslyAllowBrowser: true
    });

    const tools = [
      {
        type: 'function',
        function: {
          name: 'edit',
          description: 'Edit the markdown content. Use the following format for the `diff` argument:\n<<<<<<< SEARCH\n[exact content to find]\n=======\n[new content]\n>>>>>>> REPLACE',
          parameters: {
            type: 'object',
            properties: {
              diff: {
                type: 'string',
                description: 'The search/replace block.'
              }
            },
            required: ['diff']
          }
        }
      }
    ];

    const response = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: sysMsg },
        ...chatMessages.value.map((m: Message) => ({
          role: m.role,
          content: m.content,
          tool_calls: m.tool_calls,
          tool_call_id: m.tool_call_id,
          name: m.name
        }) as OpenAI.Chat.Completions.ChatCompletionMessageParam)
      ],
      model: settings.model,
      tools: tools as OpenAI.Chat.Completions.ChatCompletionTool[],
      tool_choice: 'auto'
    });

    const message = response.choices[0]?.message;

    if (message.tool_calls) {
      chatMessages.value.push({
        role: 'assistant',
        content: message.content,
        tool_calls: message.tool_calls
      });
      await scrollToBottom();

      for (const toolCall of message.tool_calls) {
        if (toolCall.type === 'function') {
          if (toolCall.function.name === 'edit') {
            const args = JSON.parse(toolCall.function.arguments) as { diff: string };
            const { content: newContent, ranges } = applyDiff(markdownContent.value, args.diff);

            let resultMsg = '';
            if (newContent !== markdownContent.value) {
              markdownContent.value = newContent;
              diffHighlights.value = ranges;
              resultMsg = t.value.successEdit;
            }
            else {
              resultMsg = t.value.failEdit;
            }

            chatMessages.value.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: resultMsg
            });
            await scrollToBottom();
          }
        }
      }

      const followUp = await openai.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a helpful Markdown editor assistant.' },
          ...chatMessages.value.map((m: Message) => ({
            role: m.role,
            content: m.content,
            tool_calls: m.tool_calls,
            tool_call_id: m.tool_call_id,
            name: m.name
          }) as OpenAI.Chat.Completions.ChatCompletionMessageParam)
        ],
        model: settings.model,
        tools: tools as OpenAI.Chat.Completions.ChatCompletionTool[]
      });

      const followUpReply = followUp.choices[0]?.message?.content;
      if (followUpReply) {
        chatMessages.value.push({ role: 'assistant', content: followUpReply });
        await scrollToBottom();
      }

    }
    else {
      const reply = message.content ?? t.value.noResponse;
      chatMessages.value.push({ role: 'assistant', content: reply });
      await scrollToBottom();
    }

  }
  catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    chatMessages.value.push({ role: 'assistant', content: `${t.value.errorPrefix}${errorMessage}` });
    await scrollToBottom();
  }
  finally {
    isSending.value = false;
  }
};

// Dragging Logic
const startDrag = (e: MouseEvent) => {
  isDragging.value = true;
  dragOffset.value = {
    x: e.clientX - chatPosition.value.x,
    y: e.clientY - chatPosition.value.y
  };
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', stopDrag);
};

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return;
  chatPosition.value = {
    x: e.clientX - dragOffset.value.x,
    y: e.clientY - dragOffset.value.y
  };
};

const stopDrag = () => {
  isDragging.value = false;
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
};

const scrollToBottom = async () => {
  if (chatMessagesRef.value) {
    await nextTick();
    chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
  }
};

onMounted(() => {
  if (window.innerWidth < 1000) {
    chatPosition.value = { x: 20, y: 80 };
  }
});

onUnmounted(() => {
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
});
</script>

<template>
  <div
    v-if="show"
    class="fixed flex flex-col bg-gray-850 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden"
    :style="{ left: chatPosition.x + 'px', top: chatPosition.y + 'px', width: '360px', height: '600px' }"
  >
    <!-- Drag Handle Header -->
    <div
      class="h-10 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-3 cursor-move select-none"
      @mousedown="startDrag"
    >
      <span class="text-xs text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1">
        <span class="material-icons text-sm">auto_awesome</span> {{ t.chat }}
      </span>
      <div class="flex items-center gap-1">
        <button
          class="text-gray-500 hover:text-gray-300 p-1"
          :title="t.clear"
          @click="clearChat"
        >
          <span class="material-icons text-sm">delete_sweep</span>
        </button>
        <button
          class="text-gray-500 hover:text-gray-300 p-1"
          @click="show = false"
        >
          <span class="material-icons text-sm">close</span>
        </button>
      </div>
    </div>

    <!-- Messages -->
    <div
      ref="chatMessagesRef"
      class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/95"
    >
      <div
        v-for="(msg, idx) in chatMessages"
        :key="idx"
        :class="['flex flex-col max-w-[90%]', msg.role === 'user' ? 'self-end items-end' : 'self-start items-start']"
      >
        <div
          :class="['px-3 py-2 rounded-lg text-sm shadow-sm', 
                   msg.role === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none']"
        >
          <div
            v-if="msg.role === 'tool'"
            class="text-xs"
          >
            <div class="font-bold text-green-500 flex items-center gap-1">
              <span class="material-icons text-[10px]">swap_horiz</span>
              {{ t.result }}
            </div>
            <div class="font-mono text-gray-400 whitespace-pre-wrap break-all bg-gray-900/50 p-1 rounded">
              {{ msg.content }}
            </div>
          </div>
          <template v-else>
            <div
              v-if="msg.content"
              class="whitespace-pre-wrap"
            >
              {{ msg.content }}
            </div>
            <div
              v-if="msg.tool_calls"
              class="space-y-2 w-full"
            >
              <div
                v-for="(tool, tIdx) in msg.tool_calls"
                :key="tIdx"
                class="text-xs"
              >
                <div class="font-bold text-purple-300 mb-1 flex items-center gap-1">
                  <span class="material-icons text-[10px]">terminal</span>
                  {{ tool.function.name }}
                </div>
                <div class="font-mono text-gray-400 whitespace-pre-wrap break-all bg-gray-900/50 p-1 rounded">
                  {{ formatToolCall(tool) }}
                </div>
              </div>
            </div>
          </template>
        </div>
        <span class="text-[10px] text-gray-500 mt-1">{{ msg.role === 'user' ? t.you : t.ai }}</span>
      </div>
      <div
        v-if="isSending"
        class="self-start text-gray-500 text-xs animate-pulse"
      >
        {{ t.thinking }}
      </div>
    </div>

    <!-- Input Area -->
    <div class="p-3 border-t border-gray-700 bg-gray-800">
      <!-- Selection Indicator -->
      <div
        v-if="selectedText"
        class="mb-2 px-2 py-1 bg-gray-700/50 rounded border-l-2 border-purple-500 flex items-center justify-between group"
      >
        <div class="flex items-center gap-2 overflow-hidden">
          <span class="material-icons text-xs text-purple-400">format_quote</span>
          <span class="text-xs text-gray-300 truncate">{{ truncatedSelection }}</span>
        </div>
        <button
          class="text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
          @click="selectedText = ''"
        >
          <span class="material-icons text-xs">close</span>
        </button>
      </div>

      <div class="relative chat-input">
        <textarea
          v-model="chatInput"
          :placeholder="t.placeholder"
          class="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm text-white focus:border-purple-500 outline-none resize-none h-20"
          @keydown.ctrl.enter="sendMessage"
        />
        <button
          :disabled="isSending || !chatInput.trim()"
          class="absolute bottom-2 right-2 p-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          @click="sendMessage"
        >
          <span class="material-icons text-sm">send</span>
        </button>
      </div>
    </div>
  </div>
</template>