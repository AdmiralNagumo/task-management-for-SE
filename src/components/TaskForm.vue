<script setup>
import { ref, nextTick } from 'vue'
import { PRIORITIES, PRIORITY_LABELS, STATUS_LABELS, STATUSES } from '../utils/constants'
import PriorityBadge from './PriorityBadge.vue'

const props = defineProps({
  initial: { type: Object, required: true },
})

const emit = defineEmits(['save', 'cancel'])

const form = ref({
  title: props.initial.title,
  description: props.initial.description,
  priority: props.initial.priority,
  status: props.initial.status,
})
const error = ref('')

async function submit() {
  const title = form.value.title.trim()
  if (!title) {
    error.value = '标题不能为空'
    return
  }
  emit('save', { ...form.value, title })
}

function cancel() {
  emit('cancel')
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div>
      <label for="task-title" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">标题 *</label>
      <input
        id="task-title"
        v-model="form.title"
        type="text"
        placeholder="任务标题"
        class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-indigo-500/40"
        @keyup.enter="submit"
      />
    </div>

    <div>
      <label for="task-description" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">描述（选填）</label>
      <textarea
        id="task-description"
        v-model="form.description"
        rows="3"
        placeholder="补充说明…"
        class="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-indigo-500/40"
      ></textarea>
    </div>

    <div class="flex gap-3">
      <div class="flex-1">
        <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">优先级</label>
        <div class="flex items-center gap-2">
          <PriorityBadge v-model="form.priority" />
          <span class="text-sm text-gray-500 dark:text-gray-400">
            {{ PRIORITY_LABELS[form.priority] }}优先级
          </span>
        </div>
      </div>
      <div class="flex-1">
        <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">状态</label>
        <select
          v-model="form.status"
          class="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        >
          <option v-for="status in STATUSES" :key="status" :value="status">
            {{ STATUS_LABELS[status] }}
          </option>
        </select>
      </div>
    </div>

    <p v-if="error" class="text-sm text-red-600 dark:text-red-400" role="alert">{{ error }}</p>

    <div class="flex justify-end gap-2">
      <button
        type="button"
        class="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        @click="cancel"
      >
        取消
      </button>
      <button
        type="button"
        class="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500"
        @click="submit"
      >
        保存
      </button>
    </div>
  </div>
</template>