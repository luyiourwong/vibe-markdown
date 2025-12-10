<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import OpenAI from 'openai';
import type { Message, Settings, Lang } from '@/types';
import { I18N } from '@/constants/i18n';

const props = defineProps<{
  show: boolean;
  currentLang: Lang;
  settings: Settings;
  selectedText: string;
}>();

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
  (e: 'update:selectedText', value: string): void;
  (e: 'openSettings'): void;
}>();

const t = computed(() => I18N[props.currentLang]);
const chatMessages = ref<Message[]>([
  { role: 'assistant', content: 'Hello! I am your AI assistant. How can I help you with your Markdown today?' }
]);
const chatInput = ref('');
const isSending = ref(false);
const chatPosition = ref({ x: window.innerWidth - 380, y: 80 });
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

const truncatedSelection = computed(() => {
  if (!props.selectedText) return '';
  return props.selectedText.length > 50 
    ? props.selectedText.substring(0, 50) + '...' 
    : props.selectedText;
});

const clearChat = () => {
  chatMessages.value = [];
};

const sendMessage = async () => {
  if (!chatInput.value.trim() || isSending.value) return;

  if (!props.settings.apiKey) {
    alert(t.value.noKeyWarning);
    emit('openSettings');
    return;
  }

  let userMsg = chatInput.value;
  
  if (props.selectedText) {
    userMsg += `\n\nContext:\n\`\`\`\n${props.selectedText}\n\`\`\``;
  }

  chatMessages.value.push({ role: 'user', content: userMsg });
  chatInput.value = '';
  
  isSending.value = true;

  try {
    const openai = new OpenAI({
      baseURL: props.settings.apiUrl,
      apiKey: props.settings.apiKey,
      dangerouslyAllowBrowser: true
    });

    const response = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a helpful Markdown editor assistant. You help the user write, edit, and improve their markdown content.' },
        ...chatMessages.value.map(m => ({ role: m.role, content: m.content }))
      ],
      model: props.settings.model,
    });

    const reply = response.choices[0]?.message?.content || 'No response';
    chatMessages.value.push({ role: 'assistant', content: reply });

  } catch (error: any) {
    console.error(error);
    chatMessages.value.push({ role: 'assistant', content: `Error: ${error.message}` });
  } finally {
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
          @click="emit('update:show', false)"
        >
          <span class="material-icons text-sm">close</span>
        </button>
      </div>
    </div>

    <!-- Messages -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/95">
      <div
        v-for="(msg, idx) in chatMessages"
        :key="idx" 
        :class="['flex flex-col max-w-[90%]', msg.role === 'user' ? 'self-end items-end' : 'self-start items-start']"
      >
        <div
          :class="['px-3 py-2 rounded-lg text-sm shadow-sm', 
                   msg.role === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none']"
        >
          <div class="whitespace-pre-wrap">
            {{ msg.content }}
          </div>
        </div>
        <span class="text-[10px] text-gray-500 mt-1">{{ msg.role === 'user' ? 'You' : 'AI' }}</span>
      </div>
      <div
        v-if="isSending"
        class="self-start text-gray-500 text-xs animate-pulse"
      >
        Thinking...
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
          @click="emit('update:selectedText', '')"
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