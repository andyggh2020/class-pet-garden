<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// ===== 可配置信息（上线前替换为真实内容） =====
const brandName = '班级宠物园'
// 备案号：默认占位，管理员在后台「收款设置 → ICP 备案号」填写后自动同步
const beianNo = ref('京ICP备XXXXXXXX号-X')
const serviceTime = '每日 9:00 - 21:00'
// 第三方统计代码（百度统计/微信统计/友盟等）。留空则不注入。
// 例如百度统计：
//   "var _hmt=_hmt||[];(function(){var hm=document.createElement('script');hm.src='https://hm.baidu.com/hm.js?你的ID';var s=document.getElementsByTagName('script')[0];s.parentNode.insertBefore(hm,s);})();"
const analyticsScript: string = ''

// 客服信息：默认占位，运行时从后台"收款设置"自动同步
const wechatPhone = ref('')
const qrCodeUrl = ref('')
const fallbackPhone = '136-0000-0000'

// Hero 主标题：每次进入随机抽一条（与原首页保持一致）
const LANDING_HEADLINES = [
  '孩子的专属宠物，言行驱动成长。',
  '老师轻点评分，学生宠物同步成长。',
  '一声表扬，一只宠物，一份看得见的成长。',
] as const

const landingHeadline = ref(
  LANDING_HEADLINES[Math.floor(Math.random() * LANDING_HEADLINES.length)]!,
)

// 操作流程（三端）
const flow = [
  { step: '01', icon: 'school', who: '老师', title: '创建班级', desc: '生成班级码，一键导入学生名单，30 秒开课。' },
  { step: '02', icon: 'rate_review', who: '课堂', title: '实时评价', desc: '课堂表现随手记录，学生喂养宠物、积累积分。' },
  { step: '03', icon: 'person', who: '家长', title: '见证成长', desc: '扫码加入，实时看见孩子成长，按需开通会员。' },
]

// 套餐（价格以工作台内实际方案为准）
const plans = [
  { name: '基础版', price: '免费', unit: '永久', highlight: false,
    points: ['创建班级与导入学生', '成长宠物与积分体系', '家长实时成长相册', '基础评价与规则'] },
  { name: '会员版', price: '进入工作台', unit: '查看当前方案', highlight: true,
    points: ['解锁全部成长内容', '专属宠物进化与皮肤', '班级荣誉墙与数据分析', '优先客服与定制支持'] },
]

const faqs = [
  { q: '需要做培训吗？', a: '不需要。老师扫码即可用，界面和玩游戏一样直观，学生零门槛上手。' },
  { q: '家长怎么参与？', a: '老师把班级码发到家长群，家长扫码就能看见孩子的宠物成长和喂养记录。' },
  { q: '数据安全吗？', a: '账号分级管理，老师掌控评价权限，家长仅能查看自己孩子的数据。' },
  { q: '支持哪些设备？', a: '手机、平板、电脑浏览器均可使用，无需下载 App。' },
  { q: '可以试用吗？', a: '基础版永久免费，会员版可先创建班级体验，满意后再开通。' },
]

function goWorkbench() {
  router.push('/app')
}
function goDemo() {
  // 进入演示班级：/app?demo=1 由工作台自动拉起演示模式
  router.push('/app?demo=1')
}
function goLogin() {
  router.push('/login')
}

onMounted(async () => {
  // 注入统计代码（若已配置）
  if (analyticsScript && analyticsScript.trim()) {
    const s = document.createElement('script')
    s.textContent = analyticsScript
    document.head.appendChild(s)
  }
  // 同步后台客服信息（收款设置里的微信/电话）
  try {
    const res = await fetch('/api/settings/payment')
    if (res.ok) {
      const d = await res.json()
      wechatPhone.value = d.wechatPhone || ''
      qrCodeUrl.value = d.qrCodeUrl || ''
    }
  } catch {
    /* 忽略，使用占位 */
  }
  // 同步后台站点信息（ICP 备案号）
  try {
    const res = await fetch('/api/settings/site')
    if (res.ok) {
      const d = await res.json()
      if (d.icp) beianNo.value = d.icp
    }
  } catch {
    /* 忽略，使用占位 */
  }
})
</script>

<template>
  <div class="min-h-screen bg-white text-[#1a1a1a]">
    <!-- 顶部导航 -->
    <header class="sticky top-0 z-30 border-b border-[#f0e6dc] bg-white/85 backdrop-blur">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <a href="/" class="flex items-center gap-2">
          <span class="material-symbols-rounded text-[28px] text-[#d97706]">pets</span>
          <span class="font-brand text-lg font-bold tracking-wide">{{ brandName }}</span>
        </a>
        <nav class="hidden items-center gap-7 text-sm font-medium text-[#6b5544] md:flex">
          <a href="#features" class="hover:text-[#d97706]">功能亮点</a>
          <a href="#flow" class="hover:text-[#d97706]">使用流程</a>
          <a href="#plans" class="hover:text-[#d97706]">套餐方案</a>
          <a href="#faq" class="hover:text-[#d97706]">常见问题</a>
          <router-link to="/guide" target="_blank" rel="noopener noreferrer" class="hover:text-[#d97706]">操作说明</router-link>
          <a href="#contact" class="hover:text-[#d97706]">联系客服</a>
        </nav>
        <div class="flex items-center gap-2">
          <button type="button" class="hidden rounded-full px-4 py-2 text-sm font-semibold text-[#b85e25] hover:bg-[#fff3eb] sm:inline-block" @click="goLogin">管理员登录</button>
          <button type="button" class="rounded-full bg-[#ff5c00] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#e84e00]" @click="goWorkbench">进入工作台</button>
        </div>
      </div>
    </header>

    <!-- Hero（原首页样式保留） -->
    <section class="flex items-center justify-center px-5 pt-16 pb-8 sm:px-8 sm:pb-10">
      <div class="flex w-full max-w-[860px] flex-col items-center text-center">
        <div class="flex h-[34px] items-center justify-center gap-2 rounded-full bg-[#fff3ec] px-4">
          <span class="h-2 w-2 rounded-full bg-[#ff5c00]"></span>
          <span class="font-brand text-sm font-bold text-[#ff5c00]">班级宠物园</span>
        </div>
        <h1 class="mt-[22px] max-w-[820px] font-serif text-5xl font-bold leading-[0.98] text-[#1a1a1a] sm:text-[68px]">{{ landingHeadline }}</h1>
        <p class="mt-[22px] max-w-[660px] text-base leading-[1.45] text-[#666] sm:text-xl">老师快速加分，学生的宠物随习惯一起升级。</p>
        <div class="mt-[22px] flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button type="button" class="font-brand h-12 rounded-full bg-[#ff5c00] px-8 text-[15px] font-bold text-white shadow-[0_16px_40px_rgba(0,0,0,0.07)] transition hover:bg-[#e95300]" @click="goDemo">进入演示班级</button>
          <router-link to="/register" class="font-brand inline-flex h-12 items-center rounded-full border border-[#ff5c00] bg-white px-8 text-[15px] font-bold text-[#ff5c00] transition hover:bg-[#fff3ec]">我是老师，创建新班级</router-link>
        </div>
        <div class="mt-[22px] flex h-[86px] w-full max-w-[420px] items-center justify-center gap-[18px] rounded-xl border border-[#f3f4f6] bg-white px-[18px] py-[14px] text-left shadow-[0_16px_40px_rgba(0,0,0,0.07)]">
          <div class="relative h-[58px] w-[58px] shrink-0 rounded-xl bg-[#fff3ec]">
            <span class="absolute left-[15px] top-[14px] h-7 w-7 rounded-full bg-[#ff8533]"></span>
            <span class="absolute left-3 top-[10px] h-2.5 w-2.5 rounded-full bg-[#ff8533]"></span>
            <span class="absolute right-3 top-[10px] h-2.5 w-2.5 rounded-full bg-[#ff8533]"></span>
          </div>
          <div class="min-w-0">
            <p class="font-brand text-sm font-bold text-[#1a1a1a]">评价一次，成长一点</p>
            <p class="mt-1 text-sm leading-5 text-[#888]">积分、等级、徽章都围绕学生的日常表现。</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 产品截图（原首页样式保留） -->
    <section class="flex flex-col items-center justify-center gap-[18px] px-5 py-10 sm:h-[700px] sm:px-8 lg:h-auto lg:min-h-[820px] lg:gap-6 lg:py-14">
      <div class="text-center">
        <p class="font-brand text-sm leading-5 font-semibold text-[#ff5c00]">产品截图</p>
        <h2 class="mt-4 font-serif text-3xl font-bold leading-[1.05] text-[#1a1a1a] sm:text-[34px]">把喂养、成长与班级记录放在同一屏。</h2>
      </div>
      <div class="flex w-full max-w-[1040px] items-center justify-center rounded-xl border border-[#f3f4f6] bg-white p-3 shadow-[0_16px_40px_rgba(0,0,0,0.07)] sm:h-[590px] sm:p-4 lg:max-w-[1180px] lg:h-[660px] lg:p-5 xl:max-w-[1280px] xl:h-[720px]">
        <img src="/class-pet-garden-product.png" alt="班级宠物园产品截图" class="w-full rounded-lg sm:h-full sm:object-contain" />
      </div>
    </section>

    <!-- 功能亮点（原首页样式保留） -->
    <section id="features" class="relative flex min-h-[230px] flex-col items-center justify-center gap-5 px-5 py-12 sm:px-8">
      <span class="absolute left-[18%] top-[42px] h-[7px] w-[7px] rounded-full bg-[#ff8533]"></span>
      <span class="absolute right-[18%] top-[40px] text-base text-[#ff5c00]">✦</span>
      <span class="absolute bottom-[34px] left-[24%] h-1 w-[18px] rotate-[-18deg] rounded-full bg-[#ff5c00]"></span>
      <div class="text-center">
        <p class="font-brand text-sm leading-5 font-semibold text-[#ff5c00]">CLASS PET GARDEN</p>
        <h2 class="mt-4 font-serif text-3xl font-bold leading-[1.05] text-[#1a1a1a] sm:text-[34px]">让班级反馈，变成孩子看得见的成长</h2>
      </div>
      <div class="flex w-full max-w-[900px] flex-col gap-6 md:flex-row md:items-center md:gap-6">
        <article class="flex flex-1 items-center gap-3"><div class="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#fff3eb] text-[#ff5c00]"><span class="material-symbols-rounded text-[20px]">rate_review</span></div><div><h3 class="text-[17px] font-[650]">快速评价</h3><p class="font-brand mt-1 text-sm leading-[1.25] text-[#666]">老师轻点完成课堂反馈</p></div></article>
        <div class="hidden h-12 w-px bg-[#f3f4f6] md:block"></div>
        <article class="flex flex-1 items-center gap-3"><div class="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#fff3eb] text-[#ff5c00]"><span class="material-symbols-rounded text-[20px]">pets</span></div><div><h3 class="text-[17px] font-[650]">宠物成长</h3><p class="font-brand mt-1 text-sm leading-[1.25] text-[#666]">每次进步都喂养专属小宠物</p></div></article>
        <div class="hidden h-12 w-px bg-[#f3f4f6] md:block"></div>
        <article class="flex flex-1 items-center gap-3"><div class="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#fff3eb] text-[#ff5c00]"><span class="material-symbols-rounded text-[20px]">emoji_events</span></div><div><h3 class="text-[17px] font-[650]">班级荣誉</h3><p class="font-brand mt-1 text-sm leading-[1.25] text-[#666]">把个人努力汇成班级勋章</p></div></article>
      </div>
    </section>

    <!-- 使用流程 -->
    <section id="flow" class="bg-[#faf6f1] py-16">
      <div class="mx-auto max-w-6xl px-4">
        <div class="text-center">
          <h2 class="font-serif text-3xl font-bold text-[#2b1d12]">三步开启成长之旅</h2>
          <p class="mt-3 text-[#6b5544]">老师、课堂、家长，各司其职又彼此连接</p>
        </div>
        <div class="mt-12 grid gap-8 md:grid-cols-3">
          <div v-for="(it, i) in flow" :key="it.step" class="relative rounded-2xl border border-[#f0e6dc] bg-white p-6">
            <span class="absolute -top-4 left-6 flex h-9 w-9 items-center justify-center rounded-full bg-[#ff5c00] text-sm font-bold text-white shadow">{{ it.step }}</span>
            <div class="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff7ef] text-[#ff7a18]"><span class="material-symbols-rounded text-[24px]">{{ it.icon }}</span></div>
            <p class="mt-3 text-xs font-semibold uppercase tracking-wider text-[#d97706]">{{ it.who }}</p>
            <h3 class="text-lg font-bold">{{ it.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-[#6b5544]">{{ it.desc }}</p>
            <div v-if="i < flow.length - 1" class="absolute -right-4 top-1/2 hidden text-2xl text-[#e7c9a8] md:block">→</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 套餐方案 -->
    <section id="plans" class="mx-auto max-w-6xl px-4 py-16">
      <div class="text-center">
        <h2 class="font-serif text-3xl font-bold text-[#2b1d12]">简单透明的套餐</h2>
        <p class="mt-3 text-[#6b5544]">基础版永久免费，会员版解锁完整成长体验</p>
      </div>
      <div class="mt-10 grid gap-6 md:grid-cols-2 md:max-w-3xl md:mx-auto">
        <article v-for="p in plans" :key="p.name" :class="['rounded-3xl border p-8', p.highlight ? 'border-[#ff5c00] bg-gradient-to-b from-[#fff7ef] to-white shadow-lg ring-2 ring-[#ffd9bd]' : 'border-[#f0e6dc] bg-white shadow-sm']">
          <div v-if="p.highlight" class="mb-3 inline-block rounded-full bg-[#ff5c00] px-3 py-1 text-xs font-bold text-white">最受欢迎</div>
          <h3 class="text-xl font-bold">{{ p.name }}</h3>
          <div class="mt-3 flex items-end gap-1">
            <span class="font-serif text-4xl font-bold text-[#d97706]">{{ p.price }}</span>
            <span class="mb-1 text-sm text-[#9a735d]">/ {{ p.unit }}</span>
          </div>
          <ul class="mt-6 space-y-3 text-sm text-[#5a4636]">
            <li v-for="pt in p.points" :key="pt" class="flex items-start gap-2">
              <span class="material-symbols-rounded mt-0.5 text-[18px] text-[#ff5c00]">check</span>
              <span>{{ pt }}</span>
            </li>
          </ul>
          <button type="button" :class="['mt-8 inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-full text-base font-bold transition', p.highlight ? 'bg-[#ff5c00] text-white hover:bg-[#e84e00]' : 'border border-[#e7d8c8] text-[#b85e25] hover:border-[#d97706]']" @click="goWorkbench">
            进入工作台开通
          </button>
        </article>
      </div>
    </section>

    <!-- FAQ -->
    <section id="faq" class="bg-[#faf6f1] py-16">
      <div class="mx-auto max-w-3xl px-4">
        <h2 class="text-center font-serif text-3xl font-bold text-[#2b1d12]">常见问题</h2>
        <div class="mt-10 space-y-4">
          <details v-for="(f, i) in faqs" :key="i" class="group rounded-2xl border border-[#f0e6dc] bg-white p-5 [&_summary]:cursor-pointer">
            <summary class="flex items-center justify-between font-semibold text-[#422d20]">
              <span>{{ f.q }}</span>
              <span class="material-symbols-rounded text-[#d97706] transition group-open:rotate-180">expand_more</span>
            </summary>
            <p class="mt-3 text-sm leading-relaxed text-[#6b5544]">{{ f.a }}</p>
          </details>
        </div>
      </div>
    </section>

    <!-- 客服 -->
    <section id="contact" class="mx-auto max-w-6xl px-4 py-16">
      <div class="overflow-hidden rounded-3xl bg-gradient-to-br from-[#ff7a18] to-[#ff5c00] p-8 text-white shadow-lg md:p-12">
        <div class="grid items-center gap-8 md:grid-cols-2">
          <div>
            <h2 class="font-serif text-3xl font-bold">有任何问题，随时找我们</h2>
            <p class="mt-3 opacity-90">专属客服协助你创建班级、配置方案，让落地零阻力。</p>
            <div class="mt-6 space-y-3 text-sm">
              <p class="flex items-center gap-2"><span class="material-symbols-rounded">call</span> 客服电话：{{ wechatPhone || fallbackPhone }}</p>
              <p class="flex items-center gap-2"><span class="material-symbols-rounded">refresh</span> 服务时间：{{ serviceTime }}</p>
            </div>
            <button type="button" class="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-base font-bold text-[#ff5c00] transition hover:bg-[#fff3eb]" @click="goWorkbench">
              立即免费体验
              <span class="material-symbols-rounded text-[20px]">arrow_forward</span>
            </button>
          </div>
          <div class="flex flex-col items-center justify-center">
            <div class="flex h-44 w-44 items-center justify-center rounded-3xl bg-white/95 shadow-inner">
              <img v-if="qrCodeUrl" :src="qrCodeUrl" alt="客服二维码" class="h-40 w-40 rounded-2xl object-contain" />
              <span v-else class="material-symbols-rounded text-[64px] text-[#ffb380]">share</span>
            </div>
            <p class="mt-3 text-sm opacity-90">扫码添加客服 / 查看收款</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 底部 CTA（原首页样式保留）+ 备案 -->
    <footer class="bg-[#f7f8fa] px-5 py-14 text-center sm:px-8">
      <div class="flex flex-col items-center gap-[14px]">
        <h2 class="font-serif text-3xl font-bold text-[#1a1a1a] sm:text-[34px]">先从一个班级开始。</h2>
        <div class="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-base">
          <span class="text-[#666]">导入学生，设置评价规则，让成长被看见。</span>
          <button type="button" class="font-brand font-bold text-[#ff5c00] underline-offset-2 transition hover:text-[#e95300] hover:underline" @click="goDemo">进入演示班级</button>
          <span class="text-[#ccc]">·</span>
          <router-link to="/register" class="font-brand font-bold text-[#ff5c00] underline-offset-2 transition hover:text-[#e95300] hover:underline">我是老师，创建新班级</router-link>
        </div>
        <p class="font-brand text-sm text-[#888]">© 2026 {{ brandName }}。保留所有权利。</p>
        <p class="text-xs text-[#aaa]">{{ beianNo }}</p>
      </div>
    </footer>
  </div>
</template>
