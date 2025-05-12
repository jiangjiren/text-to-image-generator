// ----------------------------------------------------------------------------
// 警告：在生产环境中，切勿将 Access Key 和 Secret Key 硬编码在前端代码中！
// 这非常不安全，你的密钥可能会被泄露。
// 推荐做法是：创建一个后端服务来处理 API 请求和签名过程。
// 此处仅为演示目的。
// ----------------------------------------------------------------------------

// 从环境变量中获取API密钥
const AK = process.env.VOLCANO_AK || 'YOUR_ACCESS_KEY_ID';
const SK = process.env.VOLCANO_SK || 'YOUR_SECRET_ACCESS_KEY';

const API_HOST = 'visual.volcengineapi.com';
const API_SERVICE = 'cv';
const API_REGION = 'cn-north-1'; // 根据实际情况选择区域
const API_ACTION = 'CVProcess'; // 根据API文档
const API_VERSION = '2022-08-31'; // 请根据实际API版本填写

// 默认图片尺寸和比例设置
let currentWidth = 1328;
let currentHeight = 1328;
let currentRatio = "1:1";

// 获取DOM元素
const generateButton = document.getElementById('generateButton');
const promptInput = document.getElementById('promptInput');
const imageGallery = document.getElementById('imageGallery');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorDisplay = document.getElementById('errorDisplay');
const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
const aspectRatioButtons = document.querySelectorAll('.aspect-ratio-btn');

// 初始化页面
function initPage() {
    // 设置默认选中的比例按钮
    aspectRatioButtons.forEach(btn => {
        if (btn.dataset.ratio === currentRatio) {
            btn.classList.add('active');
        }
        
        // 添加点击事件
        btn.addEventListener('click', () => {
            // 移除所有按钮的active类
            aspectRatioButtons.forEach(b => b.classList.remove('active'));
            // 为当前按钮添加active类
            btn.classList.add('active');
            
            // 更新当前宽高和比例
            currentWidth = parseInt(btn.dataset.width);
            currentHeight = parseInt(btn.dataset.height);
            currentRatio = btn.dataset.ratio;
            
            // 更新输入框的值
            widthInput.value = currentWidth;
            heightInput.value = currentHeight;
        });
    });
    
    // 为宽度输入框添加事件监听
    widthInput.addEventListener('change', () => {
        currentWidth = parseInt(widthInput.value);
        // 确保宽度在有效范围内
        if (currentWidth < 512) currentWidth = 512;
        if (currentWidth > 2048) currentWidth = 2048;
        // 确保宽度是8的倍数
        currentWidth = Math.floor(currentWidth / 8) * 8;
        widthInput.value = currentWidth;
        
        // 移除所有比例按钮的active类
        aspectRatioButtons.forEach(btn => btn.classList.remove('active'));
    });
    
    // 为高度输入框添加事件监听
    heightInput.addEventListener('change', () => {
        currentHeight = parseInt(heightInput.value);
        // 确保高度在有效范围内
        if (currentHeight < 512) currentHeight = 512;
        if (currentHeight > 2048) currentHeight = 2048;
        // 确保高度是8的倍数
        currentHeight = Math.floor(currentHeight / 8) * 8;
        heightInput.value = currentHeight;
        
        // 移除所有比例按钮的active类
        aspectRatioButtons.forEach(btn => btn.classList.remove('active'));
    });
}

// 生成图片按钮点击事件
generateButton.addEventListener('click', async () => {
    const promptText = promptInput.value.trim();
    if (!promptText) {
        showError('请输入图像描述文字！');
        return;
    }

    if (AK === 'YOUR_ACCESS_KEY_ID' || SK === 'YOUR_SECRET_ACCESS_KEY') {
        showError('请在 script.js 文件中配置你的 Access Key ID 和 Secret Access Key。');
        return;
    }

    showLoading(true);
    clearError();
    clearImages();

    try {
        const requestUrl = `https://${API_HOST}/?Action=${API_ACTION}&Version=${API_VERSION}`;

        // 1. 准备请求体 (Payload)
        // 使用火山引擎通用3.0-文生图API
        // 参数说明：
        // req_key: 模型标识符
        // prompt: 用户输入的描述文字
        // seed: 随机种子，-1表示随机生成
        // scale: 提示词相关性，值越大越遵循提示词
        // width/height: 图片尺寸，必须是8的倍数
        const requestPayload = {
            req_key: "high_aes_general_v30l_zt2i", // 火山引擎通用3.0文生图模型
            prompt: promptText,     // 用户输入的描述
            seed: -1,               // 随机种子
            scale: 2.5,             // 提示词相关性
            width: currentWidth,     // 使用用户设置的宽度
            height: currentHeight,   // 使用用户设置的高度
        };
        
        console.log(`生成图片，尺寸: ${currentWidth}x${currentHeight}, 比例: ${currentRatio || '自定义'}`);
        const bodyString = JSON.stringify(requestPayload);

        // 2. 准备签名所需信息
        const httpRequestMethod = 'POST';
        const canonicalURI = '/'; // 通常是 /
        const canonicalQueryString = `Action=${API_ACTION}&Version=${API_VERSION}`; // Query 参数
        
        // 正确生成 YYYYMMDDTHHMMSSZ 格式的 UTC 时间戳 (X-Date) 和 YYYYMMDD 格式的日期 (CredentialScope)
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = (now.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = now.getUTCDate().toString().padStart(2, '0');
        const hours = now.getUTCHours().toString().padStart(2, '0');
        const minutes = now.getUTCMinutes().toString().padStart(2, '0');
        const seconds = now.getUTCSeconds().toString().padStart(2, '0');

        const isoDate = `${year}${month}${day}T${hours}${minutes}${seconds}Z`; // 格式如 20240510T023043Z
        const shortDate = `${year}${month}${day}`;

        const hashedPayload = CryptoJS.SHA256(bodyString).toString(CryptoJS.enc.Hex);

        // 3. 构建规范请求 (Canonical Request)
        const canonicalHeaders = `content-type:application/json\nhost:${API_HOST}\nx-content-sha256:${hashedPayload}\nx-date:${isoDate}\n`;
        const signedHeaders = 'content-type;host;x-content-sha256;x-date';
        const canonicalRequest = 
            `${httpRequestMethod}\n` +
            `${canonicalURI}\n` +
            `${canonicalQueryString}\n` +
            `${canonicalHeaders}\n` +
            `${signedHeaders}\n` +
            `${hashedPayload}`;

        // 4. 计算签名 (Signature)
        const hashedCanonicalRequest = CryptoJS.SHA256(canonicalRequest).toString(CryptoJS.enc.Hex);
        const stringToSign = 
            `HMAC-SHA256\n` +
            `${isoDate}\n` +
            `${shortDate}/${API_REGION}/${API_SERVICE}/request\n` +
            `${hashedCanonicalRequest}`;

        const kDate = CryptoJS.HmacSHA256(shortDate, SK); // SK 是 SecretKey
        const kRegion = CryptoJS.HmacSHA256(API_REGION, kDate);
        const kService = CryptoJS.HmacSHA256(API_SERVICE, kRegion);
        const kSigning = CryptoJS.HmacSHA256('request', kService);
        const signature = CryptoJS.HmacSHA256(stringToSign, kSigning).toString(CryptoJS.enc.Hex);

        // 5. 构建 Authorization Header
        const authorizationHeader = 
            `HMAC-SHA256 Credential=${AK}/${shortDate}/${API_REGION}/${API_SERVICE}/request, ` +
            `SignedHeaders=${signedHeaders}, Signature=${signature}`;

        // 6. 发送请求
        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Date': isoDate,
                'X-Content-Sha256': hashedPayload,
                'Authorization': authorizationHeader,
                'Host': API_HOST // Host header 也是必须的
            },
            body: bodyString
        });

        showLoading(false);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            console.error('API Error Response:', errorData);
            let errorMessage = `API 请求失败，状态码: ${response.status}`;
            if (errorData && errorData.ResponseMetadata && errorData.ResponseMetadata.Error) {
                errorMessage += `\n错误类型: ${errorData.ResponseMetadata.Error.Code}`; 
                errorMessage += `\n错误信息: ${errorData.ResponseMetadata.Error.Message}`;
            } else if (errorData && errorData.message) {
                errorMessage += `\n信息: ${errorData.message}`;
            }
            showError(errorMessage);
            return;
        }

        const result = await response.json();
        console.log('API Success Response:', result);
        console.log('完整API响应:', JSON.stringify(result, null, 2));

        // ---- 详细日志诊断开始 ----
        console.log('诊断日志：开始处理 API 响应。');
        
        // 检查所有可能的响应格式
        if (result.ResponseMetadata && result.ResponseMetadata.Error) {
            console.log('诊断日志：进入 Volcengine 标准错误处理。');
            showError(`API 返回错误: ${result.ResponseMetadata.Error.Code} - ${result.ResponseMetadata.Error.Message}`);
        } 
        // 检查 Result.image_list 格式 (部署版本中使用的格式)
        else if (result.Result && result.Result.image_list && result.Result.image_list.length > 0) {
            console.log('诊断日志：检测到 Result.image_list 格式。');
            result.Result.image_list.forEach((imageData, index) => {
                // 创建图片容器
                const imageContainer = document.createElement('div');
                imageContainer.className = 'image-container';
                
                // 创建图片元素
                const img = document.createElement('img');
                img.className = 'generated-image';
                img.src = `data:image/png;base64,${imageData.image}`;
                img.alt = `生成的图片 ${index + 1}`;
                
                // 添加点击事件，放大查看图片
                img.addEventListener('click', () => {
                    showLightbox(img.src, img.alt);
                });
                
                // 将图片添加到容器
                imageContainer.appendChild(img);
                
                // 添加到画廊
                imageGallery.appendChild(imageContainer);
            });
        }
        // 检查 data.binary_data_base64 格式
        else if (result.code === 10000 && result.data && result.data.binary_data_base64) {
            console.log('诊断日志：检测到成功 code (10000) 并且 result.data.binary_data_base64 存在。');
            console.log('诊断日志：result.data.binary_data_base64 的值:', result.data.binary_data_base64);
            console.log('诊断日志：Array.isArray(result.data.binary_data_base64)?', Array.isArray(result.data.binary_data_base64));
            console.log('诊断日志：result.data.binary_data_base64.length:', result.data.binary_data_base64 ? result.data.binary_data_base64.length : 'undefined');

            if (Array.isArray(result.data.binary_data_base64) && result.data.binary_data_base64.length > 0) {
                console.log('诊断日志：确认 binary_data_base64 是一个非空数组，准备显示图片。');
                result.data.binary_data_base64.forEach((base64Image, index) => {
                    console.log(`诊断日志：正在处理第 ${index + 1} 张图片的 Base64 数据。长度: ${base64Image ? base64Image.length : 'null'}`);
                    if (!base64Image || base64Image.trim() === '') {
                        console.warn(`诊断日志：第 ${index + 1} 张图片的 Base64 数据为空或无效，跳过。`);
                        return; // 跳过空的 base64 字符串
                    }
                    
                    // 创建图片容器
                    const imageContainer = document.createElement('div');
                    imageContainer.className = 'image-container';
                    
                    // 创建缩略图
                    const thumbnailElement = document.createElement('img');
                    thumbnailElement.className = 'thumbnail';
                    thumbnailElement.alt = `${promptText}`;
                    
                    // 创建下载按钮
                    const downloadButton = document.createElement('button');
                    downloadButton.className = 'download-btn';
                    downloadButton.innerHTML = '<i class="download-icon"></i>下载';
                    
                    // 添加到容器
                    imageContainer.appendChild(thumbnailElement);
                    imageContainer.appendChild(downloadButton);
                    
                    // 设置图片源（先尝试JPEG）
                    const imageDataUrl = `data:image/jpeg;base64,${base64Image}`;
                    thumbnailElement.src = imageDataUrl;
                    
                    // 为缩略图添加点击事件，显示大图
                    thumbnailElement.addEventListener('click', () => {
                        showLightbox(imageDataUrl, promptText);
                    });
                    
                    // 为下载按钮添加点击事件
                    downloadButton.addEventListener('click', (e) => {
                        e.stopPropagation(); // 防止触发缩略图的点击事件
                        downloadImage(imageDataUrl, `AI生成图片_${new Date().getTime()}.jpg`);
                    });
                    
                    // 错误处理
                    thumbnailElement.onerror = function() {
                        console.warn(`尝试以 JPEG 格式加载图片失败，尝试 PNG 格式`);
                        const pngDataUrl = `data:image/png;base64,${base64Image}`;
                        thumbnailElement.src = pngDataUrl;
                        
                        // 更新点击和下载事件中的URL
                        thumbnailElement.onclick = () => showLightbox(pngDataUrl, promptText);
                        downloadButton.onclick = (e) => {
                            e.stopPropagation();
                            downloadImage(pngDataUrl, `AI生成图片_${new Date().getTime()}.png`);
                        };
                        
                        thumbnailElement.onerror = function() {
                            console.error(`尝试以 PNG 格式加载图片也失败了`);
                            thumbnailElement.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="%23f44336" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>';
                            thumbnailElement.alt = '图片加载失败';
                            downloadButton.disabled = true;
                        };
                    };
                    
                    // 添加到画廊
                    imageGallery.appendChild(imageContainer);
                });
            } else {
                console.log('诊断日志：binary_data_base64 不是预期的非空数组。');
                showError('API成功返回，但图片数据格式不正确 (binary_data_base64)。请检查控制台。');
            }
        } 
        // 检查 data.image_urls 格式
        else if (result.data && result.data.image_urls && result.data.image_urls.length > 0) {
            console.log('诊断日志：进入 image_urls 处理逻辑 (回退方案)。');
            result.data.image_urls.forEach(imageUrl => {
                // 创建图片容器
                const imageContainer = document.createElement('div');
                imageContainer.className = 'image-container';
                
                // 创建缩略图
                const thumbnailElement = document.createElement('img');
                thumbnailElement.className = 'thumbnail';
                thumbnailElement.src = imageUrl;
                thumbnailElement.alt = promptText;
                
                // 创建下载按钮
                const downloadButton = document.createElement('button');
                downloadButton.className = 'download-btn';
                downloadButton.innerHTML = '<i class="download-icon"></i>下载';
                
                // 添加到容器
                imageContainer.appendChild(thumbnailElement);
                imageContainer.appendChild(downloadButton);
                
                // 为缩略图添加点击事件，显示大图
                thumbnailElement.addEventListener('click', () => {
                    showLightbox(imageUrl, promptText);
                });
                
                // 为下载按钮添加点击事件
                downloadButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // 对于URL，我们需要先下载图片再转为blob
                    fetch(imageUrl)
                        .then(response => response.blob())
                        .then(blob => {
                            const url = window.URL.createObjectURL(blob);
                            downloadImage(url, `AI生成图片_${new Date().getTime()}.jpg`);
                            window.URL.revokeObjectURL(url);
                        })
                        .catch(error => {
                            console.error('下载图片失败:', error);
                        });
                });
                
                // 添加到画廊
                imageGallery.appendChild(imageContainer);
            });
        } 
        // 检查 data.image_base64 格式
        else if (result.data && result.data.image_base64 && result.data.image_base64.length > 0) {
            console.log('诊断日志：进入 image_base64 处理逻辑 (回退方案)。');
            result.data.image_base64.forEach(base64Image => {
                // 创建图片容器
                const imageContainer = document.createElement('div');
                imageContainer.className = 'image-container';
                
                // 创建缩略图
                const thumbnailElement = document.createElement('img');
                thumbnailElement.className = 'thumbnail';
                thumbnailElement.alt = promptText;
                
                // 创建下载按钮
                const downloadButton = document.createElement('button');
                downloadButton.className = 'download-btn';
                downloadButton.innerHTML = '<i class="download-icon"></i>下载';
                
                // 添加到容器
                imageContainer.appendChild(thumbnailElement);
                imageContainer.appendChild(downloadButton);
                
                // 设置图片源
                const imageDataUrl = `data:image/jpeg;base64,${base64Image}`;
                thumbnailElement.src = imageDataUrl;
                
                // 为缩略图添加点击事件，显示大图
                thumbnailElement.addEventListener('click', () => {
                    showLightbox(imageDataUrl, promptText);
                });
                
                // 为下载按钮添加点击事件
                downloadButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    downloadImage(imageDataUrl, `AI生成图片_${new Date().getTime()}.jpg`);
                });
                
                // 添加到画廊
                imageGallery.appendChild(imageContainer);
            });
        } 
        // 如果以上所有格式都不匹配
        else {
            console.log('诊断日志：无法识别的成功响应格式。');
            showError('API成功返回，但无法识别图片数据格式。请检查控制台。');
        }
        // ---- 详细日志诊断结束 ----
    } catch (error) {
        showLoading(false);
        console.error('请求过程中发生错误:', error);
        showError(`请求过程中发生错误: ${error.message || error}`);
    }
});

function showLoading(isLoading) {
    loadingIndicator.style.display = isLoading ? 'block' : 'none';
    generateButton.disabled = isLoading;
}

function showError(message) {
    errorDisplay.textContent = message;
    errorDisplay.style.display = 'block';
}

function clearError() {
    errorDisplay.textContent = '';
    errorDisplay.style.display = 'none';
}

function clearImages() {
    imageGallery.innerHTML = '';
}

// 创建并显示灯箱效果（放大查看图片）
function showLightbox(imageUrl, altText) {
    // 创建灯箱容器
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    
    // 创建内容容器
    const lightboxContent = document.createElement('div');
    lightboxContent.className = 'lightbox-content';
    
    // 创建图片元素
    const img = document.createElement('img');
    img.className = 'lightbox-image';
    img.src = imageUrl;
    img.alt = altText;
    
    // 创建关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(lightbox);
    });
    
    // 创建图片说明
    const caption = document.createElement('div');
    caption.className = 'lightbox-caption';
    caption.textContent = altText;
    
    // 组装灯箱
    lightboxContent.appendChild(img);
    lightboxContent.appendChild(closeBtn);
    lightboxContent.appendChild(caption);
    lightbox.appendChild(lightboxContent);
    
    // 添加到页面
    document.body.appendChild(lightbox);
    
    // 显示灯箱
    setTimeout(() => {
        lightbox.classList.add('active');
    }, 10);
    
    // 点击灯箱背景关闭
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            document.body.removeChild(lightbox);
        }
    });
}

// 下载图片函数
function downloadImage(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 提醒用户配置 AK/SK
if (AK === 'YOUR_ACCESS_KEY_ID' || SK === 'YOUR_SECRET_ACCESS_KEY') {
    showError('重要提示：请打开 script.js 文件，将 AK 和 SK 替换为你的火山引擎 Access Key ID 和 Secret Access Key。否则程序无法工作。');
}

// 初始化页面
initPage();
