<script setup lang="ts">
const sections = [
  { id: 'intro', title: '简介' },
  { id: 'quick-start', title: '快速开始' },
  { id: 'class', title: '班级管理' },
  { id: 'students', title: '学生管理' },
  { id: 'points', title: '积分操作' },
  { id: 'pets', title: '宠物系统' },
  { id: 'ranking', title: '排行榜' },
  { id: 'records', title: '评价记录' },
  { id: 'vip', title: '会员服务' },
  { id: 'settings', title: '个人与系统设置' },
  { id: 'backup', title: '数据备份' },
  { id: 'tips', title: '使用技巧' },
  { id: 'notes', title: '注意事项' },
]
</script>

<template>
  <div class="min-h-screen bg-[#f0f1f4] px-3 py-6 sm:px-6 sm:py-10">
    <div class="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
      <!-- 渐变头部 -->
      <header class="bg-gradient-to-r from-[#ff7a18] via-[#ff9214] to-[#ffb02e] px-6 py-12 text-center text-white">
        <h1 class="text-2xl font-bold sm:text-3xl">🐾 班级宠物园 - 操作说明</h1>
        <p class="mt-3 text-sm opacity-95 sm:text-base">面向教师的课堂积分管理与宠物养成工具，游戏化激励学生成长</p>
        <router-link
          to="/login"
          class="mt-6 inline-flex h-10 items-center rounded-full bg-white/20 px-6 text-sm font-semibold text-white transition hover:bg-white/30"
        >
          ← 返回登录
        </router-link>
      </header>

      <div class="space-y-6 px-4 py-8 sm:px-8">
        <!-- 目录 -->
        <nav class="rounded-2xl border border-[#eef0f3] bg-white p-6 shadow-sm">
          <h2 class="flex items-center gap-2 text-lg font-bold text-[#ff5c00]">📖 目录</h2>
          <ul class="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <li v-for="s in sections" :key="s.id">
              <a :href="`#${s.id}`" class="text-[#555] transition hover:text-[#ff5c00]">{{ s.title }}</a>
            </li>
          </ul>
        </nav>

        <!-- 简介 -->
        <section id="intro" class="rounded-2xl border border-[#eef0f3] bg-white p-6 shadow-sm scroll-mt-6">
          <h2 class="text-lg font-bold text-[#1a1a1a]">简介</h2>
          <p class="mt-3 text-sm leading-6 text-[#555]">
            班级宠物园是一款面向教师的课堂积分管理与宠物养成工具。老师对学生的课堂表现进行加分、扣分，
            学生的专属宠物随积分成长、升级与进化，把日常激励变成孩子主动争取的「小期待」。
          </p>
          <p class="mt-2 text-sm leading-6 text-[#555]">
            系统由三部分组成：教师工作台（评价与管理）、家长端（扫码查看自己孩子的成长）、
            管理后台（站点与收款配置，仅管理员可见）。
          </p>
        </section>

        <!-- 快速开始 -->
        <section id="quick-start" class="rounded-2xl border border-[#eef0f3] bg-white p-6 shadow-sm scroll-mt-6">
          <h2 class="text-lg font-bold text-[#1a1a1a]">快速开始</h2>
          <ol class="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-[#555]">
            <li>注册老师账号并登录（支持手机号注册）。</li>
            <li>在工作台点击「创建班级」，填写班级名称。</li>
            <li>点击「导入学生」，粘贴或上传学生名单，一键生成学生宠物卡片。</li>
            <li>进入「评价规则」，按班级需要新增正面 / 负面评价项与分值。</li>
            <li>在学生卡片上点「+ 加分 / − 扣分」，或开启「快速评价」连续操作。</li>
          </ol>
          <p class="mt-3 rounded-xl bg-[#fff7ef] px-4 py-3 text-sm text-[#b85e25]">
            想先体验再注册？在登录页点击「以游客身份继续」，即可进入演示班级试用全部功能。
          </p>
        </section>

        <!-- 班级管理 -->
        <section id="class" class="rounded-2xl border border-[#eef0f3] bg-white p-6 shadow-sm scroll-mt-6">
          <h2 class="text-lg font-bold text-[#1a1a1a]">班级管理</h2>
          <ul class="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#555]">
            <li>创建班级：工作台顶部「创建班级」按钮，一个账号可创建多个班级。</li>
            <li>切换班级：顶部班级下拉框，随时切换当前操作的班级。</li>
            <li>班级码：每个班级有唯一班级码，家长扫码加入后可查看自己孩子的成长。</li>
            <li>班级成长概览：工作台下方展示本周积分趋势，方便班级复盘。</li>
          </ul>
        </section>

        <!-- 学生管理 -->
        <section id="students" class="rounded-2xl border border-[#eef0f3] bg-white p-6 shadow-sm scroll-mt-6">
          <h2 class="text-lg font-bold text-[#1a1a1a]">学生管理</h2>
          <ul class="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#555]">
            <li>导入学生：支持粘贴名单批量导入，也可逐个添加。</li>
            <li>搜索定位：顶部搜索框支持按学生姓名 / 学号快速查找。</li>
            <li>学生卡片：展示头像、宠物、等级、积分与成长进度条。</li>
            <li>视图切换：卡片 / 列表两种视图，支持按积分等维度排序。</li>
            <li>学生详情：点击卡片可查看该生的评价记录、宠物状态与成长轨迹。</li>
          </ul>
        </section>

        <!-- 积分操作 -->
        <section id="points" class="rounded-2xl border border-[#eef0f3] bg-white p-6 shadow-sm scroll-mt-6">
          <h2 class="text-lg font-bold text-[#1a1a1a]">积分操作</h2>
          <ul class="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#555]">
            <li>快速加分 / 扣分：学生卡片上的「+ 加分」「− 扣分」按钮，一键完成。</li>
            <li>快速评价模式：点击「快速评价」进入连击模式，卡片变暗突出可操作项，适合课堂高频使用。</li>
            <li>按规则评价：选择预设的评价项（如"作业认真完成 +2"），让评价有据可依。</li>
            <li>评价规则：在「评价规则」页新增、编辑规则，区分正面 / 负面行为与对应分值。</li>
            <li>今日记录：工作台实时显示当天评价次数与最近记录。</li>
          </ul>
        </section>

        <!-- 宠物系统 -->
        <section id="pets" class="rounded-2xl border border-[#eef0f3] bg-white p-6 shadow-sm scroll-mt-6">
          <h2 class="text-lg font-bold text-[#1a1a1a]">宠物系统</h2>
          <ul class="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#555]">
            <li>宠物领养：学生入学时可挑选自己的专属宠物。</li>
            <li>成长与进化：积分累积推动宠物升级，达到条件后进化为更高形态。</li>
            <li>宠物图鉴：收录全部宠物形态，收集进度一目了然。</li>
            <li>喂养记录：每次加分都会转化为喂养记录，家长端同步可见。</li>
            <li>稀有宠物：部分传说级宠物需要开通班级会员后解锁。</li>
          </ul>
        </section>

        <!-- 排行榜 -->
        <section id="ranking" class="rounded-2xl border border-[#eef0f3] bg-white p-6 shadow-sm scroll-mt-6">
          <h2 class="text-lg font-bold text-[#1a1a1a]">排行榜</h2>
          <ul class="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#555]">
            <li>班级排行榜：按总积分展示学生排名，激励良性竞争。</li>
            <li>进步视角：结合周趋势，关注"进步最快"的孩子而不仅是榜首。</li>
            <li>班级荣誉：个人努力汇入班级勋章，培养集体荣誉感。</li>
          </ul>
          <p class="mt-3 rounded-xl bg-[#fff7ef] px-4 py-3 text-sm text-[#b85e25]">
            建议：排名用于鼓励进步，避免公开批评末位学生。
          </p>
        </section>

        <!-- 评价记录 -->
        <section id="records" class="rounded-2xl border border-[#eef0f3] bg-white p-6 shadow-sm scroll-mt-6">
          <h2 class="text-lg font-bold text-[#1a1a1a]">评价记录</h2>
          <ul class="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#555]">
            <li>「评价记录」页汇总所有评价明细：时间、学生、规则、分值。</li>
            <li>支持按学生、日期、正负分筛选，方便写评语与家校沟通。</li>
            <li>误操作可在记录中核对后进行修正。</li>
          </ul>
        </section>

        <!-- 会员服务 -->
        <section id="vip" class="rounded-2xl border border-[#eef0f3] bg-white p-6 shadow-sm scroll-mt-6">
          <h2 class="text-lg font-bold text-[#1a1a1a]">会员服务</h2>
          <ul class="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#555]">
            <li>基础版永久免费：包含班级、学生、评价、宠物等核心功能。</li>
            <li>会员版：解锁全部宠物图鉴、传说级宠物、班级数据分析与高级皮肤。</li>
            <li>开通方式：在工作台「会员服务」页按提示扫码开通，客服协助配置。</li>
          </ul>
        </section>

        <!-- 个人与系统设置 -->
        <section id="settings" class="rounded-2xl border border-[#eef0f3] bg-white p-6 shadow-sm scroll-mt-6">
          <h2 class="text-lg font-bold text-[#1a1a1a]">个人与系统设置</h2>
          <ul class="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#555]">
            <li>教师账号：点击右上角头像，可查看账号信息、切换班级、退出登录。</li>
            <li>背景音乐：右上角音符按钮可选择课堂背景音乐或静音。</li>
            <li>站点配置：收款码、客服微信等由管理员在管理后台「收款设置」中维护。</li>
          </ul>
        </section>

        <!-- 数据备份 -->
        <section id="backup" class="rounded-2xl border border-[#eef0f3] bg-white p-6 shadow-sm scroll-mt-6">
          <h2 class="text-lg font-bold text-[#1a1a1a]">数据备份</h2>
          <ul class="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#555]">
            <li>「数据备份」页支持导出班级、学生与评价数据。</li>
            <li>学期结束或更换设备前，建议先导出一份备份。</li>
            <li>导入数据前请确认班级匹配，避免重复导入。</li>
          </ul>
        </section>

        <!-- 使用技巧 -->
        <section id="tips" class="rounded-2xl border border-[#eef0f3] bg-white p-6 shadow-sm scroll-mt-6">
          <h2 class="text-lg font-bold text-[#1a1a1a]">使用技巧</h2>
          <ul class="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#555]">
            <li>课堂高频评价时开启「快速评价」模式，专注当前操作，减少误点。</li>
            <li>把常用行为做成高分值规则（如"课堂发言 +3"），评价更快。</li>
            <li>每周五用「班级成长概览」做 3 分钟小结，点名表扬进步学生。</li>
            <li>投屏工作台到教室大屏，宠物升级瞬间全班共享，激励效果翻倍。</li>
            <li>让家长尽早扫码加入，孩子的成长被看见，配合度更高。</li>
          </ul>
        </section>

        <!-- 注意事项 -->
        <section id="notes" class="rounded-2xl border border-[#eef0f3] bg-white p-6 shadow-sm scroll-mt-6">
          <h2 class="text-lg font-bold text-[#1a1a1a]">注意事项</h2>
          <ul class="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#555]">
            <li>请妥善保管账号密码，不要借给他人使用。</li>
            <li>班级码仅分享给本班家长，避免外人加入。</li>
            <li>家长端为只读视图，无法修改任何数据。</li>
            <li>扣分请配合沟通使用，积分体系以正向激励为主。</li>
            <li>如遇数据异常，请联系客服，不要反复重复导入。</li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>
