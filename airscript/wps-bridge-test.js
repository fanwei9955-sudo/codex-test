// 物业数据中转 · 测试脚本（只读，不修改任何单元格）
//
// 用法：贴到你自己的「物业数据中转」表格的 AirScript 脚本编辑器里
//   1. 新建脚本时选「文档共享脚本」
//   2. 工具栏 → 服务 → 添加「云文档API」
//   3. 把下面 FOLDER_URL 换成「叶丹如」共享文件夹的链接（浏览器打开该文件夹后地址栏里的网址）
//   4. 点「运行」，把下方日志截图发给 Claude
//
// 通过 webhook 调用时，可以用 Context.argv 覆盖下面三个配置：
//   { "folderUrl": "...", "fileUrl": "...", "sheetName": "租金统计" }

const CONFIG = {
  // 「叶丹如」共享文件夹链接，留空则只测试「我的云文档」
  FOLDER_URL: '',
  // 用来测试读数的表：黄江六号 26-10（来自 WPS 欠款汇总技能）
  FILE_URL: 'https://www.kdocs.cn/l/ca1kvBdXyy8H',
  SHEET_NAME: '租金统计',
  // 找表头和合计行时最多扫描的范围
  MAX_ROWS: 200,
  MAX_COLS: 40
}

const argv = (typeof Context !== 'undefined' && Context.argv) || {}
const folderUrl = argv.folderUrl || CONFIG.FOLDER_URL
const fileUrl = argv.fileUrl || CONFIG.FILE_URL
const sheetName = argv.sheetName || CONFIG.SHEET_NAME

const result = { tests: {} }

function run(name, fn) {
  const start = Date.now()
  try {
    const data = fn()
    result.tests[name] = { ok: true, ms: Date.now() - start, data }
    console.log('✅ ' + name + '（' + (Date.now() - start) + 'ms）')
  } catch (e) {
    result.tests[name] = { ok: false, ms: Date.now() - start, error: String(e) }
    console.log('❌ ' + name + '：' + e)
  }
}

// 列号转字母：1 → A，27 → AA
function colName(n) {
  let s = ''
  for (; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s
  return s
}

function listAll(options) {
  const names = []
  for (let offset = 0; offset >= 0 && names.length < 500; ) {
    const list = KSDrive.listFiles(Object.assign({ offset, count: 100 }, options))
    for (let i = 0; i < list.files.length; i++) {
      names.push(list.files[i].fileName)
    }
    offset = list.nextOffset
  }
  return names
}

// 测试一：能不能列出「我的云文档」（确认云文档API服务已添加）
run('列出我的云文档', () => {
  const names = listAll({})
  console.log('  共 ' + names.length + ' 个：' + names.slice(0, 10).join('、'))
  return { count: names.length, sample: names.slice(0, 10) }
})

// 测试二：能不能列出「叶丹如」共享文件夹
if (folderUrl) {
  run('列出叶丹如共享文件夹', () => {
    const names = listAll({ dirUrl: folderUrl })
    console.log('  共 ' + names.length + ' 个：' + names.slice(0, 20).join('、'))
    return { count: names.length, sample: names.slice(0, 20) }
  })
} else {
  console.log('⏭ 跳过「列出叶丹如共享文件夹」：FOLDER_URL 没填')
}

// 测试三：按链接打开别人的表，在「租金统计」里找「累计欠款」合计
run('打开表格并读取累计欠款', () => {
  const file = KSDrive.openFile(fileUrl)
  try {
    const app = file.Application
    const sheetNames = []
    let sheet = null
    for (let i = 1; i <= app.Sheets.Count; i++) {
      const s = app.Sheets.Item(i)
      sheetNames.push(s.Name)
      if (s.Name === sheetName) sheet = s
    }
    console.log('  工作表：' + sheetNames.join('、'))
    if (!sheet) throw new Error('找不到工作表「' + sheetName + '」')

    // 找表头「累计欠款」所在列
    let headerRow = 0
    let col = 0
    for (let r = 1; r <= 15 && !col; r++) {
      for (let c = 1; c <= CONFIG.MAX_COLS; c++) {
        if (String(sheet.Cells(r, c).Text).replace(/\s/g, '').includes('累计欠款')) {
          headerRow = r
          col = c
          break
        }
      }
    }
    if (!col) throw new Error('前 15 行里找不到表头「累计欠款」')

    // 往下找该列第一个 =SUM(...) 的单元格，即合计行
    let total = null
    for (let r = headerRow + 1; r <= CONFIG.MAX_ROWS; r++) {
      const cell = sheet.Cells(r, col)
      if (/^=SUM\(/i.test(String(cell.Formula))) {
        total = { address: colName(col) + r, formula: cell.Formula, value: cell.Value2, text: cell.Text }
        break
      }
    }
    if (!total) throw new Error('「累计欠款」列里找不到 =SUM(...) 合计行')

    console.log('  合计单元格 ' + total.address + '：' + total.text + '（公式 ' + total.formula + '）')
    return { sheets: sheetNames, header: { row: headerRow, col }, total }
  } finally {
    file.close()
  }
})

return result
