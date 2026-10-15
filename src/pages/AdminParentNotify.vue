<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'

interface SubscribeItem {
  id: string
  studentId: string
  phone: string
  studentName: string
  className: string
  createdAt: number
}
interface NotifyLogItem {
  id: string
  studentName: string
  content: string
  channel: string
  status: string
  createdAt: number
  sentAt: number | null
}

const router = useRouter()
const { api } = useAuth()
const toast = useToast()

const loading = ref(true)
const subscribes = ref<SubscribeItem[]>([])
const logs = ref<NotifyLogItem[]>([])

const search = ref('')
const notifyStudentId = ref('')
const notifyContent = ref('')
const sending = ref(false)

const filteredSubscribes = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return subscribes.value
  return subscribes.value.filter(s =>
    s.studentName.toLowerCase().includes(q)
    || s.phone.includes(q)
    || s.className.toLowerCase().includes(q)
  )
})

async function load() {
  loading.value = true
  try {
    const res = await api.get<{ subscribes?: SubscribeItem[]; logs?: NotifyLogItem[] }>('/parent-notify/overview')
    subscribes.value = res.data.subscribes || []
    logs.value = res.data.logs || []
  } catch (error) {
    console.error('加载家长通知数据失败:', error)
    toast.error('加载失败')
  } finally {
    loading.value = false
  }
}

function pickStudent(sub: SubscribeItem) {
  notifyStudentId.value = sub.studentId || ''
}

async function sendNotify() {
  if (!notifyStudentId.value || !notifyContent.value.trim()) {
    toast.warning('请选择学生并填写通知内容')
    return
  }
  sending.value = true
  try {
    const res = await api.post<{ message?: string }>('/parent-notify', {
      studentId: notifyStudentId.value,
      content: notifyContent.value.trim(),
    })
    toast.success(res.data.message || '通知已记录')
    notifyContent.value = ''
    await load()
  } catch (error: unknown) {
    const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error
    toast.error(message || '发送失败')
  } finally {
    sending.value = false
  }
}

async function markSent(id: string) {
  try {
    await api.put(`/parent-notify/${id}/sent`)
    toast.success('已标记为已发送')
    await load()
  } catch {
    toast.error('操作失败')
  }
}

onMounted(load)
</script>

<template>
  <AppShell active-page="manage" title="家长通知" eyebrow="PARENT NOTIFY">
    <div class="mx-auto max-w-5xl space-y-4 p-4 lg:p-5">
      <div class="flex flex-col gap-3 rounded-3xl bg-gradient-to-r from-[#ff6a2b] to-[#ff9d4d] p-5 text-white shadow-[0_16px_40px_rgba(255,106,43,0.25)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h1 class="font-serif text-2xl font-bold sm:text-3xl">家长通知</h1>
          <p class="mt-1 text-sm text-white/85">家长在孩子分享页订阅后，可在这里向他们发送表扬通知（发送通道接入后自动发出）</p>
        </div>
        <button type="button" class="inline-flex h-10 shrink-0 items-center gap-1.5 self-start rounded-full bg-white px-4 text-sm font-bold text-[#ff5c00] shadow-sm sm:self-auto" @click="router.push('/admin')">
          <span class="material-symbols-rounded text-[18px] leading-none">dashboard</span>
          返回工作台
        </button>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <!-- 订阅家长 -->
        <section class="rounded-3xl border border-[#f1e5db] bg-white p-5 shadow-[0_10px_30px_rgba(101,71,45,0.05)]">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="font-serif text-lg font-bold text-[#422d20]">订阅家长（{{ subscribes.length }}）</h2>
            <label class="flex h-9 w-full max-w-[220px] items-center gap-2 rounded-xl border border-[#ecdfd4] bg-[#fffdfb] px-3 text-[#a1836d] focus-within:border-orange-300 lg:w-auto">
              <span class="material-symbols-rounded text-[16px] leading-none">search</span>
              <input v-model="search" type="search" class="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="搜索学生/手机号" />
            </label>
          </div>
          <div v-if="loading" class="mt-4 py-10 text-center text-sm text-[#a1836d]">加载中…</div>
          <div v-else-if="!filteredSubscribes.length" class="mt-4 py-10 text-center text-sm text-[#c0a894]">暂无订阅家长</div>
          <div v-else class="mt-4 max-h-[480px] space-y-2 overflow-y-auto">
            <div
              v-for="sub in filteredSubscribes"
              :key="sub.id"
              class="flex items-center justify-between gap-3 rounded-2xl border border-[#f3ece4] bg-[#fffdfb] px-4 py-3"
            >
              <div class="min-w-0">
                <p class="truncate text-sm font-bold text-[#422d20]">{{ sub.studentName }} <span class="font-normal text-[#9a735d]">· {{ sub.className }}</span></p>
                <p class="mt-0.5 font-mono text-sm text-[#9a735d]">{{ sub.phone }}</p>
              </div>
              <button type="button" class="shrink-0 rounded-lg border border-[#f0e5da] px-3 py-1.5 text-sm font-semibold text-[#765f50] transition hover:bg-[#fff7f1]" @click="pickStudent(sub)">选择</button>
            </div>
          </div>
        </section>

        <!-- 发送通知 -->
        <section class="rounded-3xl border border-[#f1e5db] bg-white p-5 shadow-[0_10px_30px_rgba(101,71,45,0.05)]">
          <h2 class="font-serif text-lg font-bold text-[#422d20]">发送通知</h2>
          <p class="mt-1 text-sm text-[#9a735d]">从左侧「选择」一位订阅家长对应的学生，填写表扬内容。</p>
          <div class="mt-4">
            <span class="mb-1.5 block text-sm font-semibold text-[#38281f]">学生 ID</span>
            <input v-model="notifyStudentId" type="text" class="h-11 w-full rounded-xl border border-[#edeff2] px-3.5 font-mono text-sm outline-none focus:border-orange-400" placeholder="点击左侧「选择」自动填入" />
          </div>
          <div class="mt-3">
            <span class="mb-1.5 block text-sm font-semibold text-[#38281f]">通知内容</span>
            <textarea v-model="notifyContent" rows="4" maxlength="200" class="w-full rounded-xl border border-[#edeff2] p-3.5 text-sm outline-none focus:border-orange-400" placeholder="例如：小明今天发言积极，获得 2 分，宠物又长大了！" />
            <p class="mt-1 text-right text-xs text-[#c0a894]">{{ notifyContent.length }}/200</p>
          </div>
          <button
            type="button"
            class="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#ff5c00] text-sm font-bold text-white transition hover:bg-[#e84e00] disabled:opacity-60"
            :disabled="sending"
            @click="sendNotify"
          >
            {{ sending ? '提交中…' : '记录通知' }}
          </button>
          <p class="mt-3 rounded-xl bg-[#fff8f2] px-4 py-3 text-xs leading-5 text-[#a1836d]">
            说明：当前版本会记录通知日志并标记待发送。接入短信或微信公众号模板消息通道后，将按订阅手机号自动送达；也可手动标记「已发送」。
          </p>
        </section>
      </div>

      <!-- 通知日志 -->
      <section class="rounded-3xl border border-[#f1e5db] bg-white p-5 shadow-[0_10px_30px_rgba(101,71,45,0.05)]">
        <h2 class="font-serif text-lg font-bold text-[#422d20]">通知日志（{{ logs.length }}）</h2>
        <div v-if="!logs.length" class="mt-4 py-10 text-center text-sm text-[#c0a894]">暂无通知记录</div>
        <div v-else class="mt-4 space-y-2">
          <div
            v-for="log in logs"
            :key="log.id"
            class="flex flex-col gap-2 rounded-2xl border border-[#f3ece4] bg-[#fffdfb] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="min-w-0">
              <p class="truncate text-sm font-bold text-[#422d20]">{{ log.studentName }}</p>
              <p class="mt-0.5 truncate text-sm text-[#9a735d]">{{ log.content }}</p>
              <p class="mt-1 text-xs text-[#c0a894]">{{ new Date(log.createdAt).toLocaleString('zh-CN', { hour12: false }) }}</p>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="log.status === 'sent' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'">
                {{ log.status === 'sent' ? '已发送' : '待发送' }}
              </span>
              <button v-if="log.status !== 'sent'" type="button" class="rounded-lg border border-[#f0e5da] px-3 py-1.5 text-sm font-semibold text-[#765f50] transition hover:bg-[#fff7f1]" @click="markSent(log.id)">标记已发送</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </AppShell>
</template>
