<script setup lang="ts">
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import { useAnalytics } from '@/composables/useAnalytics'

const router = useRouter()
useAnalytics()

interface PlanCard {
  id: string
  name: string
  price: string
  unit: string
  desc: string
  badge?: string
  highlight?: boolean
}

const plans: PlanCard[] = [
  { id: 'monthly', name: '月会员', price: '¥18', unit: '/ 月', desc: '按月灵活订阅，适合短期试用或先体验后续费' },
  { id: 'term', name: '学期会员', price: '¥68', unit: '/ 学期', desc: '适合单个学期使用，覆盖一学年上下学期', badge: '多数老师的选择', highlight: true },
  { id: 'year', name: '年度会员', price: '¥128', unit: '/ 年', desc: '全年无忧，性价比更高', badge: '最划算' },
]

const benefits = [
  { icon: 'pets', title: '专属宠物进化', desc: '解锁班级限定宠物与完整成长形态、外观特效' },
  { icon: 'trending_up', title: '高级排行榜', desc: '多维榜单与学期成长报告，激励全班共同进步' },
  { icon: 'assignment', title: '班级任务增强', desc: '任务模板库与批量完成统计，课堂管理更省心' },
  { icon: 'save', title: '数据导出', desc: '评价记录、积分报表一键导出，学期总结轻松写' },
  { icon: 'volunteer_activism', title: '家长见证成长', desc: '家长扫码实时查看孩子宠物成长与喂养记录' },
  { icon: 'workspace_premium', title: '优先支持', desc: '会员专属客服通道，问题优先响应' },
]

const compareRows = [
  { name: '创建班级与导入学生', free: true, vip: true },
  { name: '成长宠物与积分体系', free: '基础宠物', vip: '全部宠物 + 进化' },
  { name: '家长实时成长相册', free: true, vip: true },
  { name: '基础评价与规则', free: true, vip: true },
  { name: '高级排行榜与成长报告', free: false, vip: true },
  { name: '任务模板与批量统计', free: false, vip: true },
  { name: '数据导出（评价 / 积分）', free: false, vip: true },
  { name: '专属外观与成长特效', free: false, vip: true },
  { name: '会员专属客服通道', free: false, vip: true },
]

const steps = [
  { no: '1', title: '创建班级', desc: '注册后创建班级并导入学生名单，新班级自动赠送 1 个月灵犀计划' },
  { no: '2', title: '选择方案', desc: '进入工作台「灵犀计划」，按需选择月 / 学期 / 年度方案' },
  { no: '3', title: '扫码支付', desc: '选中要开通的班级，微信扫码支付，备注班级名称与所选方案' },
  { no: '4', title: '授权生效', desc: '后台核实到账后为班级开通，全部会员权益立即生效' },
]

const planFaqs = [
  { q: '会员版和免费版有什么区别？', a: '基础版永久免费，满足日常课堂激励；灵犀计划解锁全部宠物进化、高级排行榜、任务增强、数据导出等完整能力。' },
  { q: '可以先试用吗？', a: '可以。新注册用户创建的首个班级自动赠送 1 个月灵犀计划，满意后再按需订阅。' },
  { q: '多个班级怎么开通？', a: '灵犀计划按班级独立开通，互不影响。若您管理多个班级，可为每个班级分别订阅。' },
  { q: '怎么开通与续费？', a: '在会员页选择方案并选中班级，扫码支付后由后台授权激活；到期后可随时续费，成长数据不丢失。' },
]

const loggedIn = computed(() => Boolean(localStorage.getItem('token')))

function goVip() {
  window.open(router.resolve(loggedIn.value ? '/vip' : '/login').href, '_blank', 'noopener,noreferrer')
}
function goStart() {
  window.open(router.resolve(loggedIn.value ? '/app' : '/register').href, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <div class="min-h-screen bg-[#fdfaf6]">
    <!-- 顶栏 -->
    <header class="sticky top-0 z-40 border-b border-[#f0e6dc] bg-white/90 backdrop-blur">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <router-link to="/" class="inline-flex items-center gap-1 text-sm font-semibold text-[#765f50] transition hover:text-[#d97706]">
          <span class="material-symbols-rounded text-[20px]">chevron_left</span>
          返回首页
        </router-link>
        <div class="flex items-center gap-4">
          <router-link to="/guide" target="_blank" rel="noopener noreferrer" class="hidden text-sm font-medium text-[#765f50] transition hover:text-[#d97706] sm:block">
            操作说明
          </router-link>
          <button type="button" class="inline-flex h-9 items-center rounded-full bg-[#ff5c00] px-4 text-sm font-bold text-white transition hover:bg-[#e84e00]" @click="goStart">
            免费试用
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-12">
      <!-- 头部 + 方案 -->
      <section class="rounded-3xl border border-[#f0e6dc] bg-white p-8 shadow-sm md:p-10">
        <p class="text-sm font-bold tracking-[0.2em] text-[#d78248]">SUBSCRIBE</p>
        <h1 class="mt-2 font-serif text-4xl font-bold text-[#2b1d12]">开通灵犀计划</h1>
        <p class="mt-3 max-w-2xl text-[#6b5544]">
          按班级独立开通，多班并行，互不影响。开通后该班级即可使用全部高级功能；新班级注册即赠 1 个月，满意再续费。
        </p>

        <h2 class="mt-8 text-sm font-bold text-[#9a735d]">1. 选择方案</h2>
        <div class="mt-4 grid gap-4 md:grid-cols-3">
          <article
            v-for="p in plans"
            :key="p.id"
            :class="['relative rounded-2xl border p-6 transition', p.highlight ? 'border-[#ff5c00] bg-gradient-to-b from-[#fff7ef] to-white shadow-lg ring-2 ring-[#ffd9bd]' : 'border-[#f0e6dc] bg-white shadow-sm hover:border-[#ffd9bd]']"
          >
            <span v-if="p.badge" :class="['absolute -top-2.5 right-4 rounded-full px-2.5 py-0.5 text-xs font-bold text-white', p.highlight ? 'bg-[#ff5c00]' : 'bg-[#d97706]']">
              {{ p.badge }}
            </span>
            <h3 class="text-base font-bold text-[#422d20]">{{ p.name }}</h3>
            <div class="mt-3 flex items-end gap-1">
              <span class="font-serif text-4xl font-bold text-[#d97706]">{{ p.price }}</span>
              <span class="mb-1 text-sm text-[#9a735d]">{{ p.unit }}</span>
            </div>
            <p class="mt-3 text-sm leading-6 text-[#6b5544]">{{ p.desc }}</p>
            <button
              type="button"
              :class="['mt-5 inline-flex h-11 w-full items-center justify-center rounded-full text-sm font-bold transition', p.highlight ? 'bg-[#ff5c00] text-white hover:bg-[#e84e00]' : 'border border-[#e7d8c8] text-[#b85e25] hover:border-[#d97706]']"
              @click="goVip"
            >
              选择{{ p.name.replace('会员', '') }}方案
            </button>
          </article>
        </div>

        <div class="mt-6 rounded-2xl bg-[#fff7ed] px-5 py-4 text-sm text-[#9a5a2b]">
          <span class="material-symbols-rounded mr-1 align-middle text-[18px] text-[#f59e0b]">emoji_events</span>
          新用户福利：注册后创建的首个班级，自动开通 1 个月灵犀计划，无需支付。
        </div>
      </section>

      <!-- 会员权益 -->
      <section class="mt-8 rounded-3xl border border-[#f0e6dc] bg-white p-8 shadow-sm md:p-10">
        <p class="text-sm font-bold tracking-[0.2em] text-[#d78248]">VIP BENEFITS</p>
        <h2 class="mt-2 font-serif text-2xl font-bold text-[#422d20]">会员权益</h2>
        <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="b in benefits" :key="b.title" class="rounded-2xl border border-[#f3ece4] bg-[#fffdfb] p-5">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff3eb]">
              <span class="material-symbols-rounded text-[22px] text-[#ea580c]">{{ b.icon }}</span>
            </div>
            <p class="mt-3 font-bold text-[#422d20]">{{ b.title }}</p>
            <p class="mt-1 text-sm leading-6 text-[#6b5544]">{{ b.desc }}</p>
          </div>
        </div>
      </section>

      <!-- 免费版 vs 会员版对比 -->
      <section class="mt-8 overflow-hidden rounded-3xl border border-[#f0e6dc] bg-white shadow-sm">
        <div class="p-8 pb-0 md:p-10 md:pb-0">
          <p class="text-sm font-bold tracking-[0.2em] text-[#d78248]">COMPARE</p>
          <h2 class="mt-2 font-serif text-2xl font-bold text-[#422d20]">免费版 vs 灵犀计划</h2>
        </div>
        <div class="mt-6 overflow-x-auto p-8 pt-0 md:p-10 md:pt-0">
          <table class="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr class="text-xs text-[#9a735d]">
                <th class="py-3 font-semibold">功能</th>
                <th class="w-28 py-3 text-center font-semibold">免费版</th>
                <th class="w-32 py-3 text-center font-semibold text-[#d97706]">灵犀计划</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in compareRows" :key="row.name" class="border-t border-[#f8f1ea]">
                <td class="py-3 font-medium text-[#422d20]">{{ row.name }}</td>
                <td class="py-3 text-center">
                  <span v-if="row.free === true" class="material-symbols-rounded text-[18px] text-[#059669]">check</span>
                  <span v-else-if="row.free === false" class="text-[#c8b6a5]">—</span>
                  <span v-else class="text-[#765f50]">{{ row.free }}</span>
                </td>
                <td class="py-3 text-center font-semibold text-[#b85e25]">
                  <span v-if="row.vip === true" class="material-symbols-rounded text-[18px] text-[#059669]">check</span>
                  <span v-else>{{ row.vip }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 开通流程 -->
      <section class="mt-8 rounded-3xl border border-[#f0e6dc] bg-white p-8 shadow-sm md:p-10">
        <p class="text-sm font-bold tracking-[0.2em] text-[#d78248]">HOW TO BUY</p>
        <h2 class="mt-2 font-serif text-2xl font-bold text-[#422d20]">开通流程</h2>
        <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="s in steps" :key="s.no" class="rounded-2xl bg-[#fff8f2] p-5">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff5c00] text-sm font-bold text-white">{{ s.no }}</div>
            <p class="mt-3 font-bold text-[#422d20]">{{ s.title }}</p>
            <p class="mt-1 text-sm leading-6 text-[#6b5544]">{{ s.desc }}</p>
          </div>
        </div>
      </section>

      <!-- 常见问题 -->
      <section class="mt-8 rounded-3xl border border-[#f0e6dc] bg-white p-8 shadow-sm md:p-10">
        <p class="text-sm font-bold tracking-[0.2em] text-[#d78248]">FAQ</p>
        <h2 class="mt-2 font-serif text-2xl font-bold text-[#422d20]">订阅相关疑问</h2>
        <div class="mt-6 space-y-3">
          <details v-for="(f, i) in planFaqs" :key="i" class="group rounded-2xl border border-[#f0e6dc] bg-[#fffdfb] p-5 [&_summary]:cursor-pointer">
            <summary class="flex items-center justify-between font-semibold text-[#422d20]">
              <span>{{ f.q }}</span>
              <span class="material-symbols-rounded shrink-0 text-[#d97706] transition group-open:rotate-180">expand_more</span>
            </summary>
            <p class="mt-3 text-sm leading-relaxed text-[#6b5544]">{{ f.a }}</p>
          </details>
        </div>
      </section>

      <!-- 底部 CTA -->
      <section class="mt-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#ff7a18] to-[#ff5c00] p-8 text-white shadow-lg md:p-12">
        <div class="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 class="font-serif text-3xl font-bold">准备好让班级动起来了吗？</h2>
            <p class="mt-2 opacity-90">免费创建班级即可开始，新班级自动赠送 1 个月灵犀计划。</p>
          </div>
          <div class="flex flex-wrap gap-3">
            <button type="button" class="inline-flex h-12 items-center rounded-full bg-white px-7 text-base font-bold text-[#ff5c00] transition hover:bg-[#fff3eb]" @click="goStart">
              免费开始使用
            </button>
            <button type="button" class="inline-flex h-12 items-center gap-1.5 rounded-full border border-white/60 px-7 text-base font-bold text-white transition hover:bg-white/10" @click="goVip">
              进入工作台开通
              <span class="material-symbols-rounded text-[20px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </section>
    </main>

    <footer class="border-t border-[#f0e6dc] py-8 text-center text-sm text-[#9a735d]">
      🐾 班级宠物园 · 游戏化课堂激励工具
    </footer>
  </div>
</template>
