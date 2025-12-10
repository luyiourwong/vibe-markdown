<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Lang } from '@/types';
import { I18N } from '@/constants/i18n';

const props = defineProps<{
  modelValue: string;
  currentLang: Lang;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'selectionChange', text: string): void;
}>();

const t = computed(() => I18N[props.currentLang]);
const editorRef = ref<HTMLTextAreaElement | null>(null);
const lineNumbersRef = ref<HTMLDivElement | null>(null);

const lineCount = computed(() => {
  return props.modelValue.split('\n').length;
});

const handleScroll = (e: Event) => {
  const target = e.target as HTMLTextAreaElement;
  if (lineNumbersRef.value) {
    lineNumbersRef.value.scrollTop = target.scrollTop;
  }
};

const updateSelection = () => {
  if (!editorRef.value) return;
  const start = editorRef.value.selectionStart;
  const end = editorRef.value.selectionEnd;
  
  if (start !== end) {
    emit('selectionChange', props.modelValue.substring(start, end));
  } else {
    emit('selectionChange', '');
  }
};
</script>

<template>
  <div class="flex flex-col border-r border-gray-700 min-w-0 h-full">
    <div class="h-8 bg-gray-800 border-b border-gray-700 flex items-center px-3 text-xs text-gray-400 uppercase tracking-wider shrink-0">
      {{ t.editor }}
    </div>
    <div class="flex-1 flex relative overflow-hidden">
      <!-- Line Numbers -->
      <div
        ref="lineNumbersRef"
        class="w-12 bg-gray-900 border-r border-gray-800 text-right pr-2 pt-4 text-gray-600 font-mono text-sm select-none overflow-hidden"
      >
        <div
          v-for="n in lineCount"
          :key="n"
        >
          {{ n }}
        </div>
      </div>
      <!-- Textarea -->
      <textarea 
        ref="editorRef"
        :value="modelValue"
        class="flex-1 bg-gray-900 text-gray-200 p-4 outline-none resize-none font-mono text-sm leading-6"
        spellcheck="false"
        @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        @scroll="handleScroll"
        @select="updateSelection"
        @keyup="updateSelection"
        @mouseup="updateSelection"
      />
    </div>
  </div>
</template>