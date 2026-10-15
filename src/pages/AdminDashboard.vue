<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'

interface TrendDay {
  date: string
  teachers: number
  classes: number
  students: number
  records: number
  income: number
}
interface ExpiringVip {
  className: string
  plan: string
  planLabel: string
  expiresAt: number
  daysLeft: number
}
interface DashboardData {
  totals: { teachers: number; classes: number; students: number; activeVip: number }
  today: { teachers: number; classes: number; students: number; records: number; income: number }
  income: { total: number; today: number }
  trend: TrendDay[]
  metrics: { activeAuthors: number; vipCoverage: number; expiringCount: number; records7d: number }
  expiringSoon: ExpiringVip[]
}

const router = useRouter()
const { api, username, isAdmin } = useAuth()
const toast = useToast()

const loading = ref(false)
const data = ref<DashboardData | null>(null)

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})
const dateLabel = computed(() => {
  const d = new Date()
  const weeks = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${weeks[d.getDay()]}`
})

async function load() {
  loading.value = true
  try {
    const res = await api.get<DashboardData>('/admin/dashboard')
    data.value = res.data
  } catch (error) {
    console.error('加载工作台数据失败:', error)
    toast.error('加载工作台数据失败')
  } finally {
    loading.value = false
  }
}

// ===== 快捷操作 =====
async function exportBackup() {
  try {
    const res = await api.get('/admin/backup', { responseType: 'blob' })
    const blob = new Blob([res.data], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')
    link.setAttribute('download', `class-pet-garden-backup-${stamp}.json`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    toast.success('数据备份已导出')
  } catch (error) {
    console.error('导出备份失败:', error)
    toast.error('数据备份导出失败')
  }
}

const quickActions = [
  { icon: 'school', label: '管理班级', action: () => router.push('/manage') },
  { icon: 'manage_accounts', label: '管理用户', action: () => router.push({ path: '/manage', query: { tab: 'members' } }) },
  { icon: 'verified', label: '会员授权', action: () => router.push({ path: '/manage', query: { tab: 'members' } }) },
  { icon: 'restaurant', label: '收款设置', action: () => router.push({ path: '/manage', query: { tab: 'payment' } }) },
  { icon: 'save', label: '数据备份', action: exportBackup },
  { icon: 'menu_book', label: '操作说明', action: () => window.open(router.resolve('/guide').href, '_blank', 'noopener,noreferrer') },
]

// ===== 趋势图（纯 SVG：柱状=每日评价，折线=每日新增教师） =====
const chartW = 720
const chartH = 220
const chartPad = { top: 16, right: 12, bottom: 26, left: 12 }
const trend = computed(() => data.value?.trend || [])
const maxRecords = computed(() => Math.max(1, ...trend.value.map(d => d.records)))
const maxTeachers = computed(() => Math.max(1, ...trend.value.map(d => d.teachers)))

const bars = computed(() => {
  const innerW = chartW - chartPad.left - chartPad.right
  const innerH = chartH - chartPad.top - chartPad.bottom
  const slot = innerW / Math.max(1, trend.value.length)
  const barW = Math.min(36, slot * 0.42)
  return trend.value.map((d, i) => {
    const h = (d.records / maxRecords.value) * (innerH - 8)
    return {
      x: chartPad.left + i * slot + (slot - barW) / 2,
      y: chartH - chartPad.bottom - h,
      w: barW,
      h: Math.max(2, h),
      label: d.date,
      count: d.records,
      cx: chartPad.left + i * slot + slot / 2,
    }
  })
})
const linePoints = computed(() => {
  const innerH = chartH - chartPad.top - chartPad.bottom
  return bars.value.map(b => {
    const d = trend.value[bars.value.indexOf(b)]
    const y = chartH - chartPad.bottom - (d ? (d.teachers / maxTeachers.value) * (innerH - 8) : 0)
    return `${b.cx},${Math.max(chartPad.top, y)}`
  }).join(' ')
})

onMounted(() => {
  if (!isAdmin.value) return
  void load()
})
</script>

<template>
  <AppShell active-page="admin-home" title="管理工作台" eyebrow="ADMIN CONSOLE">
    <div class="mx-auto max-w-[1400px] space-y-4 p-4 lg:p-5">
      <!-- 顶部横幅 -->
      <section class="flex flex-col gap-3 rounded-3xl bg-gradient-to-r from-[#ff6a2b] to-[#ff9d4d] p-5 text-white shadow-[0_16px_40px_rgba(255,106,43,0.25)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h1 class="font-serif text-2xl font-bold sm:text-3xl">{{ greeting }}，{{ username }} 🐾</h1>
          <p class="mt-1 text-sm text-white/85">{{ dateLabel }}</p>
        </div>
        <button
          type="button"
          class="inline-flex h-11 shrink-0 items-center gap-1.5 self-start rounded-full bg-white px-5 text-sm font-bold text-[#ff5c00] shadow-sm transition hover:bg-[#fff3ec] disabled:opacity-60 sm:self-auto"
          :disabled="loading"
          @click="load"
        >
          <span class="material-symbols-rounded text-[18px] leading-none">refresh</span>
          {{ loading ? '刷新中…' : '刷新数据' }}
        </button>
      </section>

      <!-- 概览统计卡 -->
      <section class="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <article class="rounded-3xl border border-[#f1e5db] bg-white p-4 shadow-[0_10px_30px_rgba(101,71,45,0.05)] xl:p-5">
          <div class="flex items-center gap-2">
            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff1e6] text-[#d97706]"><span class="material-symbols-rounded text-[18px]">person</span></span>
            <p class="text-sm font-bold text-[#806b5b]">教师用户</p>
          </div>
          <p class="mt-3 font-mono text-3xl font-extrabold text-[#d97706]">{{ data?.totals.teachers ?? '—' }}</p>
          <p class="mt-1 text-xs leading-5 text-[#a1836d]">今日新增：{{ data?.today.teachers ?? 0 }}</p>
        </article>
        <article class="rounded-3xl border border-[#f1e5db] bg-white p-4 shadow-[0_10px_30px_rgba(101,71,45,0.05)] xl:p-5">
          <div class="flex items-center gap-2">
            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff1e6] text-[#b76129]"><span class="material-symbols-rounded text-[18px]">school</span></span>
            <p class="text-sm font-bold text-[#806b5b]">班级总数</p>
          </div>
          <p class="mt-3 font-mono text-3xl font-extrabold text-[#b76129]">{{ data?.totals.classes ?? '—' }}</p>
          <p class="mt-1 text-xs leading-5 text-[#a1836d]">今日新增：{{ data?.today.classes ?? 0 }}</p>
        </article>
        <article class="rounded-3xl border border-[#f1e5db] bg-white p-4 shadow-[0_10px_30px_rgba(101,71,45,0.05)] xl:p-5">
          <div class="flex items-center gap-2">
            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff1e6] text-[#ea580c]"><span class="material-symbols-rounded text-[18px]">pets</span></span>
            <p class="text-sm font-bold text-[#806b5b]">学生总数</p>
          </div>
          <p class="mt-3 font-mono text-3xl font-extrabold text-[#ea580c]">{{ data?.totals.students ?? '—' }}</p>
          <p class="mt-1 text-xs leading-5 text-[#a1836d]">今日新增：{{ data?.today.students ?? 0 }}</p>
        </article>
        <article class="rounded-3xl border border-[#f1e5db] bg-white p-4 shadow-[0_10px_30px_rgba(101,71,45,0.05)] xl:p-5">
          <div class="flex items-center gap-2">
            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff1e6] text-[#f59e0b]"><span class="material-symbols-rounded text-[18px]">workspace_premium</span></span>
            <p class="text-sm font-bold text-[#806b5b]">有效会员授权</p>
          </div>
          <p class="mt-3 font-mono text-3xl font-extrabold text-[#f59e0b]">{{ data?.totals.activeVip ?? '—' }}</p>
          <p class="mt-1 text-xs leading-5 text-[#a1836d]">覆盖率：{{ data?.metrics.vipCoverage ?? 0 }}%</p>
        </article>
      </section>

      <!-- 趋势 + 运营指标 -->
      <section class="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div class="rounded-3xl border border-[#f1e5db] bg-white p-5 shadow-[0_10px_30px_rgba(101,71,45,0.05)]">
          <div class="flex items-center justify-between">
            <h2 class="font-serif text-lg font-bold text-[#422d20]">近 7 天趋势</h2>
            <div class="flex items-center gap-4 text-xs text-[#a1836d]">
              <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded bg-[#ff9d4d]"></span>每日评价</span>
              <span class="flex items-center gap-1.5"><span class="h-0.5 w-4 rounded bg-[#d97706]"></span>新增教师</span>
            </div>
          </div>
          <svg :viewBox="`0 0 ${chartW} ${chartH}`" class="mt-4 w-full" role="img" aria-label="近7天趋势图">
            <template v-if="trend.length">
              <rect
                v-for="(b, i) in bars"
                :key="'bar-' + i"
                :x="b.x"
                :y="b.y"
                :width="b.w"
                :height="b.h"
                rx="6"
                class="fill-[#ffce9e]"
              />
              <polyline
                :points="linePoints"
                fill="none"
                stroke="#d97706"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle v-for="(b, i) in bars" :key="'dot-' + i" :cx="b.cx" :cy="chartH - chartPad.bottom - (trend[i] ? (trend[i].teachers / maxTeachers) * (chartH - chartPad.top - chartPad.bottom - 8) : 0)" r="4" class="fill-[#d97706]" />
              <text v-for="(b, i) in bars" :key="'lbl-' + i" :x="b.cx" :y="chartH - 8" text-anchor="middle" class="fill-[#b59a86]" font-size="12">{{ b.label }}</text>
            </template>
          </svg>
        </div>

        <div class="rounded-3xl border border-[#f1e5db] bg-white p-5 shadow-[0_10px_30px_rgba(101,71,45,0.05)]">
          <h2 class="font-serif text-lg font-bold text-[#422d20]">运营指标</h2>
          <div class="mt-4 grid grid-cols-2 gap-3">
            <div class="rounded-2xl bg-[#fffaf5] p-4">
              <p class="font-mono text-2xl font-extrabold text-[#d97706]">{{ data?.metrics.activeAuthors ?? '—' }}</p>
              <p class="mt-1 text-xs leading-5 text-[#a1836d]">7 日活跃教师</p>
            </div>
            <div class="rounded-2xl bg-[#fffaf5] p-4">
              <p class="font-mono text-2xl font-extrabold text-[#b76129]">¥{{ data?.income.total ?? 0 }}</p>
              <p class="mt-1 text-xs leading-5 text-[#a1836d]">会员累计收入（估）</p>
            </div>
            <div class="rounded-2xl bg-[#fffaf5] p-4">
              <p class="font-mono text-2xl font-extrabold text-[#ea580c]">{{ data?.metrics.records7d ?? '—' }}</p>
              <p class="mt-1 text-xs leading-5 text-[#a1836d]">7 日评价次数</p>
            </div>
            <div class="rounded-2xl bg-[#fffaf5] p-4">
              <p class="font-mono text-2xl font-extrabold text-[#f59e0b]">{{ data?.metrics.vipCoverage ?? 0 }}%</p>
              <p class="mt-1 text-xs leading-5 text-[#a1836d]">会员覆盖率</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 快捷操作 -->
      <section class="rounded-3xl border border-[#f1e5db] bg-white p-5 shadow-[0_10px_30px_rgba(101,71,45,0.05)]">
        <h2 class="font-serif text-lg font-bold text-[#422d20]">快捷操作</h2>
        <div class="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
          <button
            v-for="action in quickActions"
            :key="action.label"
            type="button"
            class="flex flex-col items-center gap-2 rounded-2xl border border-[#f3ece4] bg-[#fffdfb] px-2 py-4 text-sm font-semibold text-[#5a4636] transition hover:border-[#ffd9bd] hover:bg-[#fff7f1] hover:text-[#b85e25]"
            @click="action.action"
          >
            <span class="material-symbols-rounded text-[22px] text-[#d97706]">{{ action.icon }}</span>
            {{ action.label }}
          </button>
        </div>
      </section>

      <!-- 待办 / 预警 -->
      <section class="rounded-3xl border border-[#f1e5db] bg-white p-5 shadow-[0_10px_30px_rgba(101,71,45,0.05)]">
        <div class="flex items-center justify-between">
          <h2 class="font-serif text-lg font-bold text-[#422d20]">待办 / 预警</h2>
          <span
            class="rounded-full px-2.5 py-1 text-xs font-bold"
            :class="(data?.metrics.expiringCount ?? 0) > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'"
          >
            {{ (data?.metrics.expiringCount ?? 0) > 0 ? `${data?.metrics.expiringCount} 项` : '正常' }}
          </span>
        </div>
        <div v-if="data?.expiringSoon.length" class="mt-4 space-y-2">
          <div
            v-for="item in data.expiringSoon"
            :key="item.className + item.plan"
            class="flex items-center justify-between gap-3 rounded-2xl border border-[#f3ece4] bg-[#fffdfb] px-4 py-3"
          >
            <div class="flex min-w-0 items-center gap-3">
              <span class="material-symbols-rounded text-[20px] text-[#f59e0b]">workspace_premium</span>
              <div class="min-w-0">
                <p class="truncate text-sm font-bold text-[#422d20]">{{ item.className }}</p>
                <p class="text-xs text-[#a1836d]">{{ item.planLabel }} · {{ new Date(item.expiresAt).toLocaleDateString() }} 到期</p>
              </div>
            </div>
            <span class="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600">
              {{ item.daysLeft <= 0 ? '今日到期' : `剩 ${item.daysLeft} 天` }}
            </span>
          </div>
        </div>
        <p v-else class="mt-4 rounded-2xl bg-[#f6fff8] px-4 py-3 text-sm text-[#6b8f7d]">
          一切正常：7 天内没有即将到期的会员授权。
        </p>
      </section>
    </div>
  </AppShell>
</template>
