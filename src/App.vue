<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { Settings, Lang, ViewMode, HighlightRange } from '@/types';
import AppHeader from '@/components/AppHeader.vue';
import MarkdownEditor from '@/components/MarkdownEditor.vue';
import MarkdownPreview from '@/components/MarkdownPreview.vue';
import AIChatWindow from '@/components/AIChatWindow.vue';
import SettingsModal from '@/components/SettingsModal.vue';

// --- Constants ---
const DEFAULT_SETTINGS: Settings = {
  apiUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4.1-nano-2025-04-14',  // free tier
};

// --- State ---
const markdownContent = ref<string>(`# Welcome to VibeMarkdown

Select this paragraph and ask the AI to rewrite it to be more exciting.

## Features
- **Split View**: Edit and preview side-by-side.
- **AI Collaboration**: Chat with AI to brainstorm.
- **Live Editing**: Ask the AI to "Fix the spelling" or "Add a conclusion".
- **Contextual Context**: Highlight text to ask specific questions about it.

## Try it out
1. Highlight the code block below.
2. Ask "What does this code do?"

\`\`\`javascript
function helloWorld() {
  console.log("Hello Vibe!");
}
\`\`\`
`);

const settings = ref<Settings>({ ...DEFAULT_SETTINGS });
const showSettings = ref(false);
const currentLang = ref<Lang>('en');
const viewMode = ref<ViewMode>('split');
const showChat = ref(true);
const selectedText = ref('');
const diffHighlights = ref<HighlightRange[]>([]);

// --- Methods ---

// Language Toggle
const toggleLanguage = () => {
  currentLang.value = currentLang.value === 'en' ? 'zh' : 'en';
};

// Settings Persistence
const loadSettings = () => {
  const saved = localStorage.getItem('vibe-settings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as Settings;
      settings.value = { ...DEFAULT_SETTINGS, ...parsed };
    }
    catch (e) {
      console.error('Failed to load settings', e);
    }
  }
};

const saveSettings = (newSettings: Settings) => {
  settings.value = newSettings;
  localStorage.setItem('vibe-settings', JSON.stringify(settings.value));
  showSettings.value = false;
};

const handleSelectionChange = (text: string) => {
  selectedText.value = text;
};

// 監聽內容變更，同步清空高亮
// 使用 flush: 'sync' 是為了確保在 AI 連續更新 content 和 highlights 時，
// 清空動作發生在設定新 highlights 之前。
watch(markdownContent, () => {
  diffHighlights.value = [];
}, { flush: 'sync' });

// Lifecycle
onMounted(() => {
  loadSettings();
});
</script>

<template>
  <div class="h-screen w-screen bg-gray-900 text-gray-100 flex flex-col overflow-hidden font-sans">
    <AppHeader
      v-model:view-mode="viewMode"
      v-model:show-chat="showChat"
      :current-lang="currentLang"
      @toggle-language="toggleLanguage"
      @open-settings="showSettings = true"
    />

    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden relative">
      <!-- Editor Pane -->
      <div
        v-show="viewMode !== 'preview'"
        :class="viewMode === 'split' ? 'w-1/2' : 'w-full'"
      >
        <MarkdownEditor
          v-model="markdownContent"
          :current-lang="currentLang"
          :diff-highlights="diffHighlights"
          @selection-change="handleSelectionChange"
        />
      </div>

      <!-- Preview Pane -->
      <div
        v-show="viewMode !== 'editor'"
        :class="viewMode === 'split' ? 'w-1/2' : 'w-full'"
      >
        <MarkdownPreview
          :content="markdownContent"
          :current-lang="currentLang"
        />
      </div>

      <!-- Floating AI Chat Window -->
      <AIChatWindow
        v-model:show="showChat"
        v-model:selected-text="selectedText"
        v-model:markdown-content="markdownContent"
        v-model:diff-highlights="diffHighlights"
        :current-lang="currentLang"
        :settings="settings"
        @open-settings="showSettings = true"
      />
    </div>

    <!-- Settings Modal -->
    <SettingsModal
      v-model="showSettings"
      :settings="settings"
      :current-lang="currentLang"
      @save="saveSettings"
    />
  </div>
</template>