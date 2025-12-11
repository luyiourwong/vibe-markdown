<script setup lang="ts">
import { computed } from 'vue';
import MarkdownIt from 'markdown-it';
import type { Lang } from '@/types';
import { I18N } from '@/constants/i18n';
import DOMPurify from 'dompurify';

const { content, currentLang } = defineProps<{
  content: string;
  currentLang: Lang;
}>();

const t = computed(() => I18N[currentLang]);
const md = new MarkdownIt();
const renderedMarkdown = computed(() => {
  const raw = md.render(content);
  return DOMPurify.sanitize(raw);
});
</script>

<template>
  <div class="flex flex-col min-w-0 bg-gray-900 h-full">
    <div class="h-8 bg-gray-800 border-b border-gray-700 flex items-center px-3 text-xs text-gray-400 uppercase tracking-wider shrink-0">
      {{ t.preview }}
    </div>
    <!-- eslint-disable vue/no-v-html -- Content is sanitized with DOMPurify -->
    <div
      class="flex-1 overflow-auto p-8 prose prose-invert max-w-none prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-700"
      v-html="renderedMarkdown"
    />
    <!-- eslint-enable vue/no-v-html -->
  </div>
</template>