// 参与者列表
let participants = [];
// 是否正在抽奖中
let isDrawing = false;
// 抽奖动画定时器
let drawingTimer = null;
// 抽奖音效
let drawSound, winSound;

// 初始化参与者列表
function initializeParticipants() {
    const count = parseInt(document.getElementById('participantCount').value);
    participants = Array.from({ length: count }, (_, i) => `参与者${i + 1}`);
    updateParticipantList();
}

// 更新参与者列表显示
function updateParticipantList() {
    const list = document.getElementById('participantList');
    list.innerHTML = '';
    
    if (participants.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'alert alert-info';
        emptyMsg.textContent = '参与者列表为空，请添加参与者或导入Excel文件';
        list.appendChild(emptyMsg);
        return;
    }
    
    participants.forEach((participant, index) => {
        const item = document.createElement('div');
        item.className = 'participant-item';
        item.innerHTML = `
            <div class="flex-grow-1">${participant}</div>
            <button class="btn btn-sm btn-outline-danger" onclick="removeParticipant(${index})">
                <i class="bi bi-trash"></i>
            </button>
        `;
        list.appendChild(item);
    });
}

// 移除参与者
function removeParticipant(index) {
    participants.splice(index, 1);
    updateParticipantList();
}

// 清空参与者列表
function clearParticipants() {
    if (participants.length === 0) return;
    
    if (confirm('确定要清空所有参与者吗？')) {
        participants = [];
        updateParticipantList();
    }
}

// 从Excel文件导入参与者
function importFromExcel(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // 获取第一个工作表
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // 转换为JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            if (jsonData.length === 0) {
                alert('Excel文件中没有找到数据！');
                return;
            }
            
            // 获取第一列的数据作为参与者名单
            const importedParticipants = [];
            jsonData.forEach(row => {
                // 获取第一列的值（忽略列名，直接获取第一个属性的值）
                const firstColumnValue = row[Object.keys(row)[0]];
                if (firstColumnValue && typeof firstColumnValue === 'string' && firstColumnValue.trim() !== '') {
                    importedParticipants.push(firstColumnValue.trim());
                } else if (firstColumnValue && typeof firstColumnValue === 'number') {
                    importedParticipants.push(String(firstColumnValue));
                }
            });
            
            if (importedParticipants.length === 0) {
                alert('未找到有效的参与者数据！请确保Excel第一列包含参与者姓名。');
                return;
            }
            
            participants = importedParticipants;
            updateParticipantList();
            
            alert(`成功导入 ${participants.length} 名参与者！`);
        } catch (error) {
            console.error('导入Excel错误:', error);
            alert('导入Excel文件失败！请确保文件格式正确。');
        }
    };
    reader.readAsArrayBuffer(file);
}

// 初始化抽奖灯光效果
function initializeLights() {
    const container = document.getElementById('lotteryDrawing');
    container.querySelectorAll('.lottery-light').forEach(light => light.remove());
    
    // 创建随机位置的灯光效果
    for (let i = 0; i < 20; i++) {
        const light = document.createElement('div');
        light.className = 'lottery-light';
        light.style.left = `${Math.random() * 100}%`;
        light.style.top = `${Math.random() * 100}%`;
        light.style.animationDelay = `${Math.random() * 2}s`;
        container.appendChild(light);
    }
}

// 创建并播放音效
function createAndPlayAudio(frequency, duration, type = 'sine') {
    if (!document.getElementById('enableSound').checked) return;
    
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gainNode.gain.value = 0.3;
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + duration);
        
        setTimeout(() => {
            oscillator.stop();
        }, duration * 1000);
    } catch (error) {
        console.error('音频播放错误:', error);
    }
}

// 播放滚动音效
function playScrollSound() {
    createAndPlayAudio(440 + Math.random() * 220, 0.1);
}

// 播放中奖音效
function playWinSound() {
    // 播放一段上升的音阶
    setTimeout(() => createAndPlayAudio(523.25, 0.2, 'sine'), 0);    // C5
    setTimeout(() => createAndPlayAudio(587.33, 0.2, 'sine'), 200);  // D5
    setTimeout(() => createAndPlayAudio(659.25, 0.2, 'sine'), 400);  // E5
    setTimeout(() => createAndPlayAudio(698.46, 0.2, 'sine'), 600);  // F5
    setTimeout(() => createAndPlayAudio(783.99, 0.2, 'sine'), 800);  // G5
    setTimeout(() => createAndPlayAudio(880.00, 0.5, 'sine'), 1000); // A5
    setTimeout(() => createAndPlayAudio(987.77, 0.8, 'sine'), 1500); // B5
}

// 开始抽奖
function startLottery() {
    if (isDrawing) return;
    
    const winnerCount = parseInt(document.getElementById('winnerCount').value);
    const prizeName = document.getElementById('prizeName').value.trim() || '奖品';
    
    if (participants.length === 0) {
        alert('请先添加参与者！');
        return;
    }
    
    if (winnerCount > participants.length) {
        alert('中奖人数不能大于参与人数！');
        return;
    }
    
    isDrawing = true;
    
    // 初始化抽奖动画
    const drawingContainer = document.getElementById('lotteryDrawing');
    const drawingName = document.getElementById('drawingName');
    
    initializeLights();
    drawingContainer.style.display = 'flex';
    
    // 快速切换显示参与者名字
    let switchCount = 0;
    const maxSwitches = 30 + Math.floor(Math.random() * 20); // 随机30-50次切换
    const switchInterval = 100; // 初始切换间隔（毫秒）
    
    const tempParticipants = [...participants];
    const winners = [];
    
    // 抽奖动画函数
    function drawingAnimation() {
        // 随机选择一个参与者
        const randomIndex = Math.floor(Math.random() * tempParticipants.length);
        const currentName = tempParticipants[randomIndex];
        
        // 显示名称
        drawingName.textContent = currentName;
        
        // 播放滚动音效
        playScrollSound();
        
        switchCount++;
        
        // 如果未达到最大切换次数，继续动画
        if (switchCount < maxSwitches) {
            // 计算下一次切换的延迟，逐渐变慢
            let nextDelay = switchInterval;
            if (switchCount > maxSwitches * 0.7) {
                // 在70%之后开始减慢
                const progress = (switchCount - maxSwitches * 0.7) / (maxSwitches * 0.3);
                nextDelay = switchInterval + progress * 400; // 最高延迟到500ms
            }
            
            drawingTimer = setTimeout(drawingAnimation, nextDelay);
        } else {
            // 动画结束，选择获奖者
            for (let i = 0; i < winnerCount; i++) {
                if (tempParticipants.length > 0) {
                    const winnerIndex = Math.floor(Math.random() * tempParticipants.length);
                    winners.push(tempParticipants.splice(winnerIndex, 1)[0]);
                }
            }
            
            // 等待一小段时间后显示获奖结果
            setTimeout(() => {
                drawingContainer.style.display = 'none';
                showWinnerAnimation(winners, prizeName);
                isDrawing = false;
            }, 500);
        }
    }
    
    // 开始抽奖动画
    drawingAnimation();
}

// 显示中奖动画
function showWinnerAnimation(winners, prizeName) {
    const container = document.getElementById('animationContainer');
    const winnerName = document.getElementById('winnerName');
    const winnerPrize = document.getElementById('winnerPrize');
    
    // 设置中奖信息
    winnerName.textContent = winners.join('、');
    winnerPrize.textContent = `🎁 获得 ${prizeName} 🎁`;
    
    // 创建彩带效果
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        confetti.style.animationDelay = Math.random() * 2 + 's';
        container.appendChild(confetti);
    }
    
    // 播放中奖音效
    playWinSound();
    
    // 显示动画容器
    container.style.display = 'flex';
}

// 关闭动画
function closeAnimation() {
    const container = document.getElementById('animationContainer');
    container.style.display = 'none';
    
    // 清除彩带
    container.querySelectorAll('.confetti').forEach(confetti => confetti.remove());
}

// 监听Excel文件上传
document.getElementById('excelFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        importFromExcel(file);
    }
});

// 监听参与人数变化
document.getElementById('participantCount').addEventListener('change', function() {
    initializeParticipants();
});

// 页面加载时初始化
window.addEventListener('load', function() {
    initializeParticipants();
}); 