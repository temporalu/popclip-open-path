# Open Path — PopClip 路径直达扩展

选中一段 macOS 文件路径，一键在**访达（Finder）**中打开；**按住 ⇧ Shift 再点击**，则打开一个新的 **iTerm2**（优先）或 **Terminal** 窗口并 `cd` 到该路径。

## 功能

| 操作 | 效果 |
| --- | --- |
| 选中路径 → 点击 📁 按钮 | 目录：Finder 打开该目录；文件：Finder 中定位并选中该文件 |
| 选中路径 → **按住 ⇧ Shift** 点击 | 新开 iTerm2 窗口并 `cd` 到该路径（未安装 iTerm2 时用 Terminal；选中文件时 cd 到其所在目录） |

- 只有当选中的文本**确实是一个本机上存在的路径**（支持 `~/...`、绝对路径）时，按钮才会出现——这由 PopClip 内置的 `path` requirement 判断。
- 如果路径不存在，按钮不会出现。
- `.app` 应用包按"文件"处理：Finder 中定位显示，终端中打开其所在目录。

## 安装

1. 下载或 `git clone` 本仓库。
2. 双击 `OpenPath.popclipext` 文件夹，PopClip 会自动导入。
3. 因为扩展未经签名，首次安装时 PopClip 会弹出一个"未签名扩展"警告对话框，确认继续即可。
4. 首次在 iTerm2 中使用时，macOS 会请求"PopClip 想要控制 iTerm2"的自动化权限，选择允许。

要求：PopClip 2026.11（build 6285）或更高版本。

## 开发

扩展本体是 [`OpenPath.popclipext/Config.ts`](OpenPath.popclipext/Config.ts)，使用 PopClip 官方推荐的 TypeScript 模块格式（PopClip 自带 TS 转译，无需构建步骤）。

```bash
# 类型检查（基于 @popclip/types）
npm install
npm run typecheck

# 在 PopClip 官方测试 harness 中运行单元测试
cd OpenPath.popclipext
/Applications/PopClip.app/Contents/MacOS/PopClip run Config.ts test

# 仅检查扩展能否正常加载
/Applications/PopClip.app/Contents/MacOS/PopClip run Config.ts
```

## 许可

[MIT](LICENSE)
