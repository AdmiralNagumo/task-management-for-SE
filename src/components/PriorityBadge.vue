<script setup>
import { computed } from 'vue'
import { PRIORITY_LABELS, PRIORITIES } from '../utils/constants'

const props = defineProps({
  modelValue: { type: String, required: true },
})

const emit = defineEmits(['update:modelValue'])

const styles = {
  high: 'bg-red-100 text-red-800 ring-red-300 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/30',
  medium: 'bg-yellow-100 text-yellow-800 ring-yellow-300 dark:bg-yellow-500/15 dark:text-yellow-300 dark:ring-yellow-500/30',
  low: 'bg-green-100 text-green-800 ring-green-300 dark:bg-green-500/15 dark:text-green-300 dark:ring-green-500/30',
}

// 下拉选项本身也使用对应颜色：高=红、中=黄、低=绿
const optionStyles = {
  high: 'text-red-700 dark:text-red-300',
  medium: 'text-yellow-700 dark:text-yellow-300',
  low: 'text-green-700 dark:text-green-300',
}

const selectClass = computed(
  () =>
    'rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ' + styles[props.modelValue],
)
</script>

<template>
  <select
    :value="modelValue"
    :class="selectClass"
    class="cursor-pointer outline-none transition-colors"
    title="优先级"
    aria-label="优先级"
    @change="emit('update:modelValue', $event.target.value)"
  >
    <option v-for="priority in PRIORITIES" :key="priority" :value="priority" :class="optionStyles[priority]">
      {{ PRIORITY_LABELS[priority] }}
    </option>
  </select>
</template>