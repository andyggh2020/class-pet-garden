import { onMounted } from 'vue'
import axios from 'axios'

/**
 * 第三方统计代码注入（百度统计 / CNZZ / Google Analytics 等）。
 * 代码由管理员在后台「收款设置 → 第三方统计」填写，保存后全站页面底部自动注入。
 * 留空则不注入；重复进入只注入一次（按 id 去重）。
 */
const INJECTED_FLAG = 'site-analytics-injected'

function injectAnalyticsCode(code: string) {
  if (document.getElementById(INJECTED_FLAG)) return

  const wrapper = document.createElement('div')
  wrapper.id = INJECTED_FLAG
  wrapper.style.display = 'none'
  document.body.appendChild(wrapper)

  const template = document.createElement('template')
  template.innerHTML = code

  for (const node of Array.from(template.content.childNodes)) {
    if (node instanceof HTMLScriptElement) {
      // script 需重新创建才会执行
      const script = document.createElement('script')
      for (const attr of Array.from(node.attributes)) {
        script.setAttribute(attr.name, attr.value)
      }
      script.textContent = node.textContent
      wrapper.appendChild(script)
    } else {
      // noscript / img 信标等直接克隆
      wrapper.appendChild(node.cloneNode(true))
    }
  }
}

export function useAnalytics() {
  onMounted(async () => {
    try {
      const res = await axios.get<{ code?: string }>('/pet-garden/api/settings/analytics')
      const code = res.data?.code?.trim()
      if (code) {
        injectAnalyticsCode(code)
      }
    } catch {
      /* 统计代码获取失败不影响页面使用 */
    }
  })
}
