<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// ===== 可配置信息（上线前替换为真实内容） =====
const brandName = '班级宠物园'
// 备案号占位：替换为你的 ICP 备案号，例如 京ICP备XXXXXXXX号-1
const beianNo = '京ICP备XXXXXXXX号-X'
const serviceTime = '每日 9:00 - 21:00'
// 第三方统计代码（百度统计/微信统计/友盟等）。留空则不注入。
// 例如百度统计：
//   "var _hmt=_hmt||[];(function(){var hm=document.createElement('script');hm.src='https://hm.baidu.com/hm.js?你的ID';var s=document.getElementsByTagName('script')[0];s.parentNode.insertBefore(hm,s);})();"
const analyticsScript: string = ''

// 客服信息：默认占位，运行时从后台"收款设置"自动同步
const wechatPhone = ref('')
const qrCodeUrl = ref('')
const fallbackPhone = '136-0000-0000'

// 功能亮点
const features = [
  { icon: 'bolt', title: '极速评价', desc: '轻点即可完成课堂反馈与行为记录，告别纸质表格，老师零负担。' },
  { icon: 'pets', title: '成长宠物', desc: '每次进步都喂养专属小宠物，等级与进化看得见，孩子主动追着成长。' },
  { icon: 'military_tech', title: '积分激励', desc: '积分兑换勋章与班级特权，把"要我学"变成"我要学"的正向循环。' },
  { icon: 'emoji_events', title: '班级荣誉', desc: '个人努力汇成班级勋章，集体荣誉感拉满，班风自然向上。' },
  { icon: 'view_list', title: '家长透明', desc: '成长相册与喂养记录实时同步，家校零距离，家长更放心。' },
  { icon: 'stars', title: '轻量运营', desc: '免安装、免培训，一个班级码即可开课，人手一部手机就能用。' },
]

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
})
</script>

<template>
  <div class="min-h-screen bg-[#f5f7fa] text-[#422d20]">
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
          <a href="#contact" class="hover:text-[#d97706]">联系客服</a>
        </nav>
        <div class="flex items-center gap-2">
          <button type="button" class="hidden rounded-full px-4 py-2 text-sm font-semibold text-[#b85e25] hover:bg-[#fff3eb] sm:inline-block" @click="goLogin">管理员登录</button>
          <button type="button" class="rounded-full bg-[#ff5c00] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#e84e00]" @click="goWorkbench">进入工作台</button>
        </div>
      </div>
    </header>

    <!-- Hero -->
    <section class="relative overflow-hidden">
      <div class="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
        <div>
          <span class="inline-flex items-center gap-1.5 rounded-full bg-[#fff3eb] px-3 py-1 text-xs font-semibold text-[#d97706]">
            <span class="material-symbols-rounded text-[16px]">stars</span> 让每一次进步都被看见
          </span>
          <h1 class="mt-5 font-serif text-4xl font-bold leading-tight text-[#2b1d12] md:text-5xl">
            用一只成长宠物<br />点燃孩子的学习动力
          </h1>
          <p class="mt-5 text-base leading-relaxed text-[#6b5544] md:text-lg">
            老师 10 秒完成一次课堂评价，学生喂养专属宠物，家长实时看见成长。
            把日常打卡变成孩子主动争取的「小期待」。
          </p>
          <div class="mt-8 flex flex-wrap items-center gap-3">
            <button type="button" class="inline-flex h-12 items-center gap-2 rounded-full bg-[#ff5c00] px-7 text-base font-bold text-white shadow-md transition hover:bg-[#e84e00]" @click="goWorkbench">
              免费创建班级
              <span class="material-symbols-rounded text-[20px]">arrow_forward</span>
            </button>
            <a href="#flow" class="inline-flex h-12 items-center gap-2 rounded-full border border-[#e7d8c8] bg-white px-6 text-base font-semibold text-[#8a6b51] transition hover:border-[#d97706]" >
              <span class="material-symbols-rounded text-[20px]">arrow_forward</span> 查看使用流程
            </a>
          </div>
          <div class="mt-8 flex items-center gap-6 text-sm text-[#9a735d]">
            <div><span class="font-serift text-2xl font-bold text-[#d97706]">0</span> 安装 · 开箱即用</div>
            <div><span class="font-serif text-2xl font-bold text-[#d97706]">1</span> 个班级码开课</div>
            <div><span class="font-serif text-2xl font-bold text-[#d97706]">30</span> 秒上手</div>
          </div>
        </div>
        <!-- 主视觉 -->
        <div class="relative flex items-center justify-center">
          <div class="absolute h-72 w-72 rounded-full bg-gradient-to-br from-[#ffe1c2] to-[#ffd0a8] blur-2xl opacity-70"></div>
          <div class="relative flex h-80 w-80 flex-col items-center justify-center rounded-[2.5rem] bg-gradient-to-br from-[#fff7ef] to-[#fff0e0] shadow-xl ring-1 ring-[#f3e3d2]">
            <span class="material-symbols-rounded text-[120px] leading-none text-[#ff7a18]">pets</span>
            <p class="mt-2 font-serif text-xl font-bold text-[#b85e25]">成长，看得见</p>
            <div class="mt-5 flex gap-3">
              <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#ff5c00] shadow-sm"><span class="material-symbols-rounded">emoji_events</span></span>
              <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#ff8a3d] shadow-sm"><span class="material-symbols-rounded">favorite</span></span>
              <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#ffa64d] shadow-sm"><span class="material-symbols-rounded">stars</span></span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 功能亮点 -->
    <section id="features" class="mx-auto max-w-6xl px-4 py-16">
      <div class="text-center">
        <h2 class="font-serif text-3xl font-bold text-[#2b1d12]">为什么老师和家长都选它</h2>
        <p class="mt-3 text-[#6b5544]">把激励机制做进每一次课堂，让成长自然发生</p>
      </div>
      <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <article v-for="f in features" :key="f.title" class="rounded-2xl border border-[#f0e6dc] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-[#fff3eb] text-[#ff5c00]">
            <span class="material-symbols-rounded text-[24px]">{{ f.icon }}</span>
          </div>
          <h3 class="mt-4 text-lg font-bold">{{ f.title }}</h3>
          <p class="mt-2 text-sm leading-relaxed text-[#6b5544]">{{ f.desc }}</p>
        </article>
      </div>
    </section>

    <!-- 使用流程 -->
    <section id="flow" class="bg-white py-16">
      <div class="mx-auto max-w-6xl px-4">
        <div class="text-center">
          <h2 class="font-serif text-3xl font-bold text-[#2b1d12]">三步开启成长之旅</h2>
          <p class="mt-3 text-[#6b5544]">老师、课堂、家长，各司其职又彼此连接</p>
        </div>
        <div class="mt-12 grid gap-8 md:grid-cols-3">
          <div v-for="(it, i) in flow" :key="it.step" class="relative rounded-2xl border border-[#f0e6dc] bg-[#faf6f1] p-6">
            <span class="absolute -top-4 left-6 flex h-9 w-9 items-center justify-center rounded-full bg-[#ff5c00] text-sm font-bold text-white shadow">{{ it.step }}</span>
            <div class="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#ff7a18] shadow-sm"><span class="material-symbols-rounded text-[24px]">{{ it.icon }}</span></div>
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
    <section id="faq" class="bg-white py-16">
      <div class="mx-auto max-w-3xl px-4">
        <h2 class="text-center font-serif text-3xl font-bold text-[#2b1d12]">常见问题</h2>
        <div class="mt-10 space-y-4">
          <details v-for="(f, i) in faqs" :key="i" class="group rounded-2xl border border-[#f0e6dc] bg-[#faf6f1] p-5 [&_summary]:cursor-pointer">
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

    <!-- 底部 -->
    <footer class="border-t border-[#f0e6dc] bg-white">
      <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-[#9a735d] md:flex-row">
        <p>© 2026 {{ brandName }} · 让成长被看见</p>
        <div class="flex items-center gap-5">
          <a href="#" class="hover:text-[#d97706]">隐私政策</a>
          <a href="#" class="hover:text-[#d97706]">服务条款</a>
          <span>备案号：{{ beianNo }}</span>
        </div>
      </div>
    </footer>
  </div>
</template>
