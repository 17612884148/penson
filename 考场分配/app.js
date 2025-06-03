// 全局变量
let studentData = []; // 存储导入的学生数据
let configGroups = []; // 存储考场配置组
let configCounter = 1; // 用于生成配置组的唯一ID
let tempFileData = null; // 临时存储文件解析结果
let columnHeaders = []; // 存储列标题
let tempConfigData = null; // 临时存储考场配置文件解析结果
let configColumnHeaders = []; // 存储考场配置列标题
let selectedExtraColumns = []; // 存储选中的额外列

// DOM元素
const fileInput = document.getElementById('fileInput');
const importBtn = document.getElementById('importBtn');
const configFileInput = document.getElementById('configFileInput');
const importConfigBtn = document.getElementById('importConfigBtn');
const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
const roomConfig = document.getElementById('roomConfig');
const addConfigBtn = document.getElementById('addConfigBtn');
const addBatchConfigBtn = document.getElementById('addBatchConfigBtn');
const confirmBatchConfigBtn = document.getElementById('confirmBatchConfigBtn');
const applyConfigBtn = document.getElementById('applyConfigBtn');
const dataTable = document.getElementById('dataTable');
const dataTableHeader = document.getElementById('dataTableHeader');
const exportBtn = document.getElementById('exportBtn');
const columnSelectSection = document.getElementById('columnSelectSection');
const columnOptions = document.getElementById('columnOptions');
const examNumberColumnSelect = document.getElementById('examNumberColumnSelect');
const selectedColumnsDiv = document.getElementById('selectedColumns');
const confirmColumnBtn = document.getElementById('confirmColumnBtn');
const dataCounter = document.getElementById('dataCounter');
const configColumnSelectSection = document.getElementById('configColumnSelectSection');
const startRoomColumnSelect = document.getElementById('startRoomColumnSelect');
const endRoomColumnSelect = document.getElementById('endRoomColumnSelect');
const studentsPerRoomColumnSelect = document.getElementById('studentsPerRoomColumnSelect');
const confirmConfigColumnBtn = document.getElementById('confirmConfigColumnBtn');
const batchStartRoom = document.getElementById('batchStartRoom');
const batchEndRoom = document.getElementById('batchEndRoom');
const batchStudentsPerRoom = document.getElementById('batchStudentsPerRoom');
const batchConfigModal = new bootstrap.Modal(document.getElementById('batchConfigModal'), {
    keyboard: false
});

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始事件监听
    importBtn.addEventListener('click', importData);
    importConfigBtn.addEventListener('click', importConfig);
    downloadTemplateBtn.addEventListener('click', downloadConfigTemplate);
    addConfigBtn.addEventListener('click', addConfigGroup);
    confirmBatchConfigBtn.addEventListener('click', addBatchConfig);
    applyConfigBtn.addEventListener('click', applyConfig);
    exportBtn.addEventListener('click', exportData);
    confirmColumnBtn.addEventListener('click', confirmColumnSelection);
    confirmConfigColumnBtn.addEventListener('click', confirmConfigColumnSelection);
    
    // 初始化考场配置区域
    initConfigArea();
});

// 初始化考场配置区域
function initConfigArea() {
    // 清空配置区域
    const roomGroups = document.querySelectorAll('.room-group');
    if (roomGroups.length > 0) {
        roomGroups.forEach(group => {
            group.remove(); // 使用remove方法而不是removeChild
        });
    }
    
    // 添加第一个配置组
    addConfigGroupWithValues(1, 5, 30);
    
    // 更新配置组数据
    updateConfigGroups();
}

// 导入学生数据
function importData() {
    const file = fileInput.files[0];
    if (!file) {
        alert('请先选择文件');
        return;
    }
    
    // 读取并解析文件，但不立即处理数据，而是显示列选择界面
    processExcelFile(file, showMultiColumnSelection);
}

// 显示多列选择界面
function showMultiColumnSelection(jsonData) {
    // 存储临时数据
    tempFileData = jsonData;
    selectedExtraColumns = []; // 重置选中的额外列
    
    if (jsonData.length === 0) {
        alert('导入的文件没有数据');
        return;
    }
    
    // 获取列标题
    const firstRecord = jsonData[0];
    columnHeaders = Object.keys(firstRecord);
    
    // 清空考号列选择下拉框
    examNumberColumnSelect.innerHTML = '';
    
    // 为考号列下拉框添加选项
    columnHeaders.forEach(header => {
        const option = document.createElement('option');
        option.value = header;
        option.textContent = header;
        examNumberColumnSelect.appendChild(option);
    });
    
    // 自动选择第一个选项
    if (columnHeaders.length > 0) {
        examNumberColumnSelect.value = columnHeaders[0];
    }
    
    // 清空额外列选项区域
    columnOptions.innerHTML = '';
    
    // 为每个额外列创建选项
    columnHeaders.forEach(header => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'column-option';
        optionDiv.dataset.header = header;
        optionDiv.textContent = header;
        
        // 添加点击事件
        optionDiv.addEventListener('click', function() {
            toggleExtraColumn(header, this);
        });
        
        columnOptions.appendChild(optionDiv);
    });
    
    // 清空已选列区域
    updateSelectedColumnsList();
    
    // 显示列选择区域
    columnSelectSection.style.display = 'block';
}

// 切换额外列的选中状态
function toggleExtraColumn(header, element) {
    // 检查是否与考号列相同
    if (header === examNumberColumnSelect.value) {
        alert('该列已作为考号列，不能同时作为额外列');
        return;
    }
    
    const index = selectedExtraColumns.indexOf(header);
    if (index === -1) {
        // 添加到选中列表
        selectedExtraColumns.push(header);
        element.classList.add('selected');
    } else {
        // 从选中列表移除
        selectedExtraColumns.splice(index, 1);
        element.classList.remove('selected');
    }
    
    // 更新已选列显示
    updateSelectedColumnsList();
}

// 更新已选列表显示
function updateSelectedColumnsList() {
    if (selectedExtraColumns.length === 0) {
        selectedColumnsDiv.innerHTML = '<span class="text-muted">未选择额外列</span>';
        return;
    }
    
    selectedColumnsDiv.innerHTML = '';
    selectedExtraColumns.forEach(header => {
        const tag = document.createElement('span');
        tag.className = 'selected-column-tag';
        tag.innerHTML = `${header} <span class="remove-tag" data-header="${header}">&times;</span>`;
        selectedColumnsDiv.appendChild(tag);
        
        // 添加移除标签的点击事件
        const removeBtn = tag.querySelector('.remove-tag');
        removeBtn.addEventListener('click', function() {
            const headerToRemove = this.dataset.header;
            const optionElement = document.querySelector(`.column-option[data-header="${headerToRemove}"]`);
            toggleExtraColumn(headerToRemove, optionElement);
        });
    });
}

// 确认列选择
function confirmColumnSelection() {
    const selectedExamNumberColumn = examNumberColumnSelect.value;
    
    if (!selectedExamNumberColumn) {
        alert('请选择考号列');
        return;
    }
    
    // 使用选定的列处理数据
    handleMultiColumnData(tempFileData, selectedExamNumberColumn, selectedExtraColumns);
    
    // 隐藏列选择区域
    columnSelectSection.style.display = 'none';
    
    // 清空临时数据
    tempFileData = null;
}

// 更新数据计数器
function updateDataCounter() {
    dataCounter.textContent = `${studentData.length} 条记录`;
}

// 处理多列数据
function handleMultiColumnData(jsonData, examNumberColumn, extraColumns) {
    // 提取考号和额外列数据
    studentData = jsonData.map((record, index) => {
        // 创建基础数据对象
        const studentObj = {
            index: index + 1,
            examNumber: record[examNumberColumn],
            room: '' // 初始考场为空
        };
        
        // 添加额外列数据
        extraColumns.forEach(colName => {
            studentObj[colName] = record[colName];
        });
        
        return studentObj;
    });
    
    // 更新表格头部
    updateTableHeader(examNumberColumn, extraColumns);
    
    // 渲染表格
    renderTable();
    
    // 导入数据后启用导出按钮
    exportBtn.disabled = false;
    
    // 更新数据计数器
    updateDataCounter();
    
    // 构建提示消息
    let message = `成功导入${studentData.length}条学生数据，使用"${examNumberColumn}"作为考号`;
    if (extraColumns.length > 0) {
        message += `，同时导入${extraColumns.length}个额外列`;
    }
    
    alert(message);
}

// 更新表格头部，添加额外列
function updateTableHeader(examNumberColumn, extraColumns) {
    const headerRow = dataTableHeader.querySelector('tr');
    
    // 清空原有表头（保留序号、考号和考场）
    headerRow.innerHTML = `
        <th>序号</th>
        <th>${examNumberColumn}</th>
    `;
    
    // 添加额外列
    extraColumns.forEach(colName => {
        const th = document.createElement('th');
        th.textContent = colName;
        headerRow.appendChild(th);
    });
    
    // 添加考场列（始终放在最后）
    const roomTh = document.createElement('th');
    roomTh.textContent = '考场';
    headerRow.appendChild(roomTh);
}

// 渲染表格
function renderTable() {
    const tbody = dataTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    if (studentData.length === 0) {
        const emptyRow = document.createElement('tr');
        // 获取表头的列数
        const headerColumns = dataTableHeader.querySelectorAll('th').length;
        emptyRow.innerHTML = `<td colspan="${headerColumns}" class="text-center text-muted">尚未导入学生数据</td>`;
        tbody.appendChild(emptyRow);
        
        // 更新数据计数器
        updateDataCounter();
        return;
    }
    
    studentData.forEach(student => {
        const row = document.createElement('tr');
        
        // 添加序号和考号
        row.innerHTML = `
            <td>${student.index}</td>
            <td>${student.examNumber}</td>
        `;
        
        // 添加额外列
        for (const key in student) {
            if (key !== 'index' && key !== 'examNumber' && key !== 'room') {
                const td = document.createElement('td');
                td.textContent = student[key] || '';
                row.appendChild(td);
            }
        }
        
        // 添加考场列
        const roomTd = document.createElement('td');
        roomTd.textContent = student.room || '-';
        row.appendChild(roomTd);
        
        tbody.appendChild(row);
    });
    
    // 更新数据计数器
    updateDataCounter();
}

// 导出数据
function exportData() {
    if (studentData.length === 0) {
        alert('没有数据可导出');
        return;
    }
    
    try {
        // 创建导出数据对象
        const exportData = studentData.map(student => {
            // 创建基础导出对象
            const exportObj = {
                '序号': student.index,
                '考号': student.examNumber
            };
            
            // 添加额外列
            for (const key in student) {
                if (key !== 'index' && key !== 'examNumber' && key !== 'room') {
                    exportObj[key] = student[key];
                }
            }
            
            // 添加考场（始终放在最后）
            exportObj['考场'] = student.room || '';
            
            return exportObj;
        });
        
        console.log('正在导出数据:', exportData);
        
        // 创建工作表
        const ws = XLSX.utils.json_to_sheet(exportData);
        
        // 创建工作簿
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '考场分配');
        
        // 生成文件并下载
        const fileName = `考场分配_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        console.log('导出完成，文件名:', fileName);
    } catch (error) {
        console.error('导出出错:', error);
        alert('导出过程中出错：' + error.message);
    }
}

// 导入考场配置
function importConfig() {
    const file = configFileInput.files[0];
    if (!file) {
        alert('请先选择配置文件');
        return;
    }
    
    processExcelFile(file, showConfigColumnSelection);
}

// 显示考场配置列选择界面
function showConfigColumnSelection(jsonData) {
    // 存储临时数据
    tempConfigData = jsonData;
    
    if (jsonData.length === 0) {
        alert('导入的配置文件没有数据');
        return;
    }
    
    // 获取列标题
    const firstRecord = jsonData[0];
    configColumnHeaders = Object.keys(firstRecord);
    
    // 清空选择框选项
    startRoomColumnSelect.innerHTML = '';
    endRoomColumnSelect.innerHTML = '';
    studentsPerRoomColumnSelect.innerHTML = '';
    
    // 为每个下拉框添加选项
    configColumnHeaders.forEach(header => {
        const startOption = document.createElement('option');
        startOption.value = header;
        startOption.textContent = header;
        
        const endOption = document.createElement('option');
        endOption.value = header;
        endOption.textContent = header;
        
        const studentsOption = document.createElement('option');
        studentsOption.value = header;
        studentsOption.textContent = header;
        
        startRoomColumnSelect.appendChild(startOption);
        endRoomColumnSelect.appendChild(endOption);
        studentsPerRoomColumnSelect.appendChild(studentsOption);
    });
    
    // 尝试自动选择合适的列
    autoSelectConfigColumns();
    
    // 显示配置列选择区域
    configColumnSelectSection.style.display = 'block';
}

// 自动选择配置列
function autoSelectConfigColumns() {
    // 根据列名自动选择可能的匹配列
    configColumnHeaders.forEach(header => {
        const headerLower = header.toLowerCase();
        
        // 起始考场号
        if (headerLower.includes('起始') || 
            headerLower.includes('开始') || 
            headerLower.includes('start') || 
            headerLower.includes('first')) {
            startRoomColumnSelect.value = header;
        }
        
        // 结束考场号
        if (headerLower.includes('结束') || 
            headerLower.includes('终止') || 
            headerLower.includes('end') || 
            headerLower.includes('last')) {
            endRoomColumnSelect.value = header;
        }
        
        // 每考场人数
        if (headerLower.includes('人数') || 
            headerLower.includes('学生') || 
            headerLower.includes('per') || 
            headerLower.includes('students')) {
            studentsPerRoomColumnSelect.value = header;
        }
    });
    
    // 如果只有三列，按顺序选择
    if (configColumnHeaders.length === 3) {
        startRoomColumnSelect.value = configColumnHeaders[0];
        endRoomColumnSelect.value = configColumnHeaders[1];
        studentsPerRoomColumnSelect.value = configColumnHeaders[2];
    }
}

// 确认配置列选择
function confirmConfigColumnSelection() {
    const startRoomColumn = startRoomColumnSelect.value;
    const endRoomColumn = endRoomColumnSelect.value;
    const studentsPerRoomColumn = studentsPerRoomColumnSelect.value;
    
    if (!startRoomColumn || !endRoomColumn || !studentsPerRoomColumn) {
        alert('请选择所有必要的列');
        return;
    }
    
    // 使用选定的列处理配置数据
    handleConfigDataWithSelectedColumns(tempConfigData, startRoomColumn, endRoomColumn, studentsPerRoomColumn);
    
    // 隐藏配置列选择区域
    configColumnSelectSection.style.display = 'none';
    
    // 清空临时数据
    tempConfigData = null;
}

// 使用选定的列处理配置数据
function handleConfigDataWithSelectedColumns(jsonData, startRoomColumn, endRoomColumn, studentsPerRoomColumn) {
    // 清除现有配置组
    clearConfigGroups();
    
    try {
        // 处理每一行配置数据
        jsonData.forEach((record, index) => {
            const startRoom = parseInt(record[startRoomColumn]);
            const endRoom = parseInt(record[endRoomColumn]);
            const studentsPerRoom = parseInt(record[studentsPerRoomColumn]);
            
            // 验证数据有效性
            if (isNaN(startRoom) || isNaN(endRoom) || isNaN(studentsPerRoom)) {
                throw new Error(`第${index + 1}行数据格式无效`);
            }
            
            if (startRoom > endRoom) {
                throw new Error(`第${index + 1}行起始考场号大于结束考场号`);
            }
            
            if (studentsPerRoom <= 0) {
                throw new Error(`第${index + 1}行每考场人数必须大于0`);
            }
            
            // 添加配置组
            addConfigGroupWithValues(startRoom, endRoom, studentsPerRoom);
        });
        
        // 更新配置组数据
        updateConfigGroups();
        
        alert(`成功导入${jsonData.length}条考场配置`);
    } catch (error) {
        console.error('处理配置数据出错:', error);
        alert('处理配置数据出错: ' + error.message);
    }
}

// 处理Excel文件
function processExcelFile(file, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // 转换为JSON数组
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            // 检查是否有数据
            if (jsonData.length === 0) {
                alert('导入的文件没有数据');
                return;
            }
            
            // 调用回调函数处理数据
            callback(jsonData);
            
        } catch (error) {
            console.error('导入数据出错:', error);
            alert('导入数据出错，请检查文件格式');
        }
    };
    
    reader.onerror = function() {
        alert('读取文件时出错');
    };
    
    reader.readAsBinaryString(file);
}

// 处理学生数据 (只用于兼容，新流程不直接调用)
function handleStudentData(jsonData) {
    // 获取第一条数据的键
    const firstRecord = jsonData[0];
    const keys = Object.keys(firstRecord);
    
    // 假设第一列是考号（无论列名是什么）
    const examNumberKey = keys[0];
    
    // 调用新函数处理数据，不导入额外列
    handleMultiColumnData(jsonData, examNumberKey, []);
}

// 使用选定的列处理学生数据 (兼容原有代码)
function handleStudentDataWithSelectedColumn(jsonData, selectedHeader) {
    // 调用新的多列处理函数，但不添加额外列
    handleMultiColumnData(jsonData, selectedHeader, []);
}

// 处理配置数据 (只用于兼容，新流程不直接调用)
function handleConfigData(jsonData) {
    // 获取第一条数据的键
    const firstRecord = jsonData[0];
    const keys = Object.keys(firstRecord);
    
    // 假设前三列分别是起始考场号、结束考场号和每考场人数
    const startRoomKey = keys[0];
    const endRoomKey = keys.length > 1 ? keys[1] : keys[0];
    const studentsPerRoomKey = keys.length > 2 ? keys[2] : keys[0];
    
    // 调用新函数处理数据
    handleConfigDataWithSelectedColumns(jsonData, startRoomKey, endRoomKey, studentsPerRoomKey);
}

// 下载配置模板
function downloadConfigTemplate() {
    // 创建示例数据
    const templateData = [
        { '起始考场号': 1, '结束考场号': 5, '每考场人数': 30 },
        { '起始考场号': 6, '结束考场号': 10, '每考场人数': 35 }
    ];
    
    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // 创建工作簿
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '考场配置模板');
    
    // 生成文件并下载
    XLSX.writeFile(wb, '考场配置模板.xlsx');
}

// 清除所有配置组
function clearConfigGroups() {
    const roomGroups = document.querySelectorAll('.room-group');
    
    // 删除所有配置组
    if (roomGroups.length > 0) {
        roomGroups.forEach(group => {
            group.remove(); // 使用remove方法而不是removeChild
        });
    }
}

// 批量添加考场
function addBatchConfig() {
    const startRoom = parseInt(batchStartRoom.value) || 1;
    const endRoom = parseInt(batchEndRoom.value) || 10;
    const studentsPerRoom = parseInt(batchStudentsPerRoom.value) || 30;
    
    if (startRoom > endRoom) {
        alert('起始考场号不能大于结束考场号');
        return;
    }
    
    if (studentsPerRoom <= 0) {
        alert('每考场人数必须大于0');
        return;
    }
    
    // 清除现有配置组
    clearConfigGroups();
    
    // 添加批量配置
    addConfigGroupWithValues(startRoom, endRoom, studentsPerRoom);
    
    // 更新配置组数据
    updateConfigGroups();
    
    // 关闭模态框
    batchConfigModal.hide();
    
    alert(`已批量添加考场配置：第${startRoom}到第${endRoom}考场，每考场${studentsPerRoom}人`);
}

// 添加考场配置组（带预设值）
function addConfigGroupWithValues(startRoom, endRoom, studentsPerRoom) {
    const roomGroupDiv = document.createElement('div');
    roomGroupDiv.className = 'room-group';
    roomGroupDiv.innerHTML = `
        <div class="room-setting">
            <label>第</label>
            <input type="number" class="start-room form-control" value="${startRoom}" min="1"> 
            <label>到第</label>
            <input type="number" class="end-room form-control" value="${endRoom}" min="1"> 
            <label>考场，每考场</label>
            <input type="number" class="students-per-room form-control" value="${studentsPerRoom}" min="1"> 
            <label>名学生</label>
            <button class="delete-config-btn btn btn-outline-danger btn-sm">
                <i class="bi bi-trash"></i> 删除
            </button>
        </div>
    `;
    
    // 添加到配置区域 - 修复插入位置的错误
    roomConfig.appendChild(roomGroupDiv);
    
    // 绑定删除按钮事件
    const deleteBtn = roomGroupDiv.querySelector('.delete-config-btn');
    deleteBtn.addEventListener('click', function() {
        // 删除前检查是否为最后一个配置组
        const roomGroups = document.querySelectorAll('.room-group');
        if (roomGroups.length <= 1) {
            if (confirm('这是最后一个配置组，确定要删除吗？删除后将自动添加一个新的配置组。')) {
                roomGroupDiv.remove(); // 使用remove而不是removeChild
                // 添加一个新的默认配置组
                addConfigGroupWithValues(1, 5, 30);
                updateConfigGroups();
            }
        } else {
            roomGroupDiv.remove(); // 使用remove而不是removeChild
            updateConfigGroups();
        }
    });
}

// 添加考场配置组
function addConfigGroup() {
    // 获取最后一个配置组的结束考场号
    const roomGroups = document.querySelectorAll('.room-group');
    let lastEndRoom = 0;
    
    if (roomGroups.length > 0) {
        const lastGroup = roomGroups[roomGroups.length - 1];
        const endRoomInput = lastGroup.querySelector('.end-room');
        lastEndRoom = parseInt(endRoomInput.value) || 0;
    }
    
    // 创建新配置组，起始考场号为最后一个考场号+1
    addConfigGroupWithValues(lastEndRoom + 1, lastEndRoom + 5, 30);
    
    updateConfigGroups();
}

// 更新考场配置组数据
function updateConfigGroups() {
    const roomGroups = document.querySelectorAll('.room-group');
    
    // 显示所有删除按钮
    document.querySelectorAll('.delete-config-btn').forEach(btn => {
        btn.style.display = 'inline-block';
    });
    
    // 重置配置组数据
    configGroups = [];
    
    // 收集所有配置组数据
    roomGroups.forEach((group, index) => {
        const startRoom = parseInt(group.querySelector('.start-room').value) || 1;
        const endRoom = parseInt(group.querySelector('.end-room').value) || 1;
        const studentsPerRoom = parseInt(group.querySelector('.students-per-room').value) || 30;
        
        configGroups.push({
            id: index + 1,
            startRoom: startRoom,
            endRoom: endRoom,
            studentsPerRoom: studentsPerRoom
        });
    });
}

// 应用考场配置
function applyConfig() {
    if (studentData.length === 0) {
        alert('请先导入学生数据');
        return;
    }
    
    // 更新配置组数据
    updateConfigGroups();
    
    if (configGroups.length === 0) {
        alert('请至少添加一个考场配置');
        return;
    }
    
    // 验证配置
    let valid = true;
    let totalCapacity = 0;
    let usedRooms = new Set();
    
    // 检查考场重叠和计算总容量
    for (const config of configGroups) {
        if (config.startRoom > config.endRoom) {
            alert(`配置错误：起始考场(${config.startRoom})不能大于结束考场(${config.endRoom})`);
            valid = false;
            break;
        }
        
        // 检查考场号是否重叠
        for (let room = config.startRoom; room <= config.endRoom; room++) {
            if (usedRooms.has(room)) {
                alert(`配置错误：考场 ${room} 在多个配置组中重复出现`);
                valid = false;
                break;
            }
            usedRooms.add(room);
        }
        
        if (!valid) break;
        
        // 计算该配置组的容量
        const rooms = config.endRoom - config.startRoom + 1;
        totalCapacity += rooms * config.studentsPerRoom;
    }
    
    if (!valid) return;
    
    // 检查总容量是否足够
    if (totalCapacity < studentData.length) {
        if (!confirm(`警告：当前配置的考场总容量(${totalCapacity})小于学生总数(${studentData.length})，是否继续？`)) {
            return;
        }
    }
    
    // 分配考场
    let studentIndex = 0;
    
    // 遍历每个配置组
    for (const config of configGroups) {
        // 遍历该配置组的每个考场
        for (let room = config.startRoom; room <= config.endRoom; room++) {
            // 分配该考场的学生
            for (let i = 0; i < config.studentsPerRoom; i++) {
                if (studentIndex < studentData.length) {
                    studentData[studentIndex].room = room;
                    studentIndex++;
                } else {
                    // 所有学生都已分配
                    break;
                }
            }
            
            if (studentIndex >= studentData.length) {
                break; // 所有学生都已分配
            }
        }
        
        if (studentIndex >= studentData.length) {
            break; // 所有学生都已分配
        }
    }
    
    // 更新表格显示
    renderTable();
    
    // 确保导出按钮启用
    exportBtn.disabled = false;
    
    // 显示成功消息
    alert(`已为${studentIndex}名学生分配考场`);
}

// 扩展选择器以支持包含文本的查询
Element.prototype.querySelector = (function(querySelector) {
    return function(selector) {
        try {
            return querySelector.call(this, selector);
        } catch(e) {
            // 如果是包含文本的选择器，则使用自定义方法
            if (selector.includes(':contains(')) {
                return customQuerySelector(this, selector);
            }
            throw e;
        }
    };
})(Element.prototype.querySelector);

// 自定义选择器实现
function customQuerySelector(element, selector) {
    const containsRegex = /:contains\(["']([^"']*)["']\)/;
    const match = selector.match(containsRegex);
    
    if (match) {
        const text = match[1];
        const baseSelector = selector.replace(/:contains\(["'][^"']*["']\)/, '');
        
        const elements = Array.from(element.querySelectorAll(baseSelector));
        return elements.find(el => el.textContent.includes(text));
    }
    
    return null;
} 