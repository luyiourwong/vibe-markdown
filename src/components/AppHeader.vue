<script setup lang="ts">
import { computed } from 'vue';
import type { Lang, ViewMode } from '@/types';
import { I18N } from '@/constants/i18n';

const props = defineProps<{
  currentLang: Lang;
  viewMode: ViewMode;
  showChat: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:viewMode', mode: ViewMode): void;
  (e: 'update:showChat', show: boolean): void;
  (e: 'toggleLanguage'): void;
  (e: 'openSettings'): void;
}>();

const t = computed(() => I18N[props.currentLang]);
</script>

<template>
  <header class="h-14 border-b border-gray-700 flex items-center justify-between px-4 bg-gray-800 shrink-0 z-40 relative">
    <div class="flex items-center gap-2">
      <span class="material-icons text-purple-400">edit_note</span>
      <h1 class="font-bold text-lg tracking-wide hidden sm:block">
        {{ t.title }}
      </h1>
    </div>
    
    <!-- View Mode Switcher -->
    <div class="flex bg-gray-900 rounded-lg p-1 border border-gray-700">
      <button 
        :class="['p-1.5 rounded transition-colors', viewMode === 'editor' ? 'bg-gray-700 text-purple-400' : 'text-gray-400 hover:text-gray-200']" 
        :title="t.viewEditor"
        @click="emit('update:viewMode', 'editor')"
      >
        <span class="material-icons text-sm">edit</span>
      </button>
      <button 
        :class="['p-1.5 rounded transition-colors', viewMode === 'split' ? 'bg-gray-700 text-purple-400' : 'text-gray-400 hover:text-gray-200']" 
        :title="t.viewSplit"
        @click="emit('update:viewMode', 'split')"
      >
        <span class="material-icons text-sm">vertical_split</span>
      </button>
      <button 
        :class="['p-1.5 rounded transition-colors', viewMode === 'preview' ? 'bg-gray-700 text-purple-400' : 'text-gray-400 hover:text-gray-200']" 
        :title="t.viewPreview"
        @click="emit('update:viewMode', 'preview')"
      >
        <span class="material-icons text-sm">visibility</span>
      </button>
    </div>

    <div class="flex items-center gap-3">
      <button
        :class="['p-2 rounded-full transition-colors', showChat ? 'text-purple-400 bg-gray-700' : 'text-gray-400 hover:bg-gray-700']"
        :title="t.toggleChat"
        @click="emit('update:showChat', !showChat)"
      >
        <span class="material-icons text-sm">chat</span>
      </button>
      <button
        class="p-2 hover:bg-gray-700 rounded-full transition-colors"
        :title="t.switchLanguage"
        @click="emit('toggleLanguage')"
      >
        <span class="material-icons text-sm">{{ currentLang === 'en' ? 'language' : 'translate' }}</span>
      </button>
      <button
        class="p-2 hover:bg-gray-700 rounded-full transition-colors"
        :title="t.settings"
        @click="emit('openSettings')"
      >
        <span class="material-icons">settings</span>
      </button>
    </div>
  </header>
</template>