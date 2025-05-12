# AI 文本生成图像网页

## 项目简介

本项目旨在创建一个简单的网页应用，用户可以通过输入文本描述，调用火山引擎的文本生成图像 API，将文本转换为相应的图片并展示在页面上。

## 功能特性

- 用户可以输入任意文本作为图像生成的提示词（Prompt）。
- 点击"生成图片"按钮后，应用将调用火山引擎 API。
- API 返回的生成图片（或图片链接）将显示在页面上。
- 支持自定义图片尺寸和比例设置。

## 技术栈

- **前端**: HTML, CSS, JavaScript
- **API**: 火山引擎文本生成图像 API

## 文件结构

```
/
├── README.md       # 项目说明文档
├── index.html      # 网页主文件
├── style.css       # CSS 样式文件
└── script.js       # JavaScript 逻辑文件
```

## 使用方法

1.  在 `script.js` 文件中，配置你的火山引擎 API 的 Access Key ID (AK) 和 Secret Access Key (SK)。
    **重要提示：** 出于安全考虑，直接在前端暴露 AK/SK 是不安全的。在生产环境中，强烈建议将 API 调用逻辑移至后端服务器处理。
2.  用浏览器打开 `index.html` 文件。
3.  在文本框中输入你想要生成图像的描述。
4.  点击"生成图片"按钮。
5.  等待片刻，生成的图片将会显示在右侧区域。

## API 调用说明 (火山引擎)

- **请求URL**: `https://visual.volcengineapi.com/` (实际请求会带上 Action 和 Version)
- **请求方法**: POST
- **Content-Type**: `application/json`
- **认证方式**: HMAC-SHA256 签名。需要在请求头中包含 `Authorization`, `X-Date`, `X-Content-Sha256` 等字段。

### 请求体示例:

```json
{
  "req_key": "high_aes_general_v30l_zt2i",
  "prompt": "一只可爱的猫咪",
  "seed": -1,
  "scale": 2.5,
  "width": 1328,
  "height": 1328
}
```

## 注意事项

- 请确保你已经拥有有效的火山引擎 API 密钥。
- 网络请求需要一定时间，请耐心等待图片生成。
- 本项目仅为演示和学习目的，API 的具体参数和高级功能请参考官方文档进行调整。

## 后续开发建议

- **后端服务化**：将 API 调用逻辑迁移到后端，例如使用 Node.js, Python (Flask/Django) 等，以保护 API 密钥。
- **用户体验优化**：增加加载状态提示、错误处理与提示、历史记录等功能。
- **高级参数配置**：允许用户调整更多 API 参数，如图片风格、步数等。