/**
 * 规范化后台上传图片的访问路径。
 * 站点部署在 /pet-garden/ 下，历史数据或手填的 /api/ 前缀在服务器上不可达（404），
 * 统一改写为 /pet-garden/api/；外部 http(s) 地址与已正确路径原样返回。
 */
export function normalizeUploadUrl(url: string): string {
  const trimmed = (url || '').trim()
  if (trimmed.startsWith('/api/')) {
    return trimmed.replace(/^\/api\//, '/pet-garden/api/')
  }
  return trimmed
}
