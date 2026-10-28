// 物业数据中转 · 自有共享文件夹探测（只读）
//
// 验证：如果共享文件夹的所有者是你，脚本能不能列出里面的文件。
// 拿你自己建的「永诚壹【深圳】」来试，结果成立的话，再把「叶丹如」转回给你。
//
// 用法：在浏览器打开「永诚壹【深圳】」文件夹，复制地址栏网址填到 OWNED_FOLDER_URL

const OWNED_FOLDER_URL = ''
const FOLDER_NAME = '永诚壹【深圳】'

function tryList(label, dirUrl) {
  try {
    const list = KSDrive.listFiles({ dirUrl, count: 30 })
    console.log('✅ ' + label + '：' + list.files.length + ' 个：' + list.files.map(f => f.fileName).join('、'))
    return true
  } catch (e) {
    console.log('❌ ' + label + '：' + e)
    return false
  }
}

// 只翻第一页根目录，找到文件夹的 fileId
const root = KSDrive.listFiles({ count: 100 })
const folder = root.files.find(f => f.fileName === FOLDER_NAME)
console.log(folder ? '根目录里找到：' + JSON.stringify(folder) : '⚠️ 根目录第一页没找到' + FOLDER_NAME)

if (folder) tryList('mine/fileId', 'https://www.kdocs.cn/mine/' + folder.fileId)
if (OWNED_FOLDER_URL) tryList('地址栏网址', OWNED_FOLDER_URL)
