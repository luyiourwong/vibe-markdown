<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Settings, Lang } from '@/types';
import { I18N } from '@/constants/i18n';

const show = defineModel<boolean>()
const { settings, currentLang } = defineProps<{
  settings: Settings;
  currentLang: Lang;
}>();

const emit = defineEmits<{
  save: [settings: Settings]
}>();

const t = computed(() => I18N[currentLang]);
const localSettings = ref<Settings>({ ...settings });

watch(() => settings, (newSettings) => {
  localSettings.value = { ...newSettings };
}, { deep: true });

const save = () => {
  emit('save', localSettings.value);
};
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] backdrop-blur-sm"
  >
    <div class="bg-gray-800 border border-gray-700 rounded-xl w-96 shadow-2xl p-6">
      <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
        <span class="material-icons text-gray-400">settings</span> {{ t.settingsTitle }}
      </h2>

      <div class="space-y-4">
        <div>
          <label class="block text-xs text-gray-400 mb-1">{{ t.apiUrl }}</label>
          <input
            v-model="localSettings.apiUrl"
            type="text"
            class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white focus:border-purple-500 outline-none"
          >
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">{{ t.apiKey }}</label>
          <input
            v-model="localSettings.apiKey"
            type="password"
            class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white focus:border-purple-500 outline-none"
            placeholder="sk-..."
          >
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">{{ t.model }}</label>
          <input
            v-model="localSettings.model"
            type="text"
            class="w-full bg-gray-900 border border-gray-700 rounded p-2 text-sm text-white focus:border-purple-500 outline-none"
          >
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-6">
        <button
          class="px-4 py-2 rounded text-sm text-gray-300 hover:bg-gray-700 transition-colors"
          @click="show = false"
        >
          {{ t.cancel }}
        </button>
        <button
          class="px-4 py-2 rounded text-sm bg-purple-600 text-white hover:bg-purple-500 transition-colors"
          @click="save"
        >
          {{ t.save }}
        </button>
      </div>
    </div>
  </div>
</template>