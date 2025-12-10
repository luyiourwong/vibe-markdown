<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Lang, HighlightRange } from '@/types';
import { I18N } from '@/constants/i18n';

const props = defineProps<{
  modelValue: string;
  currentLang: Lang;
  diffHighlights?: HighlightRange[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'selectionChange', text: string): void;
}>();

const t = computed(() => I18N[props.currentLang]);
const editorRef = ref<HTMLTextAreaElement | null>(null);
const lineNumbersRef = ref<HTMLDivElement | null>(null);
const backdropRef = ref<HTMLDivElement | null>(null);
const selectionRange = ref<HighlightRange | null>(null);

const lineCount = computed(() => {
  return props.modelValue.split('\n').length;
});

const handleScroll = (e: Event) => {
  const target = e.target as HTMLTextAreaElement;
  if (lineNumbersRef.value) {
    lineNumbersRef.value.scrollTop = target.scrollTop;
  }
  if (backdropRef.value) {
    backdropRef.value.scrollTop = target.scrollTop;
  }
};

const updateSelection = () => {
  if (!editorRef.value) return;
  const start = editorRef.value.selectionStart;
  const end = editorRef.value.selectionEnd;
  
  selectionRange.value = { start, end };
  
  if (start !== end) {
    emit('selectionChange', props.modelValue.substring(start, end));
  } else {
    emit('selectionChange', '');
  }
};

const escapeHtml = (text: string) => {
  return text
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, "\"")
    .replace(/'/g, "&#039;");
};

const backdropHtml = computed(() => {
  const text = props.modelValue;
  const lines = text.split('\n');
  const diffs = props.diffHighlights ?? [];
  const sel = selectionRange.value;
  
  let currentPos = 0;
  let html = '';
  
  lines.forEach((line, index) => {
    const len = line.length;
    const start = currentPos;
    const isLast = index === lines.length - 1;
    const end = start + len + (isLast ? 0 : 1);
    
    let isDiff = false;
    if (diffs.length > 0) {
       isDiff = diffs.some(h => {
         if (h.start === h.end) {
            if (isLast) return h.start >= start && h.start <= end;
            return h.start >= start && h.start < end;
         }
         return Math.max(start, h.start) < Math.min(end, h.end);
       });
    }
    
    let isSelected = false;
    if (sel) {
      if (sel.start === sel.end) {
        // Caret
        if (isLast) {
           isSelected = sel.start >= start && sel.start <= end;
        } else {
           isSelected = sel.start >= start && sel.start < end;
        }
      } else {
        // Range
        isSelected = Math.max(start, sel.start) < Math.min(end, sel.end);
      }
    }
    
    const classes = ['px-4', 'whitespace-pre-wrap', 'break-words'];
    if (isDiff) classes.push('bg-green-500/20');
    if (isSelected) classes.push('bg-blue-500/40');
    
    const content = escapeHtml(line) || '<br>';
    html += `<div class="${classes.join(' ')}">${content}</div>`;
    
    currentPos = end;
  });
  
  return html;
});
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
        class="w-12 bg-gray-900 border-r border-gray-800 text-right pr-2 text-gray-600 font-mono text-sm select-none overflow-hidden"
      >
        <div
          v-for="n in lineCount"
          :key="n"
          class="h-6 flex items-center"
        >
          {{ n }}
        </div>
      </div>
      <!-- Editor Container -->
      <div class="flex-1 relative">
        <!-- Backdrop for Highlights -->
        <div
          ref="backdropRef"
          class="absolute inset-0 font-mono text-sm leading-6 pointer-events-none text-transparent bg-gray-900 overflow-hidden"
          v-html="backdropHtml"
        />

        <!-- Textarea -->
        <textarea
          ref="editorRef"
          :value="modelValue"
          class="absolute inset-0 w-full h-full bg-transparent text-gray-200 outline-none resize-none font-mono text-sm leading-6"
          style="caret-color: white;"
          spellcheck="false"
          @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
          @scroll="handleScroll"
          @select="updateSelection"
          @keyup="updateSelection"
          @mouseup="updateSelection"
        />
      </div>
    </div>
  </div>
</template>