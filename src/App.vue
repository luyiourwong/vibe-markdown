<script setup lang="ts">
import { ref, onMounted } from 'vue';
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
    } catch (e) {
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

const handleContentUpdate = (newContent: string) => {
  markdownContent.value = newContent;
  // Clear diff highlights when content is manually updated by user typing
  // Note: This might also be triggered by AI updates, but we want to keep highlights then.
  // However, MarkdownEditor emits update:modelValue on input.
  // We need to distinguish or just clear on manual input.
  // Actually, let's clear diff highlights whenever content changes,
  // UNLESS it was changed by the AI (which we handle in AIChatWindow via a separate event flow or just setting it there).
  // But wait, AIChatWindow emits update:markdownContent.
  // If user types in editor, MarkdownEditor emits update:modelValue.
  // We can watch markdownContent, but that doesn't tell us source.
  
  // Simpler approach: MarkdownEditor emits update:modelValue.
  // We can listen to that specifically to clear highlights.
  // But v-model handles that.
  
  // Let's just clear highlights on manual edit.
  // We can do this by listening to @input on the editor, but v-model hides that.
  // We can add a specific handler for manual updates in MarkdownEditor or just clear here if we can distinguish.
  
  // Actually, the requirement says: "高亮直到被下方更新或用戶更動content"
  // If AI updates content, we set highlights.
  // If User updates content, we clear highlights.
  
  // Since v-model updates markdownContent directly, we can't easily distinguish here without more events.
  // But we can pass a method to MarkdownEditor to clear highlights on input.
  // Or, we can watch markdownContent. If it changes and it wasn't from AI (we can track that), clear.
  
  // Let's try a simpler way:
  // When AI updates, it emits update:markdownContent AND update:diffHighlights.
  // When User updates (via Editor), it emits update:modelValue.
  // We can split v-model on Editor.
};

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
          :model-value="markdownContent"
          :current-lang="currentLang"
          :diff-highlights="diffHighlights"
          @update:model-value="(val) => { markdownContent = val; diffHighlights = []; }"
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
      v-model:show="showSettings"
      :settings="settings"
      :current-lang="currentLang"
      @save="saveSettings"
    />
  </div>
</template>

<style>
/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #111827; 
}
::-webkit-scrollbar-thumb {
  background: #374151; 
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #4b5563; 
}
</style>
