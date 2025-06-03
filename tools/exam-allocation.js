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
const batchConfigModal = document.getElementById('batchConfigModal');

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
    const roomGroups = document.querySelectorAll('.room-config-item');
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
        tag.innerHTML = `${header} <i class="bi bi-x-circle ms-1" data-header="${header}"></i>`;
        selectedColumnsDiv.appendChild(tag);
        
        // 添加移除标签的点击事件
        const removeBtn = tag.querySelector('i');
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

// 更新表格头部
function updateTableHeader(examNumberColumn, extraColumns) {
    // 重置表格头部
    const headerRow = dataTableHeader.querySelector('tr');
    headerRow.innerHTML = '';
    
    // 添加序号、考号和考场列
    headerRow.appendChild(createTableHeaderCell('序号'));
    headerRow.appendChild(createTableHeaderCell(examNumberColumn));
    headerRow.appendChild(createTableHeaderCell('考场'));
    
    // 添加额外列
    extraColumns.forEach(colName => {
        headerRow.appendChild(createTableHeaderCell(colName));
    });
}

// 创建表格头部单元格
function createTableHeaderCell(text) {
    const th = document.createElement('th');
    th.textContent = text;
    return th;
}

// 渲染学生数据表格
function renderTable() {
    const tbody = dataTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    studentData.forEach(student => {
        const row = document.createElement('tr');
        
        // 添加序号、考号和考场列
        row.appendChild(createTableCell(student.index));
        row.appendChild(createTableCell(student.examNumber));
        row.appendChild(createTableCell(student.room));
        
        // 添加额外列
        selectedExtraColumns.forEach(colName => {
            row.appendChild(createTableCell(student[colName] || ''));
        });
        
        tbody.appendChild(row);
    });
}

// 创建表格单元格
function createTableCell(text) {
    const td = document.createElement('td');
    td.textContent = text;
    return td;
}

// 导出数据为Excel
function exportData() {
    if (studentData.length === 0) {
        alert('没有数据可导出');
        return;
    }
    
    if (!studentData[0].room) {
        alert('请先应用考场配置，进行考场分配');
        return;
    }
    
    // 创建工作表数据
    const worksheetData = [];
    
    // 添加表头
    const headers = ['序号', '考号', '考场'];
    selectedExtraColumns.forEach(colName => {
        headers.push(colName);
    });
    worksheetData.push(headers);
    
    // 添加数据行
    studentData.forEach(student => {
        const rowData = [student.index, student.examNumber, student.room];
        selectedExtraColumns.forEach(colName => {
            rowData.push(student[colName] || '');
        });
        worksheetData.push(rowData);
    });
    
    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // 设置列宽
    const columnWidths = headers.map(header => ({
        wch: Math.max(12, header.length * 2)
    }));
    ws['!cols'] = columnWidths;
    
    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '考场分配结果');
    
    // 导出文件
    XLSX.writeFile(wb, '考场分配结果.xlsx');
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

// 显示配置列选择界面
function showConfigColumnSelection(jsonData) {
    // 存储临时配置数据
    tempConfigData = jsonData;
    
    if (jsonData.length === 0) {
        alert('导入的配置文件没有数据');
        return;
    }
    
    // 获取列标题
    const firstRecord = jsonData[0];
    configColumnHeaders = Object.keys(firstRecord);
    
    // 清空下拉框
    startRoomColumnSelect.innerHTML = '';
    endRoomColumnSelect.innerHTML = '';
    studentsPerRoomColumnSelect.innerHTML = '';
    
    // 为下拉框添加选项
    configColumnHeaders.forEach(header => {
        const startOption = document.createElement('option');
        startOption.value = header;
        startOption.textContent = header;
        startRoomColumnSelect.appendChild(startOption);
        
        const endOption = document.createElement('option');
        endOption.value = header;
        endOption.textContent = header;
        endRoomColumnSelect.appendChild(endOption);
        
        const studentsOption = document.createElement('option');
        studentsOption.value = header;
        studentsOption.textContent = header;
        studentsPerRoomColumnSelect.appendChild(studentsOption);
    });
    
    // 自动选择合适的列
    autoSelectConfigColumns();
    
    // 显示列选择区域
    configColumnSelectSection.style.display = 'block';
}

// 自动选择配置列
function autoSelectConfigColumns() {
    // 尝试智能匹配列标题
    configColumnHeaders.forEach(header => {
        // 匹配起始考场号列
        if (header.match(/开始|起始|start|from|first/i)) {
            startRoomColumnSelect.value = header;
        }
        
        // 匹配结束考场号列
        if (header.match(/结束|终止|end|to|last/i)) {
            endRoomColumnSelect.value = header;
        }
        
        // 匹配每考场人数列
        if (header.match(/人数|数量|容量|students|count|capacity/i)) {
            studentsPerRoomColumnSelect.value = header;
        }
    });
    
    // 如果没有匹配到，选择前三列
    if (configColumnHeaders.length >= 1 && !startRoomColumnSelect.value) {
        startRoomColumnSelect.value = configColumnHeaders[0];
    }
    
    if (configColumnHeaders.length >= 2 && !endRoomColumnSelect.value) {
        endRoomColumnSelect.value = configColumnHeaders[1];
    }
    
    if (configColumnHeaders.length >= 3 && !studentsPerRoomColumnSelect.value) {
        studentsPerRoomColumnSelect.value = configColumnHeaders[2];
    }
}

// 确认配置列选择
function confirmConfigColumnSelection() {
    const selectedStartColumn = startRoomColumnSelect.value;
    const selectedEndColumn = endRoomColumnSelect.value;
    const selectedStudentsColumn = studentsPerRoomColumnSelect.value;
    
    if (!selectedStartColumn || !selectedEndColumn || !selectedStudentsColumn) {
        alert('请选择所有必需的列');
        return;
    }
    
    // 使用选定的列处理配置数据
    handleConfigDataWithSelectedColumns(
        tempConfigData,
        selectedStartColumn,
        selectedEndColumn,
        selectedStudentsColumn
    );
    
    // 隐藏列选择区域
    configColumnSelectSection.style.display = 'none';
    
    // 清空临时数据
    tempConfigData = null;
}

// 处理配置数据
function handleConfigDataWithSelectedColumns(jsonData, startRoomColumn, endRoomColumn, studentsPerRoomColumn) {
    // 清空现有配置
    clearConfigGroups();
    
    // 处理配置数据
    let validConfigCount = 0;
    
    jsonData.forEach(record => {
        const startRoom = parseInt(record[startRoomColumn], 10);
        const endRoom = parseInt(record[endRoomColumn], 10);
        const studentsPerRoom = parseInt(record[studentsPerRoomColumn], 10);
        
        // 验证数据有效性
        if (isNaN(startRoom) || isNaN(endRoom) || isNaN(studentsPerRoom)) {
            return; // 跳过无效行
        }
        
        if (startRoom > endRoom || studentsPerRoom <= 0) {
            return; // 跳过无效配置
        }
        
        // 添加配置组
        addConfigGroupWithValues(startRoom, endRoom, studentsPerRoom);
        validConfigCount++;
    });
    
    if (validConfigCount === 0) {
        alert('配置文件中没有有效的配置数据');
        // 添加默认配置组
        addConfigGroupWithValues(1, 5, 30);
    } else {
        alert(`成功导入${validConfigCount}条考场配置`);
    }
    
    // 更新配置组数据
    updateConfigGroups();
}

// 处理Excel文件
function processExcelFile(file, callback) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            
            // 获取第一个工作表
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // 将工作表转换为JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            // 调用回调函数处理数据
            callback(jsonData);
        } catch (error) {
            console.error('文件解析错误:', error);
            alert('文件格式错误或无法解析');
        }
    };
    
    reader.onerror = function() {
        alert('读取文件时发生错误');
    };
    
    reader.readAsBinaryString(file);
}

// 下载配置模板
function downloadConfigTemplate() {
    // 创建工作表数据
    const worksheetData = [
        ['起始考场号', '结束考场号', '每考场人数'],
        [1, 5, 30],
        [6, 10, 35],
        [11, 15, 40]
    ];
    
    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // 设置列宽
    ws['!cols'] = [
        { wch: 12 }, // 起始考场号
        { wch: 12 }, // 结束考场号
        { wch: 12 }  // 每考场人数
    ];
    
    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '考场配置模板');
    
    // 导出文件
    XLSX.writeFile(wb, '考场配置模板.xlsx');
}

// 清空配置组
function clearConfigGroups() {
    // 清空配置区域
    roomConfig.innerHTML = '';
    
    // 重置配置组数据
    configGroups = [];
    configCounter = 1;
}

// 批量添加考场配置
function addBatchConfig() {
    const startRoom = parseInt(batchStartRoom.value, 10);
    const endRoom = parseInt(batchEndRoom.value, 10);
    const studentsPerRoom = parseInt(batchStudentsPerRoom.value, 10);
    
    if (isNaN(startRoom) || isNaN(endRoom) || isNaN(studentsPerRoom)) {
        alert('请输入有效的数字');
        return;
    }
    
    if (startRoom > endRoom) {
        alert('起始考场号不能大于结束考场号');
        return;
    }
    
    if (studentsPerRoom <= 0) {
        alert('每考场人数必须大于0');
        return;
    }
    
    // 添加配置组
    addConfigGroupWithValues(startRoom, endRoom, studentsPerRoom);
    
    // 更新配置组数据
    updateConfigGroups();
    
    // 关闭模态框
    const modal = bootstrap.Modal.getInstance(batchConfigModal);
    if (modal) {
        modal.hide();
    }
}

// 使用指定值添加配置组
function addConfigGroupWithValues(startRoom, endRoom, studentsPerRoom) {
    const groupId = `config-group-${configCounter++}`;
    
    const groupHtml = `
        <div class="room-config-item" id="${groupId}">
            <div class="room-config-header">
                <span>配置组 ${configGroups.length + 1}</span>
                <button type="button" class="btn btn-danger btn-sm delete-config" data-id="${groupId}">
                    <i class="bi bi-trash"></i> 删除
                </button>
            </div>
            <div class="row">
                <div class="col-md-4 mb-3">
                    <label class="form-label">起始考场号</label>
                    <input type="number" class="form-control start-room" value="${startRoom}" min="1">
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label">结束考场号</label>
                    <input type="number" class="form-control end-room" value="${endRoom}" min="1">
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label">每考场人数</label>
                    <input type="number" class="form-control students-per-room" value="${studentsPerRoom}" min="1">
                </div>
            </div>
        </div>
    `;
    
    roomConfig.insertAdjacentHTML('beforeend', groupHtml);
    
    // 添加删除事件监听
    document.querySelector(`#${groupId} .delete-config`).addEventListener('click', function() {
        document.getElementById(this.dataset.id).remove();
        updateConfigGroups();
    });
}

// 添加空白配置组
function addConfigGroup() {
    // 获取已有配置组的最后一个考场号作为新组的起始号
    let startRoom = 1;
    if (configGroups.length > 0) {
        const lastGroup = configGroups[configGroups.length - 1];
        startRoom = lastGroup.endRoom + 1;
    }
    
    addConfigGroupWithValues(startRoom, startRoom + 4, 30);
    updateConfigGroups();
}

// 更新配置组数据
function updateConfigGroups() {
    configGroups = [];
    
    const configItems = document.querySelectorAll('.room-config-item');
    configItems.forEach((item, index) => {
        const startRoomInput = item.querySelector('.start-room');
        const endRoomInput = item.querySelector('.end-room');
        const studentsPerRoomInput = item.querySelector('.students-per-room');
        
        if (startRoomInput && endRoomInput && studentsPerRoomInput) {
            const startRoom = parseInt(startRoomInput.value, 10);
            const endRoom = parseInt(endRoomInput.value, 10);
            const studentsPerRoom = parseInt(studentsPerRoomInput.value, 10);
            
            if (!isNaN(startRoom) && !isNaN(endRoom) && !isNaN(studentsPerRoom)) {
                configGroups.push({
                    index: index + 1,
                    startRoom,
                    endRoom,
                    studentsPerRoom
                });
            }
        }
    });
}

// 应用考场配置
function applyConfig() {
    if (studentData.length === 0) {
        alert('请先导入学生数据');
        return;
    }
    
    if (configGroups.length === 0) {
        alert('请先添加考场配置');
        return;
    }
    
    // 更新配置组数据（确保使用最新的输入值）
    updateConfigGroups();
    
    // 验证配置有效性
    for (const config of configGroups) {
        if (config.startRoom > config.endRoom) {
            alert(`配置组 ${config.index}: 起始考场号不能大于结束考场号`);
            return;
        }
        
        if (config.studentsPerRoom <= 0) {
            alert(`配置组 ${config.index}: 每考场人数必须大于0`);
            return;
        }
    }
    
    // 检查考场范围是否有重叠
    for (let i = 0; i < configGroups.length; i++) {
        for (let j = i + 1; j < configGroups.length; j++) {
            const groupA = configGroups[i];
            const groupB = configGroups[j];
            
            if ((groupA.startRoom <= groupB.endRoom && groupA.endRoom >= groupB.startRoom) ||
                (groupB.startRoom <= groupA.endRoom && groupB.endRoom >= groupA.startRoom)) {
                alert(`配置组 ${groupA.index} 和 ${groupB.index} 的考场范围有重叠，请修正`);
                return;
            }
        }
    }
    
    // 计算考场分配
    const roomInfo = {};
    let totalCapacity = 0;
    
    // 根据配置创建考场
    configGroups.forEach(config => {
        for (let roomNumber = config.startRoom; roomNumber <= config.endRoom; roomNumber++) {
            roomInfo[roomNumber] = {
                capacity: config.studentsPerRoom,
                assigned: 0,
                students: []
            };
            totalCapacity += config.studentsPerRoom;
        }
    });
    
    // 按考号排序
    studentData.sort((a, b) => {
        return String(a.examNumber).localeCompare(String(b.examNumber), undefined, { numeric: true });
    });
    
    // 检查总容量是否足够
    if (totalCapacity < studentData.length) {
        alert(`警告：考场总容量(${totalCapacity})小于学生人数(${studentData.length})，部分学生将无法分配考场`);
    }
    
    // 分配考场
    let assignedCount = 0;
    let unassignedCount = 0;
    
    studentData.forEach(student => {
        // 按考场号顺序寻找有空位的考场
        let assigned = false;
        
        // 获取所有考场号并排序
        const roomNumbers = Object.keys(roomInfo).map(Number).sort((a, b) => a - b);
        
        for (const roomNumber of roomNumbers) {
            const room = roomInfo[roomNumber];
            
            if (room.assigned < room.capacity) {
                // 分配考场
                student.room = roomNumber;
                room.assigned++;
                room.students.push(student);
                assigned = true;
                assignedCount++;
                break;
            }
        }
        
        if (!assigned) {
            student.room = '未分配';
            unassignedCount++;
        }
    });
    
    // 更新表格显示
    renderTable();
    
    // 显示分配结果
    if (unassignedCount > 0) {
        alert(`考场分配完成：共有 ${assignedCount} 人分配成功，${unassignedCount} 人未能分配考场`);
    } else {
        alert(`考场分配完成：所有 ${assignedCount} 人均成功分配考场`);
    }
}

// 辅助函数：自定义查询选择器，避免某些浏览器的兼容性问题
function customQuerySelector(element, selector) {
    try {
        return element.querySelector(selector);
    } catch (error) {
        console.error('查询选择器错误:', error);
        return null;
    }
} 