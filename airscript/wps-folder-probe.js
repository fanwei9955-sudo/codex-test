// 物业数据中转 · 文件夹探测脚本（只读）
//
// 上一版直接用「叶丹如」文件夹网址列文件时报「权限被拒绝」。
// 这一版先从「我的云文档」根目录里找到叶丹如文件夹和各园区月表，
// 打印它们的完整信息，再试几种目录链接格式，看哪种能进到文件夹里。

const all = []
for (let offset = 0; offset >= 0 && all.length < 3000; ) {
  const list = KSDrive.listFiles({ offset, count: 100 })
  for (let i = 0; i < list.files.length; i++) all.push(list.files[i])
  offset = list.nextOffset
}
console.log('根目录共 ' + all.length + ' 个')

// 打印相关条目的完整字段，看有没有文件夹 id、链接之类可用的信息
const hits = all.filter(f => /叶丹如|天济|中基|增城|广州|黄江|东深|大朗|26-1\d/.test(f.fileName))
console.log('相关条目 ' + hits.length + ' 个：')
hits.slice(0, 30).forEach(f => console.log(JSON.stringify(f)))

// 用叶丹如文件夹的 id 拼几种目录链接，逐个试
const folder = all.find(f => f.fileName.includes('叶丹如'))
if (!folder) {
  console.log('⚠️ 根目录里没找到叶丹如')
} else {
  const candidates = [
    'https://www.kdocs.cn/mine/' + folder.fileId,
    'https://www.kdocs.cn/team/' + folder.fileId,
    'https://www.kdocs.cn/folder/' + folder.fileId
  ]
  for (let i = 0; i < candidates.length; i++) {
    const url = candidates[i]
    try {
      const list = KSDrive.listFiles({ dirUrl: url, count: 30 })
      console.log('✅ ' + url + '：' + list.files.map(f => f.fileName).join('、'))
    } catch (e) {
      console.log('❌ ' + url + '：' + e)
    }
  }
}

return { total: all.length, hits }
