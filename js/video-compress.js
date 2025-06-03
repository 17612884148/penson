/**
 * 视频压缩工具
 * 使用FFmpeg.js库在浏览器中实现视频压缩功能
 */

// DOM 元素
const elements = {
    uploadContainer: document.getElementById('uploadContainer'),
    videoFile: document.getElementById('videoFile'),
    originalVideo: document.getElementById('originalVideo'),
    compressedVideo: document.getElementById('compressedVideo'),
    originalInfo: document.getElementById('originalInfo'),
    compressedInfo: document.getElementById('compressedInfo'),
    compressBtn: document.getElementById('compressBtn'),
    progressContainer: document.getElementById('progressContainer'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    downloadBtn: document.getElementById('downloadBtn'),
    downloadContainer: document.getElementById('downloadContainer'),
    compressionStats: document.getElementById('compressionStats'),
    originalSize: document.getElementById('originalSize'),
    compressedSize: document.getElementById('compressedSize'),
    sizeDifference: document.getElementById('sizeDifference'),
    bitrateRange: document.getElementById('bitrateRange'),
    bitrateValue: document.getElementById('bitrateValue'),
    resolutionSelect: document.getElementById('resolutionSelect'),
    formatSelect: document.getElementById('formatSelect'),
    removeAudio: document.getElementById('removeAudio'),
    fastCompress: document.getElementById('fastCompress'),
    sabWarning: document.getElementById('sab-warning') || { style: { display: 'none' } },
    ffmpegError: document.getElementById('ffmpeg-error')
};

// 全局变量
let originalFile = null;
let compressedBlob = null;
let ffmpeg = null;
let fileName = '';
let fileExtension = '';
let isProcessing = false;
let originalFileSize = 0;
let isFFmpegLoaded = false;
let isLegacyMode = false; // 标记是否使用兼容模式

// 检查环境支持
function checkEnvironmentSupport() {
    // 检查SharedArrayBuffer支持情况
    const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
    console.log('SharedArrayBuffer支持情况:', hasSharedArrayBuffer);
    
    // 检查WebAssembly支持情况
    const hasWebAssembly = typeof WebAssembly !== 'undefined';
    console.log('WebAssembly支持情况:', hasWebAssembly);
    
    // 检查跨源隔离状态
    const isCrossOriginIsolated = window.crossOriginIsolated;
    console.log('跨源隔离状态:', isCrossOriginIsolated);
    
    return {
        hasSharedArrayBuffer,
        hasWebAssembly,
        isCrossOriginIsolated
    };
}

// 初始化 FFmpeg
async function initFFmpeg() {
    // 设置进度显示
    elements.progressContainer.style.display = 'block';
    elements.progressText.textContent = '正在加载视频处理库...';
    elements.progressBar.style.width = '0%';
    
    try {
        // 检查浏览器环境支持情况
        const { hasSharedArrayBuffer, hasWebAssembly } = checkEnvironmentSupport();
        
        if (!hasWebAssembly) {
            throw new Error('您的浏览器不支持WebAssembly，无法使用此功能。请使用最新版Chrome、Firefox或Edge浏览器。');
        }
        
        // 检查FFmpeg对象是否存在
        if (typeof FFmpeg === 'undefined' || typeof FFmpeg.createFFmpeg === 'undefined') {
            throw new Error('未能加载FFmpeg库，请确保网络连接正常并刷新页面重试');
        }
        
        // 如果不支持SharedArrayBuffer，使用兼容模式
        if (!hasSharedArrayBuffer) {
            console.log('SharedArrayBuffer不可用，使用兼容模式');
            isLegacyMode = true;
            
            // 显示兼容模式警告
            if (elements.sabWarning) {
                elements.sabWarning.style.display = 'block';
            }
            
            // 创建FFmpeg实例(兼容模式)
            ffmpeg = FFmpeg.createFFmpeg({ 
                log: true,
                progress: handleFFmpegProgress,
                corePath: 'https://unpkg.com/@ffmpeg/core@0.8.5/dist/ffmpeg-core.js', // 使用旧版核心库
                // 限制线程数量以适应单线程模式
                threads: 1
            });
        } else {
            // 创建FFmpeg实例(标准模式)
            ffmpeg = FFmpeg.createFFmpeg({ 
                log: true,
                progress: handleFFmpegProgress,
                // 不指定corePath，让它自动从CDN加载
                cors: true // 启用CORS支持
            });
        }
        
        // 修改加载过程，增加进度显示
        let loadingTimeout = setTimeout(() => {
            elements.progressText.textContent = '加载视频处理库中，请耐心等待...';
            elements.progressBar.style.width = '50%';
        }, 3000);
        
        // 加载FFmpeg
        await ffmpeg.load();
        clearTimeout(loadingTimeout);
        
        console.log('FFmpeg 加载完成' + (isLegacyMode ? ' (兼容模式)' : ''));
        isFFmpegLoaded = true;
        
        // 隐藏进度条
        elements.progressContainer.style.display = 'none';
        
        // 启用压缩按钮
        elements.compressBtn.disabled = false;
        
    } catch (error) {
        console.error('FFmpeg 加载失败:', error);
        
        // 显示更详细的错误信息
        let errorMessage = '加载视频处理库失败: ';
        if (error.message.includes('SharedArrayBuffer')) {
            errorMessage = '您的浏览器环境不支持SharedArrayBuffer，这是视频处理所需的关键功能。可能的解决方法：\n' +
                           '1. 使用最新版本的Chrome或Edge浏览器\n' +
                           '2. 确保网站是通过HTTPS访问的\n' +
                           '3. 尝试其他浏览器';
                           
            // 显示SharedArrayBuffer错误专用UI
            if (elements.sabWarning) {
                elements.sabWarning.style.display = 'block';
            }
        } else if (error.message.includes('fetch')) {
            errorMessage += '网络连接问题，请检查您的网络并刷新页面重试';
        } else if (error.message.includes('WebAssembly')) {
            errorMessage += '您的浏览器不支持WebAssembly，请使用最新版Chrome、Firefox或Edge浏览器';
        } else if (error.message.includes('CORS')) {
            errorMessage += '跨域资源访问被阻止，请尝试使用其他浏览器或禁用某些浏览器扩展';
        } else {
            errorMessage += error.message;
        }
        
        alert(errorMessage);
        
        // 显示错误提示
        elements.ffmpegError.style.display = 'block';
        elements.progressContainer.style.display = 'none';
        
        // 添加重试按钮
        elements.progressText.innerHTML = `加载失败: ${error.message}<br><button class="btn btn-sm btn-warning mt-2" onclick="initFFmpeg()">点击重试</button>`;
        elements.progressBar.style.width = '100%';
        elements.progressBar.classList.remove('progress-bar-animated', 'progress-bar-striped');
        elements.progressBar.classList.add('bg-danger');
    }
}

// 页面加载时初始化 FFmpeg
window.onload = async () => {
    // 先初始化事件监听器，再加载FFmpeg
    initEventListeners();
    
    // 禁用压缩按钮，直到FFmpeg加载完成
    elements.compressBtn.disabled = true;
    
    await initFFmpeg();
};

// 初始化事件监听器
function initEventListeners() {
    // 拖放文件处理
    elements.uploadContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadContainer.classList.add('dragover');
    });

    elements.uploadContainer.addEventListener('dragleave', () => {
        elements.uploadContainer.classList.remove('dragover');
    });

    elements.uploadContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadContainer.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    // 文件选择处理
    elements.videoFile.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelect(e.target.files[0]);
        }
    });

    // 点击上传区域触发文件选择
    elements.uploadContainer.addEventListener('click', (e) => {
        // 防止点击按钮时触发
        if (!isProcessing && !e.target.closest('.btn')) {
            elements.videoFile.click();
        }
    });

    // 压缩按钮点击事件
    elements.compressBtn.addEventListener('click', () => {
        if (!isFFmpegLoaded) {
            alert('视频处理库尚未加载完成，请等待或刷新页面重试');
            return;
        }
        
        if (originalFile && !isProcessing) {
            // 在兼容模式下对大文件添加警告
            if (isLegacyMode && originalFile.size > 100 * 1024 * 1024) {
                const confirmProcess = confirm('您正在兼容模式下处理较大的视频文件(>' + formatFileSize(100 * 1024 * 1024) + ')，这可能需要较长时间并可能导致浏览器无响应。确定要继续吗？');
                if (!confirmProcess) return;
            }
            
            compressVideo();
        } else if (!originalFile) {
            alert('请先选择需要压缩的视频文件');
        }
    });

    // 下载按钮点击事件
    elements.downloadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (compressedBlob) {
            const outputFormat = elements.formatSelect.value;
            const downloadLink = URL.createObjectURL(compressedBlob);
            const a = document.createElement('a');
            a.href = downloadLink;
            a.download = `compressed_${fileName.replace(fileExtension, '')}.${outputFormat}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadLink);
        }
    });

    // 比特率滑块更新显示
    elements.bitrateRange.addEventListener('input', () => {
        elements.bitrateValue.textContent = `${elements.bitrateRange.value} kbps`;
    });
}

// 处理文件选择
function handleFileSelect(file) {
    if (!file || !file.type.startsWith('video/')) {
        alert('请选择有效的视频文件');
        return;
    }

    // 在兼容模式下，降低文件大小限制
    const sizeLimit = isLegacyMode ? 200 * 1024 * 1024 : 500 * 1024 * 1024; // 兼容模式 200MB，标准模式 500MB
    if (file.size > sizeLimit) {
        alert('文件大小超过限制（' + formatFileSize(sizeLimit) + '），请选择较小的文件' + (isLegacyMode ? '或使用支持SharedArrayBuffer的浏览器' : ''));
        return;
    }

    // 保存文件信息
    originalFile = file;
    fileName = file.name;
    fileExtension = fileName.substring(fileName.lastIndexOf('.'));
    originalFileSize = file.size;

    // 更新UI
    resetUI();
    updateOriginalInfo(file);

    // 加载视频预览
    const videoURL = URL.createObjectURL(file);
    elements.originalVideo.src = videoURL;
    elements.originalVideo.onloadedmetadata = () => {
        elements.originalVideo.play().then(() => {
            elements.originalVideo.pause();
        }).catch(err => console.log('自动播放暂停:', err));
    };
}

// 显示原始视频信息
function updateOriginalInfo(file) {
    const fileSize = formatFileSize(file.size);
    const fileType = file.type || '未知格式';
    
    const loadOriginalDuration = () => {
        const video = elements.originalVideo;
        const duration = video.duration;
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        const durationText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const width = video.videoWidth;
        const height = video.videoHeight;
        
        elements.originalInfo.innerHTML = `
            <div><strong>文件名:</strong> ${file.name}</div>
            <div><strong>大小:</strong> ${fileSize}</div>
            <div><strong>格式:</strong> ${fileType}</div>
            <div><strong>时长:</strong> ${durationText}</div>
            <div><strong>分辨率:</strong> ${width}x${height}</div>
        `;
    };
    
    elements.originalInfo.innerHTML = `
        <div><strong>文件名:</strong> ${file.name}</div>
        <div><strong>大小:</strong> ${fileSize}</div>
        <div><strong>格式:</strong> ${fileType}</div>
        <div><strong>加载中...</strong></div>
    `;
    
    elements.originalVideo.addEventListener('loadedmetadata', loadOriginalDuration, { once: true });
}

// 更新压缩后视频信息
function updateCompressedInfo(blob, videoElement) {
    const fileSize = formatFileSize(blob.size);
    const fileType = blob.type || '未知格式';
    
    const loadCompressedDuration = () => {
        const duration = videoElement.duration;
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        const durationText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const width = videoElement.videoWidth;
        const height = videoElement.videoHeight;
        
        elements.compressedInfo.innerHTML = `
            <div><strong>文件名:</strong> compressed_${fileName}</div>
            <div><strong>大小:</strong> ${fileSize}</div>
            <div><strong>格式:</strong> ${fileType}</div>
            <div><strong>时长:</strong> ${durationText}</div>
            <div><strong>分辨率:</strong> ${width}x${height}</div>
        `;
    };
    
    elements.compressedInfo.innerHTML = `
        <div><strong>文件名:</strong> compressed_${fileName}</div>
        <div><strong>大小:</strong> ${fileSize}</div>
        <div><strong>格式:</strong> ${fileType}</div>
        <div><strong>加载中...</strong></div>
    `;
    
    videoElement.addEventListener('loadedmetadata', loadCompressedDuration, { once: true });
}

// 更新压缩统计信息
function updateCompressionStats(originalSize, compressedSize) {
    elements.originalSize.textContent = formatFileSize(originalSize);
    elements.compressedSize.textContent = formatFileSize(compressedSize);
    
    const difference = originalSize - compressedSize;
    const percentage = Math.round((difference / originalSize) * 100);
    
    elements.sizeDifference.textContent = 
        `${formatFileSize(difference)} (${percentage}%)`;
    
    elements.compressionStats.style.display = 'block';
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 使用 FFmpeg 压缩视频
async function compressVideo() {
    if (!originalFile || !isFFmpegLoaded || isProcessing) {
        if (!isFFmpegLoaded) {
            alert('视频处理库尚未加载完成，请等待或刷新页面重试');
        }
        return;
    }
    
    try {
        isProcessing = true;
        showProgressUI();
        
        // 获取压缩设置
        const bitrate = elements.bitrateRange.value;
        const resolution = elements.resolutionSelect.value;
        const outputFormat = elements.formatSelect.value;
        const removeAudio = elements.removeAudio.checked;
        const fastCompress = elements.fastCompress.checked;
        
        // 在兼容模式下调整设置以减轻浏览器负担
        if (isLegacyMode) {
            // 在兼容模式下，降低比特率上限以减轻处理负担
            const maxBitrate = Math.min(bitrate, 4000); // 在兼容模式下最高4Mbps
            
            if (maxBitrate !== parseInt(bitrate)) {
                console.log(`兼容模式：将比特率从 ${bitrate}kbps 降低到 ${maxBitrate}kbps`);
            }
        }
        
        // 准备输入文件
        const inputFileName = 'input' + fileExtension;
        
        // 显示文件读取进度
        elements.progressText.textContent = '正在处理视频文件...';
        
        try {
            // 使用try/catch包装文件处理，以便捕获可能的错误
            const fileData = await fetchFile(originalFile);
            ffmpeg.FS('writeFile', inputFileName, fileData);
        } catch (fileError) {
            throw new Error('读取视频文件失败: ' + fileError.message);
        }
        
        // 准备 FFmpeg 命令
        const outputFileName = `output.${outputFormat}`;
        const ffmpegArgs = ['-i', inputFileName];
        
        // 视频编码设置 - 根据模式调整编码选项
        if (isLegacyMode) {
            // 在兼容模式下使用更通用的编码设置
            if (outputFormat === 'mp4') {
                ffmpegArgs.push('-c:v', 'mpeg4'); // 使用更轻量的MPEG-4编码
            } else {
                ffmpegArgs.push('-c:v', 'vp8'); // WebM使用VP8
            }
        } else {
            // 标准模式使用更高质量的编码
            if (outputFormat === 'mp4') {
                ffmpegArgs.push('-c:v', 'h264');
            } else {
                ffmpegArgs.push('-c:v', 'vp8');
            }
        }
        
        // 分辨率设置
        if (resolution !== 'original') {
            let scale;
            switch (resolution) {
                case '1080p': scale = 'scale=1920:-2'; break;
                case '720p': scale = 'scale=1280:-2'; break;
                case '480p': scale = 'scale=854:-2'; break;
                case '360p': scale = 'scale=640:-2'; break;
            }
            ffmpegArgs.push('-vf', scale);
        }
        
        // 比特率设置
        ffmpegArgs.push('-b:v', bitrate + 'k');
        
        // 音频设置
        if (removeAudio) {
            ffmpegArgs.push('-an');
        } else {
            if (outputFormat === 'mp4') {
                ffmpegArgs.push('-c:a', 'aac');
            } else {
                ffmpegArgs.push('-c:a', 'libvorbis');
            }
            ffmpegArgs.push('-b:a', '128k');
        }
        
        // 压缩速度设置
        if (isLegacyMode) {
            // 在兼容模式下，固定使用最快的设置
            ffmpegArgs.push('-deadline', 'realtime');
            ffmpegArgs.push('-cpu-used', '8');
        } else {
            // 标准模式根据用户选择
            if (fastCompress) {
                ffmpegArgs.push('-quality', 'fastest');
            } else {
                ffmpegArgs.push('-quality', 'good');
            }
        }
        
        // 设置像素格式
        ffmpegArgs.push('-pix_fmt', 'yuv420p');
        
        // 兼容模式下添加更多优化参数
        if (isLegacyMode) {
            // 限制关键帧间隔
            ffmpegArgs.push('-g', '30');
            
            // 禁用复杂的编码选项
            ffmpegArgs.push('-flags', '+mv4+aic-loop');
            
            // 限制编码线程
            ffmpegArgs.push('-threads', '1');
        }
        
        // 限制视频压缩时间，防止过长的处理时间
        ffmpegArgs.push('-t', '7200'); // 最长处理2小时的视频
        
        // 输出文件名
        ffmpegArgs.push(outputFileName);
        
        console.log('FFmpeg 命令:', ffmpegArgs.join(' '));
        elements.progressText.textContent = '正在压缩视频...0%';
        
        // 执行视频压缩
        try {
            await ffmpeg.run(...ffmpegArgs);
        } catch (ffmpegError) {
            throw new Error('视频压缩处理失败: ' + ffmpegError.message);
        }
        
        // 获取压缩后的文件
        let data;
        try {
            data = ffmpeg.FS('readFile', outputFileName);
        } catch (readError) {
            throw new Error('无法读取压缩后的文件: ' + readError.message);
        }
        
        const outputType = outputFormat === 'mp4' ? 'video/mp4' : 'video/webm';
        compressedBlob = new Blob([data.buffer], { type: outputType });
        
        // 检查压缩后的文件大小
        if (compressedBlob.size === 0) {
            throw new Error('压缩后的文件大小为0，压缩失败');
        }
        
        // 清理内存
        try {
            ffmpeg.FS('unlink', inputFileName);
            ffmpeg.FS('unlink', outputFileName);
        } catch (cleanupError) {
            console.warn('清理临时文件失败:', cleanupError);
            // 但不中断流程
        }
        
        // 显示压缩后的视频
        const compressedURL = URL.createObjectURL(compressedBlob);
        elements.compressedVideo.src = compressedURL;
        elements.compressedVideo.onloadedmetadata = () => {
            elements.compressedVideo.play().then(() => {
                elements.compressedVideo.pause();
            }).catch(err => console.log('自动播放暂停:', err));
        };
        
        // 更新UI
        updateCompressedInfo(compressedBlob, elements.compressedVideo);
        updateCompressionStats(originalFile.size, compressedBlob.size);
        hideProgressUI();
        showDownloadUI();
        
    } catch (error) {
        console.error('视频压缩失败:', error);
        hideProgressUI();
        
        // 显示用户友好的错误信息
        let userErrorMessage = '视频压缩失败: ';
        if (error.message.includes('memory') || error.message.includes('allocation') || error.message.includes('内存')) {
            userErrorMessage += '浏览器内存不足，请尝试压缩更小的视频或选择更低的分辨率和比特率';
        } else if (error.message.includes('codec') || error.message.includes('编码')) {
            userErrorMessage += '不支持的视频编码，请尝试其他格式的视频';
        } else if (error.message.includes('SharedArrayBuffer')) {
            userErrorMessage += '浏览器不支持SharedArrayBuffer，请更换为最新版Chrome浏览器或通过HTTPS访问';
        } else {
            userErrorMessage += error.message;
        }
        
        // 对于兼容模式的特殊提示
        if (isLegacyMode) {
            userErrorMessage += '\n\n您当前处于兼容模式，功能受限。为获得更好的体验，请使用支持SharedArrayBuffer的浏览器。';
        }
        
        alert(userErrorMessage);
        
        // 显示重试按钮
        elements.progressContainer.style.display = 'block';
        elements.progressText.innerHTML = `压缩失败: ${error.message}<br><button class="btn btn-sm btn-warning mt-2" onclick="compressVideo()">点击重试</button><button class="btn btn-sm btn-secondary ms-2" onclick="location.reload()">刷新页面</button>`;
        elements.progressBar.style.width = '100%';
        elements.progressBar.classList.remove('progress-bar-animated', 'progress-bar-striped');
        elements.progressBar.classList.add('bg-danger');
    } finally {
        isProcessing = false;
    }
}

// 显示进度UI
function showProgressUI() {
    elements.progressContainer.style.display = 'block';
    elements.compressBtn.disabled = true;
    elements.uploadContainer.style.pointerEvents = 'none';
    elements.progressBar.style.width = '0%';
    elements.progressBar.classList.add('progress-bar-animated', 'progress-bar-striped');
    elements.progressBar.classList.remove('bg-danger');
    elements.progressText.textContent = '正在压缩视频...';
}

// 隐藏进度UI
function hideProgressUI() {
    elements.progressContainer.style.display = 'none';
    elements.compressBtn.disabled = false;
    elements.uploadContainer.style.pointerEvents = 'auto';
}

// 显示下载UI
function showDownloadUI() {
    elements.downloadContainer.style.display = 'block';
}

// 重置UI
function resetUI() {
    elements.compressedVideo.src = '';
    elements.compressedInfo.innerHTML = '<p class="mb-0"><strong>压缩完成后显示信息</strong></p>';
    elements.compressionStats.style.display = 'none';
    elements.downloadContainer.style.display = 'none';
    compressedBlob = null;
}

// 处理FFmpeg的进度
function handleFFmpegProgress(progress) {
    // 处理FFmpeg进度事件
    if (progress && typeof progress.ratio !== 'undefined') {
        // 使用ratio属性，范围0-1
        const percent = Math.min(Math.round(progress.ratio * 100), 100);
        elements.progressBar.style.width = percent + '%';
        elements.progressText.textContent = `正在压缩视频...${percent}%`;
    } else if (progress && progress.time !== undefined) {
        // 使用time属性（毫秒）
        const duration = elements.originalVideo.duration;
        if (duration) {
            const percent = Math.min(Math.round((progress.time / (duration * 1000)) * 100), 100);
            elements.progressBar.style.width = percent + '%';
            elements.progressText.textContent = `正在压缩视频...${percent}%`;
        }
    }
}

// 辅助函数：获取文件数据
async function fetchFile(file) {
    try {
        // 使用现代的File API
        return new Uint8Array(await file.arrayBuffer());
    } catch (error) {
        // 兼容模式：如果arrayBuffer方法不可用
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(new Uint8Array(reader.result));
            reader.onerror = () => reject(new Error('无法读取文件：' + (reader.error ? reader.error.message : '未知错误')));
            reader.readAsArrayBuffer(file);
        });
    }
} 