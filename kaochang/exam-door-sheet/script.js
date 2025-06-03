document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const titleInput = document.getElementById('title');
    const examRoomInput = document.getElementById('examRoom');
    const studentCountInput = document.getElementById('studentCount');
    const showCountCheckbox = document.getElementById('showCount');
    const batchGenerateCheckbox = document.getElementById('batchGenerate');
    const batchSettings = document.getElementById('batchSettings');
    const startRoomInput = document.getElementById('startRoom');
    const endRoomInput = document.getElementById('endRoom');
    const useCustomRoomConfigCheckbox = document.getElementById('useCustomRoomConfig');
    const roomConfigPanel = document.getElementById('roomConfigPanel');
    const roomConfigTable = document.getElementById('roomConfigTable');
    const addConfigBtn = document.getElementById('addConfigBtn');
    const saveConfigBtn = document.getElementById('saveConfigBtn');
    const generateBtn = document.getElementById('generateBtn');
    const exportBtn = document.getElementById('exportBtn');
    const previewContainer = document.getElementById('preview');
    
    // 上传相关元素
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const columnSelector = document.getElementById('columnSelector');
    const nameColumn = document.getElementById('nameColumn');
    const idColumn = document.getElementById('idColumn');
    const confirmColumns = document.getElementById('confirmColumns');
    const dataPreview = document.getElementById('dataPreview');
    const dataCount = document.getElementById('dataCount');
    const previewTable = document.getElementById('previewTable').querySelector('tbody');
    const clearFile = document.getElementById('clearFile');
    
    // 存储上传的学生数据
    let uploadedStudentData = null;
    let headers = [];
    
    // 自定义考场配置
    let roomConfigurations = [
        { startRoom: 1, endRoom: 5, size: 30 },
        { startRoom: 6, endRoom: 10, size: 40 }
    ];
    
    // 添加考场配置导入相关元素
    const importRoomConfigBtn = document.createElement('button');
    importRoomConfigBtn.id = 'importRoomConfigBtn';
    importRoomConfigBtn.className = 'btn secondary';
    importRoomConfigBtn.textContent = '导入考场配置';
    roomConfigPanel.insertBefore(importRoomConfigBtn, roomConfigTable);

    const roomConfigUploadArea = document.createElement('div');
    roomConfigUploadArea.id = 'roomConfigUploadArea';
    roomConfigUploadArea.className = 'upload-area hidden';
    roomConfigUploadArea.innerHTML = `
        <div class="upload-content">
            <p>拖放文件到此处或点击选择文件</p>
            <input type="file" id="roomConfigFileInput" accept=".csv,.xlsx,.xls" style="display: none;">
            <button type="button" id="roomConfigUploadBtn" class="btn">选择文件</button>
        </div>
    `;
    roomConfigPanel.insertBefore(roomConfigUploadArea, roomConfigTable);

    const roomConfigFileInfo = document.createElement('div');
    roomConfigFileInfo.id = 'roomConfigFileInfo';
    roomConfigFileInfo.className = 'file-info hidden';
    roomConfigFileInfo.innerHTML = `
        <span>文件名：<span id="roomConfigFileName"></span></span>
        <span>大小：<span id="roomConfigFileSize"></span></span>
        <button type="button" id="clearRoomConfigFile" class="btn-icon">❌</button>
    `;
    roomConfigPanel.insertBefore(roomConfigFileInfo, roomConfigTable);

    const roomConfigColumnSelector = document.createElement('div');
    roomConfigColumnSelector.id = 'roomConfigColumnSelector';
    roomConfigColumnSelector.className = 'column-selector hidden';
    roomConfigColumnSelector.innerHTML = `
        <h3>选择列</h3>
        <div class="form-group">
            <label>起始考场号列：</label>
            <select id="startRoomColumn"></select>
        </div>
        <div class="form-group">
            <label>结束考场号列：</label>
            <select id="endRoomColumn"></select>
        </div>
        <div class="form-group">
            <label>考场人数列：</label>
            <select id="roomSizeColumn"></select>
        </div>
        <button type="button" id="confirmRoomConfigColumns" class="btn">确认</button>
    `;
    roomConfigPanel.insertBefore(roomConfigColumnSelector, roomConfigTable);

    // 存储考场配置数据
    let roomConfigData = null;

    // 添加教室号配置相关元素
    const useCustomClassroomCheckbox = document.getElementById('useCustomClassroom');
    const classroomConfigPanel = document.getElementById('classroomConfigPanel');
    const classroomConfigTable = document.getElementById('classroomConfigTable');
    const addClassroomBtn = document.getElementById('addClassroomBtn');
    
    // 存储教室号配置
    let classroomConfigurations = new Map();
    
    // 批量生成复选框事件监听
    batchGenerateCheckbox.addEventListener('change', function() {
        if (this.checked) {
            batchSettings.classList.remove('hidden');
            examRoomInput.disabled = true; // 批量模式下禁用考场号输入
        } else {
            batchSettings.classList.add('hidden');
            examRoomInput.disabled = false;
        }
    });
    
    // 自定义考场人数配置复选框事件监听
    useCustomRoomConfigCheckbox.addEventListener('change', function() {
        if (this.checked) {
            roomConfigPanel.classList.remove('hidden');
        } else {
            roomConfigPanel.classList.add('hidden');
        }
    });
    
    // 自定义教室号配置复选框事件监听
    useCustomClassroomCheckbox.addEventListener('change', function() {
        if (this.checked) {
            classroomConfigPanel.classList.remove('hidden');
        } else {
            classroomConfigPanel.classList.add('hidden');
        }
    });
    
    // 添加新配置
    addConfigBtn.addEventListener('click', function() {
        const tbody = roomConfigTable.querySelector('tbody');
        const newRow = document.createElement('tr');
        
        // 计算新范围的默认值
        let maxEndRoom = 1;
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const endRangeInput = row.querySelector('.end-range');
            if (endRangeInput) {
                const endValue = parseInt(endRangeInput.value);
                if (!isNaN(endValue) && endValue > maxEndRoom) {
                    maxEndRoom = endValue;
                }
            }
        });
        
        const newStartRoom = maxEndRoom + 1;
        const newEndRoom = newStartRoom + 4;
        
        newRow.innerHTML = `
            <td>
                <span class="range-text">${newStartRoom}-${newEndRoom}</span>
                <input type="number" class="start-range" value="${newStartRoom}" min="1" style="display:none;">
                <span style="display:none;">-</span>
                <input type="number" class="end-range" value="${newEndRoom}" min="1" style="display:none;">
            </td>
            <td>
                <input type="number" class="room-size" value="30" min="1" max="300">
            </td>
            <td>
                <button type="button" class="btn-icon edit-config">✏️</button>
                <button type="button" class="btn-icon delete-config">❌</button>
            </td>
        `;
        
        // 添加事件监听器
        addConfigRowEventListeners(newRow);
        
        tbody.appendChild(newRow);
    });
    
    // 为配置行添加事件监听器
    function addConfigRowEventListeners(row) {
        // 编辑按钮事件
        const editBtn = row.querySelector('.edit-config');
        if (editBtn) {
            editBtn.addEventListener('click', function() {
                const rangeText = row.querySelector('.range-text');
                const startRangeInput = row.querySelector('.start-range');
                const dashSpan = row.querySelector('span:not(.range-text)');
                const endRangeInput = row.querySelector('.end-range');
                
                if (rangeText.style.display !== 'none') {
                    // 切换到编辑模式
                    rangeText.style.display = 'none';
                    startRangeInput.style.display = 'inline-block';
                    dashSpan.style.display = 'inline-block';
                    endRangeInput.style.display = 'inline-block';
                    this.textContent = '💾'; // 保存图标
                } else {
                    // 保存并切换回显示模式
                    const start = parseInt(startRangeInput.value);
                    const end = parseInt(endRangeInput.value);
                    
                    if (isNaN(start) || isNaN(end) || start > end) {
                        alert('请输入有效的范围（开始值不能大于结束值）');
                        return;
                    }
                    
                    rangeText.textContent = `${start}-${end}`;
                    rangeText.style.display = 'inline-block';
                    startRangeInput.style.display = 'none';
                    dashSpan.style.display = 'none';
                    endRangeInput.style.display = 'none';
                    this.textContent = '✏️'; // 编辑图标
                }
            });
        }
        
        // 删除按钮事件
        const deleteBtn = row.querySelector('.delete-config');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                if (confirm('确定要删除这个配置吗？')) {
                    row.remove();
                }
            });
        }
    }
    
    // 为初始配置行添加事件监听器
    document.querySelectorAll('#roomConfigTable tbody tr').forEach(row => {
        addConfigRowEventListeners(row);
    });
    
    // 保存配置按钮事件
    saveConfigBtn.addEventListener('click', function() {
        // 清空现有配置
        roomConfigurations = [];
        
        // 收集所有配置行的数据
        const rows = roomConfigTable.querySelectorAll('tbody tr');
        let hasError = false;
        
        rows.forEach((row, index) => {
            const rangeText = row.querySelector('.range-text').textContent;
            const [startStr, endStr] = rangeText.split('-');
            const startRoom = parseInt(startStr);
            const endRoom = parseInt(endStr);
            const size = parseInt(row.querySelector('.room-size').value);
            
            if (isNaN(startRoom) || isNaN(endRoom) || isNaN(size) || startRoom > endRoom || size < 1) {
                alert(`第 ${index + 1} 行配置有误：请检查范围和人数。`);
                hasError = true;
                return;
            }
            
            // 检查范围重叠
            for (const config of roomConfigurations) {
                if ((startRoom >= config.startRoom && startRoom <= config.endRoom) ||
                    (endRoom >= config.startRoom && endRoom <= config.endRoom) ||
                    (config.startRoom >= startRoom && config.startRoom <= endRoom)) {
                    alert(`第 ${index + 1} 行配置与其他配置的范围重叠，请修正。`);
                    hasError = true;
                    return;
                }
            }
            
            roomConfigurations.push({
                startRoom: startRoom,
                endRoom: endRoom,
                size: size
            });
        });
        
        if (!hasError) {
            alert('配置已保存！');
            // 根据考场范围排序
            roomConfigurations.sort((a, b) => a.startRoom - b.startRoom);
            updateStudentCountBasedOnRoom();
        }
    });
    
    // 考场号变化时自动设置学生人数
    examRoomInput.addEventListener('input', updateStudentCountBasedOnRoom);
    startRoomInput.addEventListener('input', updateStudentCountBasedOnRoom);
    
    function updateStudentCountBasedOnRoom() {
        let roomNumber;
        
        if (batchGenerateCheckbox.checked) {
            roomNumber = parseInt(startRoomInput.value);
        } else {
            roomNumber = parseInt(examRoomInput.value);
        }
        
        if (isNaN(roomNumber)) return;
        
        // 使用自定义配置或默认规则
        const config = getRoomConfig(roomNumber);
        if (config) {
            studentCountInput.value = config.size;
        }
    }
    
    // 根据考场号获取配置
    function getRoomConfig(roomNumber) {
        for (const config of roomConfigurations) {
            if (roomNumber >= config.startRoom && roomNumber <= config.endRoom) {
                return config;
            }
        }
        
        // 如果没有找到匹配的配置，返回默认值30
        return { startRoom: roomNumber, endRoom: roomNumber, size: 30 };
    }
    
    // 初始化学生人数
    updateStudentCountBasedOnRoom();
    
    // 生成随机中文姓名
    function generateRandomName() {
        const surnames = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴', '郑', '孙', '马', '朱', '胡', '林', '郭', '何', '高', '罗'];
        const names = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀兰', '霞', '平', '刚', '桂英'];
        
        const surname = surnames[Math.floor(Math.random() * surnames.length)];
        const name = names[Math.floor(Math.random() * names.length)];
        
        return surname + name;
    }
    
    // 生成随机考号
    function generateRandomId() {
        // 生成6位随机数字
        return String(Math.floor(100000 + Math.random() * 900000));
    }
    
    // 生成学生数据
    function generateStudentData(count) {
        const students = [];
        for (let i = 0; i < count; i++) {
            students.push({
                name: generateRandomName(),
                id: generateRandomId()
            });
        }
        return students;
    }
    
    // 计算最佳字体大小 - 优化函数
    function calculateOptimalFontSize(studentCount) {
        // 根据学生数量动态计算最合适的字体大小
        if (studentCount <= 30) return 16;
        if (studentCount <= 40) return 14;
        if (studentCount <= 50) return 12;
        if (studentCount <= 60) return 11;
        return 10;
    }
    
    // 生成门贴HTML
    function generateExamSheet(title, roomNumber, students) {
        // 计算需要的行数（两列布局，每行可显示2名学生）
        const rowsNeeded = Math.ceil(students.length / 2);
        
        // 计算A4纸可用空间（单位：mm）
        const pageHeight = 297; // A4纸高度
        const pageMargin = 15; // 减小边距
        const titleHeight = students.length > 50 ? 30 : 40; // 根据人数调整标题高度
        const tableHeaderHeight = 6; // 减小表头高度
        
        // 计算表格可用高度
        const availableTableHeight = pageHeight - (2 * pageMargin) - titleHeight - tableHeaderHeight;
        
        // 设置最小行高以确保可读性
        const minRowHeight = 4; // 减小最小行高
        
        // 计算动态行高（不小于最小行高）
        let dynamicRowHeight = availableTableHeight / rowsNeeded;
        dynamicRowHeight = Math.max(dynamicRowHeight, minRowHeight);
        
        // 计算最佳字体大小
        const fontSize = calculateOptimalFontSize(students.length);
        
        // 设置行高样式
        const rowHeightStyle = `<style>
            .a4-sheet .student-table td {
                height: ${dynamicRowHeight}mm;
                max-height: ${dynamicRowHeight}mm;
                font-size: ${fontSize}px;
                padding: ${students.length > 40 ? '1px 2px' : '2px 3px'};
                line-height: 1.1;
            }
            .a4-sheet .student-table tbody tr {
                height: ${dynamicRowHeight}mm;
            }
            .a4-sheet .exam-title {
                font-size: ${students.length > 50 ? '20px' : '24px'};
                margin-bottom: ${students.length > 50 ? '10px' : '15px'};
                padding-bottom: ${students.length > 50 ? '5px' : '8px'};
            }
            .a4-sheet .exam-count {
                font-size: ${students.length > 50 ? '14px' : '16px'};
            }
            .a4-sheet .student-table th {
                font-size: ${fontSize + 1}px;
                padding: ${students.length > 40 ? '2px 3px' : '3px 5px'};
            }
        </style>`;
        
        let html = '';
        
        // 获取教室号
        const classroom = useCustomClassroomCheckbox.checked ? 
            classroomConfigurations.get(roomNumber.toString()) || '' : '';
        
        // 组装考场号文本
        const roomText = `第${roomNumber}考场${classroom ? `（${classroom}教室）` : ''}`;
        
        // 完整标题包含考场号和教室号
        const fullTitle = title ? `${title} - ${roomText}` : roomText;
        
        // 将所有学生放在一个页面上，动态调整行高
        html += `
            <div class="a4-sheet">
                ${rowHeightStyle}
                <div class="exam-title">
                    ${fullTitle}
                    ${showCountCheckbox.checked ? 
                        `<span class="exam-count">考生人数：${students.length}人</span>` : 
                        ''}
                </div>
                <div class="student-table-container">
                    <table class="student-table">
                        <thead>
                            <tr>
                                <th class="col-name">姓名</th>
                                <th class="col-id">考号</th>
                                <th class="col-name">姓名</th>
                                <th class="col-id">考号</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        // 分为左右两列
        const halfLength = Math.ceil(students.length / 2);
        const leftColumn = students.slice(0, halfLength);
        const rightColumn = students.slice(halfLength);
        const maxRows = Math.max(leftColumn.length, rightColumn.length);
        
        for (let i = 0; i < maxRows; i++) {
            html += `<tr>`;
            
            // 左列学生
            if (i < leftColumn.length) {
                html += `
                    <td class="student-name">${leftColumn[i].name}</td>
                    <td class="student-id">${leftColumn[i].id}</td>
                `;
            } else {
                html += `<td></td><td></td>`;
            }
            
            // 右列学生
            if (i < rightColumn.length) {
                html += `
                    <td class="student-name">${rightColumn[i].name}</td>
                    <td class="student-id">${rightColumn[i].id}</td>
                `;
            } else {
                html += `<td></td><td></td>`;
            }
            
            html += `</tr>`;
        }
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        return html;
    }
    
    // 处理文件上传
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });
    
    // 拖放文件
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('active');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('active');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('active');
        
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect();
        }
    });
    
    // 文件选择处理
    fileInput.addEventListener('change', handleFileSelect);
    
    function handleFileSelect() {
        if (fileInput.files.length === 0) return;
        
        const file = fileInput.files[0];
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        fileInfo.classList.remove('hidden');
        
        // 从文件名自动填充标题，但不包含考场号信息
        const fileNameWithoutExt = file.name.replace(/\.(csv|xlsx|xls)$/i, '');
        // 移除可能已经存在的考场号信息（如"第X考场"）
        const cleanTitle = fileNameWithoutExt.replace(/\s*[-—–]\s*第\d+考场\s*$/i, '');
        titleInput.value = cleanTitle;
        
        // 解析文件
        parseFile(file);
    }
    
    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes < 1024) {
            return bytes + ' bytes';
        } else if (bytes < 1024 * 1024) {
            return (bytes / 1024).toFixed(1) + ' KB';
        } else {
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        }
    }
    
    // 解析文件
    function parseFile(file) {
        uploadedStudentData = null;
        
        if (file.name.toLowerCase().endsWith('.csv')) {
            parseCSV(file);
        } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
            parseExcel(file);
        } else {
            alert('不支持的文件格式。请上传CSV或Excel文件。');
        }
    }
    
    // 解析CSV文件
    function parseCSV(file) {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            encoding: "UTF-8",
            complete: function(results) {
                if (results.data && results.data.length > 0) {
                    headers = results.meta.fields || [];
                    showColumnSelector(headers, results.data);
                } else {
                    alert('CSV文件中未找到有效数据。');
                }
            },
            error: function(error) {
                alert('解析CSV文件时出错：' + error);
            }
        });
    }
    
    // 解析Excel文件
    function parseExcel(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                
                // 获取第一个工作表
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // 转换为JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
                
                if (jsonData.length > 1) {
                    headers = jsonData[0];
                    
                    // 转换为对象数组
                    const rows = [];
                    for (let i = 1; i < jsonData.length; i++) {
                        const row = {};
                        for (let j = 0; j < headers.length; j++) {
                            if (headers[j]) { // 确保列标题不为空
                                row[headers[j]] = jsonData[i][j] || '';
                            }
                        }
                        rows.push(row);
                    }
                    
                    showColumnSelector(headers, rows);
                } else {
                    alert('Excel文件中未找到有效数据。');
                }
            } catch (error) {
                alert('解析Excel文件时出错：' + error);
            }
        };
        
        reader.onerror = function() {
            alert('读取文件时出错。');
        };
        
        reader.readAsArrayBuffer(file);
    }
    
    // 显示列选择器
    function showColumnSelector(headers, data) {
        nameColumn.innerHTML = '';
        idColumn.innerHTML = '';
        
        // 添加默认选项
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- 请选择 --';
        
        nameColumn.appendChild(defaultOption.cloneNode(true));
        idColumn.appendChild(defaultOption.cloneNode(true));
        
        // 添加列选项
        headers.forEach((header, index) => {
            const option = document.createElement('option');
            option.value = header;
            option.textContent = header;
            
            nameColumn.appendChild(option.cloneNode(true));
            idColumn.appendChild(option.cloneNode(true));
            
            // 自动检测可能的姓名和考号列
            if (typeof header === 'string') {
                const headerLower = header.toLowerCase();
                
                if (headerLower.includes('姓名') || headerLower.includes('name') || 
                    headerLower.includes('学生')) {
                    nameColumn.value = header;
                }
                
                if (headerLower.includes('考号') || headerLower.includes('学号') || 
                    headerLower.includes('id') || headerLower.includes('编号')) {
                    idColumn.value = header;
                }
            }
        });
        
        // 显示列选择器
        columnSelector.classList.remove('hidden');
        dataPreview.classList.add('hidden');
        
        // 保存数据供后续使用
        columnSelector.dataset.data = JSON.stringify(data);
    }
    
    // 确认列选择
    confirmColumns.addEventListener('click', function() {
        const selectedNameColumn = nameColumn.value;
        const selectedIdColumn = idColumn.value;
        
        if (!selectedNameColumn || !selectedIdColumn) {
            alert('请选择姓名列和考号列。');
            return;
        }
        
        try {
            const data = JSON.parse(columnSelector.dataset.data);
            
            // 预处理数据
            uploadedStudentData = data.map(row => ({
                name: row[selectedNameColumn] || '',
                id: row[selectedIdColumn] || ''
            })).filter(student => student.name && student.id);
            
            if (uploadedStudentData.length === 0) {
                alert('未找到有效的学生数据。请确保选择了正确的列。');
                return;
            }
            
            // 批量模式下不自动更新学生人数，因为每个考场人数可能不同
            if (!batchGenerateCheckbox.checked) {
                studentCountInput.value = uploadedStudentData.length;
            }
            
            // 显示数据预览
            showDataPreview(uploadedStudentData);
            
        } catch (error) {
            alert('处理数据时出错：' + error);
        }
    });
    
    // 显示数据预览
    function showDataPreview(students) {
        // 更新数据计数
        dataCount.textContent = `已成功导入 ${students.length} 条学生数据`;
        
        // 清空预览表格
        previewTable.innerHTML = '';
        
        // 添加预览行（最多显示5行）
        const previewCount = Math.min(5, students.length);
        for (let i = 0; i < previewCount; i++) {
            const row = document.createElement('tr');
            
            const nameCell = document.createElement('td');
            nameCell.textContent = students[i].name;
            row.appendChild(nameCell);
            
            const idCell = document.createElement('td');
            idCell.textContent = students[i].id;
            row.appendChild(idCell);
            
            previewTable.appendChild(row);
        }
        
        // 如果有更多数据，添加省略提示
        if (students.length > previewCount) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 2;
            cell.textContent = `...还有 ${students.length - previewCount} 条数据`;
            cell.style.textAlign = 'center';
            row.appendChild(cell);
            previewTable.appendChild(row);
        }
        
        // 显示数据预览，隐藏列选择器
        columnSelector.classList.add('hidden');
        dataPreview.classList.remove('hidden');
    }
    
    // 清除文件
    clearFile.addEventListener('click', function() {
        fileInput.value = '';
        fileInfo.classList.add('hidden');
        uploadedStudentData = null;
        headers = [];
    });
    
    // 点击生成按钮
    generateBtn.addEventListener('click', function() {
        const title = titleInput.value.trim();
        const studentCount = parseInt(studentCountInput.value) || 30;
        
        if (studentCount <= 0 || studentCount > 2000) {
            alert('请输入有效的考生人数（1-2000）');
            return;
        }
        
        let html = '';
        
        // 批量生成模式
        if (batchGenerateCheckbox.checked) {
            const startRoom = parseInt(startRoomInput.value);
            const endRoom = parseInt(endRoomInput.value);
            
            if (isNaN(startRoom) || isNaN(endRoom) || startRoom <= 0 || endRoom <= 0) {
                alert('请输入有效的起始和结束考场号');
                return;
            }
            
            if (startRoom > endRoom) {
                alert('起始考场号不能大于结束考场号');
                return;
            }
            
            const roomCount = endRoom - startRoom + 1;
            
            // 如果有上传学生数据，按考场分配学生
            if (uploadedStudentData && uploadedStudentData.length > 0) {
                let currentStudentIndex = 0;
                
                // 为每个考场分配学生
                for (let i = startRoom; i <= endRoom; i++) {
                    // 根据考场号获取配置的人数
                    const config = getRoomConfig(i);
                    const roomSize = config.size;
                    
                    // 检查是否还有足够的学生
                    if (currentStudentIndex >= uploadedStudentData.length) {
                        alert(`警告：学生数据不足，第${i}考场及之后的考场将没有学生数据。`);
                        break;
                    }
                    
                    // 计算当前考场的结束索引
                    const endIndex = Math.min(currentStudentIndex + roomSize, uploadedStudentData.length);
                    
                    // 该考场的学生
                    const roomData = uploadedStudentData.slice(currentStudentIndex, endIndex);
                    
                    if (roomData.length > 0) {
                        html += generateExamSheet(title, i, roomData);
                    }
                    
                    // 更新学生索引
                    currentStudentIndex = endIndex;
                }
            } else {
                // 使用随机生成的数据
                for (let i = startRoom; i <= endRoom; i++) {
                    // 根据考场号获取配置的人数
                    const config = getRoomConfig(i);
                    const students = generateStudentData(config.size);
                    html += generateExamSheet(title, i, students);
                }
            }
        } else {
            // 单个考场模式
            const roomNumber = examRoomInput.value.trim();
            
            if (!roomNumber) {
                alert('请输入有效的考场号');
                return;
            }
            
            // 使用上传的学生数据或随机生成
            const students = uploadedStudentData || generateStudentData(studentCount);
            html = generateExamSheet(title, roomNumber, students);
        }
        
        previewContainer.innerHTML = html;
        
        // 启用导出按钮
        exportBtn.disabled = false;
        exportExcelBtn.disabled = false;
        
        // 滚动到预览区域
        previewContainer.scrollIntoView({ behavior: 'smooth' });
    });
    
    // 点击导出按钮
    exportBtn.addEventListener('click', function() {
        const title = titleInput.value.trim();
        
        // 获取所有A4纸张
        const sheets = document.querySelectorAll('.a4-sheet');
        
        if (sheets.length === 0) {
            alert('请先生成考场门贴');
            return;
        }
        
        // 显示加载提示
        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'loading-message';
        loadingMessage.textContent = '正在生成PDF，请稍候...';
        loadingMessage.style.position = 'fixed';
        loadingMessage.style.top = '50%';
        loadingMessage.style.left = '50%';
        loadingMessage.style.transform = 'translate(-50%, -50%)';
        loadingMessage.style.padding = '20px';
        loadingMessage.style.backgroundColor = 'rgba(0,0,0,0.7)';
        loadingMessage.style.color = 'white';
        loadingMessage.style.borderRadius = '5px';
        loadingMessage.style.zIndex = '9999';
        document.body.appendChild(loadingMessage);
        
        // 配置PDF选项
        const options = {
            margin: 0,
            filename: title ? `${title}-考场门贴.pdf` : '考场门贴.pdf',
            image: { type: 'jpeg', quality: 1 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                logging: false,
                letterRendering: true,
                allowTaint: true,
                foreignObjectRendering: true,
                removeContainer: true,
                backgroundColor: '#ffffff',
                windowWidth: 210 * 3.78, // A4纸宽度（mm）转换为像素
                windowHeight: 297 * 3.78  // A4纸高度（mm）转换为像素
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait',
                compress: true,
                precision: 16
            }
        };

        // 创建一个临时容器来存放所有页面
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.width = '210mm';
        container.style.backgroundColor = 'white';
        container.style.padding = '0';
        container.style.margin = '0';
        document.body.appendChild(container);

        // 将所有页面添加到临时容器中
        sheets.forEach((sheet, index) => {
            const clone = sheet.cloneNode(true);
            // 确保克隆的元素保持原有样式
            clone.style.width = '210mm';
            clone.style.margin = '0';
            clone.style.pageBreakAfter = 'always';
            clone.style.backgroundColor = 'white';
            container.appendChild(clone);
        });

        // 使用html2pdf处理整个容器
        html2pdf().from(container).set(options).save().then(() => {
            // 清理临时容器
            document.body.removeChild(container);
            document.body.removeChild(loadingMessage);
            alert('PDF生成成功！');
        }).catch(error => {
            console.error('PDF生成错误:', error);
            alert('生成PDF时出错，请重试。如果问题持续存在，请尝试减少每页的学生数量。');
            document.body.removeChild(container);
            document.body.removeChild(loadingMessage);
        });
    });

    // 添加Excel导出按钮
    const exportExcelBtn = document.createElement('button');
    exportExcelBtn.id = 'exportExcelBtn';
    exportExcelBtn.className = 'btn secondary';
    exportExcelBtn.textContent = '导出Excel';
    exportExcelBtn.disabled = true;
    document.querySelector('.buttons').appendChild(exportExcelBtn);

    // Excel导出按钮点击事件
    exportExcelBtn.addEventListener('click', function() {
        const title = titleInput.value.trim();
        
        // 获取所有A4纸张
        const sheets = document.querySelectorAll('.a4-sheet');
        
        if (sheets.length === 0) {
            alert('请先生成考场门贴');
            return;
        }

        // 显示加载提示
        const loadingMessage = document.createElement('div');
        loadingMessage.className = 'loading-message';
        loadingMessage.textContent = '正在生成Excel，请稍候...';
        loadingMessage.style.position = 'fixed';
        loadingMessage.style.top = '50%';
        loadingMessage.style.left = '50%';
        loadingMessage.style.transform = 'translate(-50%, -50%)';
        loadingMessage.style.padding = '20px';
        loadingMessage.style.backgroundColor = 'rgba(0,0,0,0.7)';
        loadingMessage.style.color = 'white';
        loadingMessage.style.borderRadius = '5px';
        loadingMessage.style.zIndex = '9999';
        document.body.appendChild(loadingMessage);

        try {
            // 创建工作簿
            const wb = XLSX.utils.book_new();
            
            // 处理每个考场
            sheets.forEach((sheet, index) => {
                const titleElement = sheet.querySelector('.exam-title');
                let sheetTitle = titleElement ? titleElement.innerText.split('\n')[0] : `考场${index+1}`;
                
                // 处理工作表名称，确保符合Excel要求
                // 1. 移除特殊字符
                sheetTitle = sheetTitle.replace(/[\\/?*\[\]:]/g, '');
                // 2. 限制长度
                if (sheetTitle.length > 31) {
                    // 保留考场号信息
                    const roomMatch = sheetTitle.match(/第(\d+)考场/);
                    if (roomMatch) {
                        sheetTitle = `考场${roomMatch[1]}`;
                    } else {
                        sheetTitle = `考场${index + 1}`;
                    }
                }
                
                // 获取表格数据
                const table = sheet.querySelector('.student-table');
                if (!table) {
                    console.error('找不到表格数据');
                    return;
                }
                
                const rows = [];
                
                // 添加考场标题
                const examTitle = titleElement ? titleElement.innerText.split('\n')[0] : `第${index + 1}考场`;
                // 准确计算学生人数
                const studentCount = Array.from(table.querySelectorAll('tbody tr')).reduce((count, row) => {
                    const cells = row.querySelectorAll('td');
                    return count + Array.from(cells).filter(cell => cell.textContent.trim() !== '').length / 2;
                }, 0);
                const cleanTitle = examTitle.replace(/考生人数：\d+人/, '');
                rows.push([`${cleanTitle} ${studentCount}人`]);
                
                // 添加表头
                const headerRow = [];
                table.querySelectorAll('thead th').forEach(th => {
                    headerRow.push(th.textContent);
                });
                rows.push(headerRow);
                
                // 添加数据行
                table.querySelectorAll('tbody tr').forEach(tr => {
                    const row = [];
                    tr.querySelectorAll('td').forEach(td => {
                        row.push(td.textContent);
                    });
                    rows.push(row);
                });
                
                // 创建工作表
                const ws = XLSX.utils.aoa_to_sheet(rows);
                
                // 设置列宽
                const colWidths = [
                    { wch: 15 }, // 姓名列
                    { wch: 12 }, // 考号列
                    { wch: 15 }, // 姓名列
                    { wch: 12 }  // 考号列
                ];
                ws['!cols'] = colWidths;
                
                // 设置标题样式
                const titleCell = ws['A1'];
                if (titleCell) {
                    titleCell.s = {
                        font: { sz: 14, bold: true },
                        alignment: { horizontal: 'center' }
                    };
                }
                
                // 设置表头样式
                const headerRange = XLSX.utils.decode_range(ws['!ref']);
                for (let C = 0; C <= headerRange.e.c; ++C) {
                    const cell = ws[XLSX.utils.encode_cell({ r: 2, c: C })]; // 表头在第3行
                    if (cell) {
                        cell.s = {
                            font: { bold: true },
                            alignment: { horizontal: 'center' },
                            fill: { fgColor: { rgb: "FFE0E0E0" } }
                        };
                    }
                }
                
                // 设置数据单元格样式
                for (let R = 3; R <= headerRange.e.r; ++R) {
                    for (let C = 0; C <= headerRange.e.c; ++C) {
                        const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
                        if (cell) {
                            cell.s = {
                                alignment: { horizontal: 'center' }
                            };
                        }
                    }
                }
                
                // 将工作表添加到工作簿
                XLSX.utils.book_append_sheet(wb, ws, sheetTitle);
            });
            
            // 导出Excel文件
            XLSX.writeFile(wb, `${title ? title + '-' : ''}考场门贴.xlsx`);
            
            // 移除加载提示
            document.body.removeChild(loadingMessage);
        } catch (error) {
            console.error('导出Excel出错:', error);
            alert('导出Excel时出错: ' + error.message);
            document.body.removeChild(loadingMessage);
        }
    });

    // 初始化教室号配置
    function initializeClassroomConfig() {
        const rows = classroomConfigTable.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const examRoom = row.querySelector('td:first-child').textContent;
            const classroom = row.querySelector('.classroom-number').value;
            classroomConfigurations.set(examRoom, classroom);
        });
    }
    
    // 初始化时加载默认配置
    initializeClassroomConfig();

    // 添加教室配置
    addClassroomBtn.addEventListener('click', function() {
        const tbody = classroomConfigTable.querySelector('tbody');
        const newRow = document.createElement('tr');
        
        // 计算新的考场号
        let maxExamRoom = 0;
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const examRoom = parseInt(row.querySelector('td:first-child').textContent);
            if (!isNaN(examRoom) && examRoom > maxExamRoom) {
                maxExamRoom = examRoom;
            }
        });
        
        const newExamRoom = maxExamRoom + 1;
        
        newRow.innerHTML = `
            <td>${newExamRoom}</td>
            <td><input type="text" class="classroom-number" value=""></td>
            <td>
                <button type="button" class="btn-icon delete-classroom">❌</button>
            </td>
        `;
        
        // 添加删除按钮事件监听
        const deleteBtn = newRow.querySelector('.delete-classroom');
        deleteBtn.addEventListener('click', function() {
            if (confirm('确定要删除这个教室配置吗？')) {
                newRow.remove();
            }
        });
        
        tbody.appendChild(newRow);
    });
    
    // 为初始教室配置行添加删除按钮事件监听
    document.querySelectorAll('.delete-classroom').forEach(btn => {
        btn.addEventListener('click', function() {
            if (confirm('确定要删除这个教室配置吗？')) {
                this.closest('tr').remove();
            }
        });
    });

    // 添加教室配置相关元素
    const importClassroomBtn = document.getElementById('importClassroomBtn');
    const exportClassroomBtn = document.getElementById('exportClassroomBtn');
    const classroomUploadArea = document.getElementById('classroomUploadArea');
    const classroomFileInput = document.getElementById('classroomFileInput');
    const classroomUploadBtn = document.getElementById('classroomUploadBtn');
    const classroomFileInfo = document.getElementById('classroomFileInfo');
    const classroomFileName = document.getElementById('classroomFileName');
    const classroomFileSize = document.getElementById('classroomFileSize');
    const classroomColumnSelector = document.getElementById('classroomColumnSelector');
    const examRoomColumn = document.getElementById('examRoomColumn');
    const classroomColumn = document.getElementById('classroomColumn');
    const confirmClassroomColumns = document.getElementById('confirmClassroomColumns');
    const classroomDataPreview = document.getElementById('classroomDataPreview');
    const classroomDataCount = document.getElementById('classroomDataCount');
    const classroomPreviewTable = document.getElementById('classroomPreviewTable').querySelector('tbody');
    const clearClassroomFile = document.getElementById('clearClassroomFile');

    // 存储教室配置数据
    let classroomConfigData = null;

    // 导入教室配置按钮点击事件
    importClassroomBtn.addEventListener('click', function() {
        classroomUploadArea.classList.remove('hidden');
        classroomFileInfo.classList.add('hidden');
    });

    // 导出教室配置按钮点击事件
    exportClassroomBtn.addEventListener('click', function() {
        // 创建工作簿
        const wb = XLSX.utils.book_new();
        
        // 准备数据
        const rows = [['考场号', '教室号']];
        classroomConfigurations.forEach((classroom, examRoom) => {
            rows.push([examRoom, classroom]);
        });
        
        // 创建工作表
        const ws = XLSX.utils.aoa_to_sheet(rows);
        
        // 设置列宽
        ws['!cols'] = [
            { wch: 10 }, // 考场号列
            { wch: 15 }  // 教室号列
        ];
        
        // 设置样式
        const headerRange = XLSX.utils.decode_range(ws['!ref']);
        for (let C = 0; C <= headerRange.e.c; ++C) {
            const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
            if (cell) {
                cell.s = {
                    font: { bold: true },
                    alignment: { horizontal: 'center' },
                    fill: { fgColor: { rgb: "FFE0E0E0" } }
                };
            }
        }
        
        // 设置数据单元格样式
        for (let R = 1; R <= headerRange.e.r; ++R) {
            for (let C = 0; C <= headerRange.e.c; ++C) {
                const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
                if (cell) {
                    cell.s = {
                        alignment: { horizontal: 'center' }
                    };
                }
            }
        }
        
        // 将工作表添加到工作簿
        XLSX.utils.book_append_sheet(wb, ws, '教室配置');
        
        // 导出文件
        XLSX.writeFile(wb, '教室配置.xlsx');
    });

    // 教室配置文件上传区域点击事件
    classroomUploadArea.addEventListener('click', () => classroomFileInput.click());
    classroomUploadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        classroomFileInput.click();
    });

    // 教室配置文件拖放事件
    classroomUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        classroomUploadArea.classList.add('active');
    });

    classroomUploadArea.addEventListener('dragleave', () => {
        classroomUploadArea.classList.remove('active');
    });

    classroomUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        classroomUploadArea.classList.remove('active');
        
        if (e.dataTransfer.files.length > 0) {
            classroomFileInput.files = e.dataTransfer.files;
            handleClassroomFileSelect();
        }
    });

    // 教室配置文件选择事件
    classroomFileInput.addEventListener('change', handleClassroomFileSelect);

    function handleClassroomFileSelect() {
        if (classroomFileInput.files.length === 0) return;
        
        const file = classroomFileInput.files[0];
        classroomFileName.textContent = file.name;
        classroomFileSize.textContent = formatFileSize(file.size);
        classroomFileInfo.classList.remove('hidden');
        
        // 解析文件
        parseClassroomFile(file);
    }

    function parseClassroomFile(file) {
        classroomConfigData = null;
        
        if (file.name.toLowerCase().endsWith('.csv')) {
            parseClassroomCSV(file);
        } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
            parseClassroomExcel(file);
        } else {
            alert('不支持的文件格式。请上传CSV或Excel文件。');
        }
    }

    function parseClassroomCSV(file) {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            encoding: "UTF-8",
            complete: function(results) {
                if (results.data && results.data.length > 0) {
                    const headers = results.meta.fields || [];
                    showClassroomColumnSelector(headers, results.data);
                } else {
                    alert('CSV文件中未找到有效数据。');
                }
            },
            error: function(error) {
                alert('解析CSV文件时出错：' + error);
            }
        });
    }

    function parseClassroomExcel(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                
                // 获取第一个工作表
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // 转换为JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
                
                if (jsonData.length > 1) {
                    const headers = jsonData[0];
                    
                    // 转换为对象数组
                    const rows = [];
                    for (let i = 1; i < jsonData.length; i++) {
                        const row = {};
                        for (let j = 0; j < headers.length; j++) {
                            if (headers[j]) {
                                row[headers[j]] = jsonData[i][j] || '';
                            }
                        }
                        rows.push(row);
                    }
                    
                    showClassroomColumnSelector(headers, rows);
                } else {
                    alert('Excel文件中未找到有效数据。');
                }
            } catch (error) {
                alert('解析Excel文件时出错：' + error);
            }
        };
        
        reader.onerror = function() {
            alert('读取文件时出错。');
        };
        
        reader.readAsArrayBuffer(file);
    }

    function showClassroomColumnSelector(headers, data) {
        examRoomColumn.innerHTML = '';
        classroomColumn.innerHTML = '';
        
        // 添加默认选项
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- 请选择 --';
        
        examRoomColumn.appendChild(defaultOption.cloneNode(true));
        classroomColumn.appendChild(defaultOption.cloneNode(true));
        
        // 添加列选项
        headers.forEach((header, index) => {
            const option = document.createElement('option');
            option.value = header;
            option.textContent = header;
            
            examRoomColumn.appendChild(option.cloneNode(true));
            classroomColumn.appendChild(option.cloneNode(true));
            
            // 自动检测可能的考场号和教室号列
            if (typeof header === 'string') {
                const headerLower = header.toLowerCase();
                
                if (headerLower.includes('考场') || headerLower.includes('room') || 
                    headerLower.includes('考室')) {
                    examRoomColumn.value = header;
                }
                
                if (headerLower.includes('教室') || headerLower.includes('classroom') || 
                    headerLower.includes('教室号')) {
                    classroomColumn.value = header;
                }
            }
        });
        
        // 显示列选择器
        classroomColumnSelector.classList.remove('hidden');
        classroomDataPreview.classList.add('hidden');
        
        // 保存数据供后续使用
        classroomColumnSelector.dataset.data = JSON.stringify(data);
    }

    // 确认教室配置列选择
    confirmClassroomColumns.addEventListener('click', function() {
        const selectedExamRoomColumn = examRoomColumn.value;
        const selectedClassroomColumn = classroomColumn.value;
        
        if (!selectedExamRoomColumn || !selectedClassroomColumn) {
            alert('请选择考场号列和教室号列。');
            return;
        }
        
        try {
            const data = JSON.parse(classroomColumnSelector.dataset.data);
            
            // 预处理数据
            classroomConfigData = data.map(row => ({
                examRoom: row[selectedExamRoomColumn]?.toString() || '',
                classroom: row[selectedClassroomColumn]?.toString() || ''
            })).filter(item => item.examRoom && item.classroom);
            
            if (classroomConfigData.length === 0) {
                alert('未找到有效的教室配置数据。请确保选择了正确的列。');
                return;
            }
            
            // 显示数据预览
            showClassroomDataPreview(classroomConfigData);
            
        } catch (error) {
            alert('处理数据时出错：' + error);
        }
    });

    function showClassroomDataPreview(data) {
        // 更新数据计数
        classroomDataCount.textContent = `已成功导入 ${data.length} 条教室配置`;
        
        // 清空预览表格
        classroomPreviewTable.innerHTML = '';
        
        // 添加预览行（最多显示5行）
        const previewCount = Math.min(5, data.length);
        for (let i = 0; i < previewCount; i++) {
            const row = document.createElement('tr');
            
            const examRoomCell = document.createElement('td');
            examRoomCell.textContent = data[i].examRoom;
            row.appendChild(examRoomCell);
            
            const classroomCell = document.createElement('td');
            classroomCell.textContent = data[i].classroom;
            row.appendChild(classroomCell);
            
            classroomPreviewTable.appendChild(row);
        }
        
        // 如果有更多数据，添加省略提示
        if (data.length > previewCount) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 2;
            cell.textContent = `...还有 ${data.length - previewCount} 条数据`;
            cell.style.textAlign = 'center';
            row.appendChild(cell);
            classroomPreviewTable.appendChild(row);
        }
        
        // 显示数据预览，隐藏列选择器
        classroomColumnSelector.classList.add('hidden');
        classroomDataPreview.classList.remove('hidden');
        
        // 更新教室配置表格
        updateClassroomConfigTable(data);
    }

    function updateClassroomConfigTable(data) {
        const tbody = classroomConfigTable.querySelector('tbody');
        tbody.innerHTML = ''; // 清空现有配置
        
        // 添加新的配置
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.examRoom}</td>
                <td><input type="text" class="classroom-number" value="${item.classroom}"></td>
                <td>
                    <button type="button" class="btn-icon delete-classroom">❌</button>
                </td>
            `;
            
            // 添加删除按钮事件监听
            const deleteBtn = row.querySelector('.delete-classroom');
            deleteBtn.addEventListener('click', function() {
                if (confirm('确定要删除这个教室配置吗？')) {
                    row.remove();
                    updateClassroomConfigurations();
                }
            });
            
            tbody.appendChild(row);
        });
        
        // 更新配置存储
        updateClassroomConfigurations();
    }

    function updateClassroomConfigurations() {
        classroomConfigurations.clear();
        const rows = classroomConfigTable.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const examRoom = row.querySelector('td:first-child').textContent;
            const classroom = row.querySelector('.classroom-number').value;
            if (examRoom && classroom) {
                classroomConfigurations.set(examRoom, classroom);
            }
        });
    }

    // 清除教室配置文件
    clearClassroomFile.addEventListener('click', function() {
        classroomFileInput.value = '';
        classroomFileInfo.classList.add('hidden');
        classroomConfigData = null;
    });

    // 监听教室号输入变化
    classroomConfigTable.addEventListener('input', function(e) {
        if (e.target.classList.contains('classroom-number')) {
            updateClassroomConfigurations();
        }
    });

    // 导入考场配置按钮点击事件
    importRoomConfigBtn.addEventListener('click', function() {
        roomConfigUploadArea.classList.remove('hidden');
        roomConfigFileInfo.classList.add('hidden');
    });

    // 考场配置文件上传区域点击事件
    roomConfigUploadArea.addEventListener('click', () => document.getElementById('roomConfigFileInput').click());
    document.getElementById('roomConfigUploadBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('roomConfigFileInput').click();
    });

    // 考场配置文件拖放事件
    roomConfigUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        roomConfigUploadArea.classList.add('active');
    });

    roomConfigUploadArea.addEventListener('dragleave', () => {
        roomConfigUploadArea.classList.remove('active');
    });

    roomConfigUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        roomConfigUploadArea.classList.remove('active');
        
        if (e.dataTransfer.files.length > 0) {
            document.getElementById('roomConfigFileInput').files = e.dataTransfer.files;
            handleRoomConfigFileSelect();
        }
    });

    // 考场配置文件选择事件
    document.getElementById('roomConfigFileInput').addEventListener('change', handleRoomConfigFileSelect);

    function handleRoomConfigFileSelect() {
        const fileInput = document.getElementById('roomConfigFileInput');
        if (fileInput.files.length === 0) return;
        
        const file = fileInput.files[0];
        document.getElementById('roomConfigFileName').textContent = file.name;
        document.getElementById('roomConfigFileSize').textContent = formatFileSize(file.size);
        document.getElementById('roomConfigFileInfo').classList.remove('hidden');
        
        // 解析文件
        parseRoomConfigFile(file);
    }

    function parseRoomConfigFile(file) {
        roomConfigData = null;
        
        if (file.name.toLowerCase().endsWith('.csv')) {
            parseRoomConfigCSV(file);
        } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
            parseRoomConfigExcel(file);
        } else {
            alert('不支持的文件格式。请上传CSV或Excel文件。');
        }
    }

    function parseRoomConfigCSV(file) {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            encoding: "UTF-8",
            complete: function(results) {
                if (results.data && results.data.length > 0) {
                    const headers = results.meta.fields || [];
                    showRoomConfigColumnSelector(headers, results.data);
                } else {
                    alert('CSV文件中未找到有效数据。');
                }
            },
            error: function(error) {
                alert('解析CSV文件时出错：' + error);
            }
        });
    }

    function parseRoomConfigExcel(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                
                // 获取第一个工作表
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // 转换为JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
                
                if (jsonData.length > 1) {
                    const headers = jsonData[0];
                    
                    // 转换为对象数组
                    const rows = [];
                    for (let i = 1; i < jsonData.length; i++) {
                        const row = {};
                        for (let j = 0; j < headers.length; j++) {
                            if (headers[j]) {
                                row[headers[j]] = jsonData[i][j] || '';
                            }
                        }
                        rows.push(row);
                    }
                    
                    showRoomConfigColumnSelector(headers, rows);
                } else {
                    alert('Excel文件中未找到有效数据。');
                }
            } catch (error) {
                alert('解析Excel文件时出错：' + error);
            }
        };
        
        reader.onerror = function() {
            alert('读取文件时出错。');
        };
        
        reader.readAsArrayBuffer(file);
    }

    function showRoomConfigColumnSelector(headers, data) {
        const startRoomColumn = document.getElementById('startRoomColumn');
        const endRoomColumn = document.getElementById('endRoomColumn');
        const roomSizeColumn = document.getElementById('roomSizeColumn');
        
        // 清空现有选项
        startRoomColumn.innerHTML = '';
        endRoomColumn.innerHTML = '';
        roomSizeColumn.innerHTML = '';
        
        // 添加默认选项
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- 请选择 --';
        
        startRoomColumn.appendChild(defaultOption.cloneNode(true));
        endRoomColumn.appendChild(defaultOption.cloneNode(true));
        roomSizeColumn.appendChild(defaultOption.cloneNode(true));
        
        // 添加列选项
        headers.forEach((header, index) => {
            const option = document.createElement('option');
            option.value = header;
            option.textContent = header;
            
            startRoomColumn.appendChild(option.cloneNode(true));
            endRoomColumn.appendChild(option.cloneNode(true));
            roomSizeColumn.appendChild(option.cloneNode(true));
            
            // 自动检测可能的列
            if (typeof header === 'string') {
                const headerLower = header.toLowerCase();
                
                if (headerLower.includes('起始') || headerLower.includes('开始') || 
                    headerLower.includes('start')) {
                    startRoomColumn.value = header;
                }
                
                if (headerLower.includes('结束') || headerLower.includes('end')) {
                    endRoomColumn.value = header;
                }
                
                if (headerLower.includes('人数') || headerLower.includes('size') || 
                    headerLower.includes('capacity')) {
                    roomSizeColumn.value = header;
                }
            }
        });
        
        // 显示列选择器
        roomConfigColumnSelector.classList.remove('hidden');
        
        // 保存数据供后续使用
        roomConfigColumnSelector.dataset.data = JSON.stringify(data);
    }

    // 确认考场配置列选择
    document.getElementById('confirmRoomConfigColumns').addEventListener('click', function() {
        const selectedStartColumn = document.getElementById('startRoomColumn').value;
        const selectedEndColumn = document.getElementById('endRoomColumn').value;
        const selectedSizeColumn = document.getElementById('roomSizeColumn').value;
        
        if (!selectedStartColumn || !selectedEndColumn || !selectedSizeColumn) {
            alert('请选择起始考场号列、结束考场号列和考场人数列。');
            return;
        }
        
        try {
            const data = JSON.parse(roomConfigColumnSelector.dataset.data);
            
            // 预处理数据
            roomConfigData = data.map(row => ({
                startRoom: parseInt(row[selectedStartColumn]),
                endRoom: parseInt(row[selectedEndColumn]),
                size: parseInt(row[selectedSizeColumn])
            })).filter(config => 
                !isNaN(config.startRoom) && 
                !isNaN(config.endRoom) && 
                !isNaN(config.size) && 
                config.startRoom > 0 && 
                config.endRoom > 0 && 
                config.size > 0
            );
            
            if (roomConfigData.length === 0) {
                alert('未找到有效的考场配置数据。请确保选择了正确的列。');
                return;
            }
            
            // 更新考场配置表格
            updateRoomConfigTable(roomConfigData);
            
            // 隐藏列选择器
            roomConfigColumnSelector.classList.add('hidden');
            
            // 保存配置
            saveConfigBtn.click();
            
        } catch (error) {
            alert('处理数据时出错：' + error);
        }
    });

    function updateRoomConfigTable(data) {
        const tbody = roomConfigTable.querySelector('tbody');
        tbody.innerHTML = ''; // 清空现有配置
        
        // 添加新的配置
        data.forEach(config => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <span class="range-text">${config.startRoom}-${config.endRoom}</span>
                    <input type="number" class="start-range" value="${config.startRoom}" min="1" style="display:none;">
                    <span style="display:none;">-</span>
                    <input type="number" class="end-range" value="${config.endRoom}" min="1" style="display:none;">
                </td>
                <td>
                    <input type="number" class="room-size" value="${config.size}" min="1" max="2000">
                </td>
                <td>
                    <button type="button" class="btn-icon edit-config">✏️</button>
                    <button type="button" class="btn-icon delete-config">❌</button>
                </td>
            `;
            
            // 添加事件监听器
            addConfigRowEventListeners(row);
            
            tbody.appendChild(row);
        });
    }

    // 清除考场配置文件
    document.getElementById('clearRoomConfigFile').addEventListener('click', function() {
        document.getElementById('roomConfigFileInput').value = '';
        document.getElementById('roomConfigFileInfo').classList.add('hidden');
        roomConfigData = null;
    });
}); 