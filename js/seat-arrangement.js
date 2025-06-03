// 初始化座位数据
let seats = [];
let ROWS = 7;
let COLS = 8;

// 初始化座位
function initializeSeats() {
    seats = [];
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            seats.push({
                id: `${row}-${col}`,
                name: '空',
                gender: 'empty',
                row,
                col
            });
        }
    }
    renderSeats();
}

// 更新座位布局
function updateSeatLayout() {
    const newRows = parseInt(document.getElementById('rowCount').value);
    const newCols = parseInt(document.getElementById('colCount').value);
    
    if (newRows < 1 || newRows > 20 || newCols < 1 || newCols > 20) {
        alert('行列数必须在1-20之间！');
        return;
    }
    
    ROWS = newRows;
    COLS = newCols;
    
    // 保存当前座位数据
    const currentSeats = new Map(seats.map(seat => [seat.id, seat]));
    
    // 创建新的座位数组
    const newSeats = [];
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const id = `${row}-${col}`;
            // 如果存在旧的座位数据，则保留
            if (currentSeats.has(id)) {
                newSeats.push(currentSeats.get(id));
            } else {
                newSeats.push({
                    id,
                    name: '空',
                    gender: 'empty',
                    row,
                    col
                });
            }
        }
    }
    
    seats = newSeats;
    renderSeats();
}

// 渲染座位
function renderSeats() {
    const container = document.getElementById('seatsContainer');
    container.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
    container.innerHTML = '';
    
    seats.forEach(seat => {
        const seatElement = document.createElement('div');
        seatElement.className = `seat ${seat.gender}`;
        seatElement.draggable = true;
        seatElement.dataset.id = seat.id;
        
        seatElement.addEventListener('dragstart', handleDragStart);
        seatElement.addEventListener('dragend', handleDragEnd);
        seatElement.addEventListener('dragover', handleDragOver);
        seatElement.addEventListener('drop', handleDrop);
        
        // 添加学生信息显示
        const studentInfo = document.createElement('div');
        studentInfo.className = 'student-info';
        studentInfo.textContent = seat.name;
        seatElement.appendChild(studentInfo);
        
        container.appendChild(seatElement);
    });
}

// 拖拽相关事件处理
let draggedElement = null;

function handleDragStart(e) {
    draggedElement = this;
    this.style.opacity = '0.4';
}

function handleDragEnd(e) {
    this.style.opacity = '1';
    draggedElement = null;
}

function handleDragOver(e) {
    e.preventDefault();
    if (this !== draggedElement) {
        this.style.border = '2px dashed #666';
    }
}

function handleDrop(e) {
    e.preventDefault();
    this.style.border = '';
    
    if (this === draggedElement) return;
    
    const sourceId = draggedElement.dataset.id;
    const targetId = this.dataset.id;
    
    const sourceIndex = seats.findIndex(s => s.id === sourceId);
    const targetIndex = seats.findIndex(s => s.id === targetId);
    
    // 交换座位
    const temp = seats[sourceIndex];
    seats[sourceIndex] = seats[targetIndex];
    seats[targetIndex] = temp;
    
    renderSeats();
}

// 导入学生名单
document.getElementById('studentList').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            // 清空现有座位
            seats = seats.map(seat => ({
                ...seat,
                name: '空',
                gender: 'empty'
            }));
            
            // 更新座位数据
            jsonData.forEach((student, index) => {
                if (index < seats.length) {
                    // 获取Excel中的列名（第一行）
                    const nameColumn = Object.keys(student)[0];
                    const genderColumn = Object.keys(student)[1];
                    
                    // 更新座位信息
                    seats[index] = {
                        ...seats[index],
                        name: student[nameColumn] || '空',
                        gender: student[genderColumn] === '男' ? 'male' : 
                               student[genderColumn] === '女' ? 'female' : 'empty'
                    };
                }
            });
            
            renderSeats();
            alert('学生名单导入成功！');
        } catch (error) {
            console.error('导入错误:', error);
            alert('文件格式错误，请确保上传正确的Excel文件！\nExcel文件格式要求：\n- 第一列：姓名\n- 第二列：性别（"男"或"女"）');
        }
    };
    reader.readAsArrayBuffer(file);
});

// 保存座位表
function saveSeats() {
    const className = document.getElementById('className').value;
    localStorage.setItem('seats', JSON.stringify(seats));
    localStorage.setItem('seatLayout', JSON.stringify({ 
        rows: ROWS, 
        cols: COLS,
        className: className 
    }));
    alert('座位表保存成功！');
}

// 清空座位
function clearSeats() {
    if (confirm('确定要清空所有座位吗？此操作不可恢复！')) {
        seats = seats.map(seat => ({
            ...seat,
            name: '空',
            gender: 'empty'
        }));
        renderSeats();
        alert('座位已清空！');
    }
}

// 导出为Word
async function exportToWord() {
    try {
        if (!window.docx) {
            throw new Error('docx库加载失败，请刷新页面重试');
        }

        const { 
            Document, 
            Packer, 
            Paragraph, 
            Table, 
            TableRow, 
            TableCell, 
            WidthType, 
            AlignmentType, 
            HeadingLevel,
            PageOrientation,
            BorderStyle,
            PageSize,
            TextRun,
            FontSize
        } = window.docx;
        
        // 获取班级名称
        let className = document.getElementById('className').value.trim();
        if (!className) {
            className = '班级座位表';
        }
        
        // 创建文档
        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: {
                            top: 720,     // 0.5英寸
                            right: 720,    // 0.5英寸
                            bottom: 720,   // 0.5英寸
                            left: 720,     // 0.5英寸
                            header: 360,   // 0.25英寸
                            footer: 360,   // 0.25英寸
                            gutter: 0
                        },
                        size: PageSize.A4,
                        orientation: PageOrientation.LANDSCAPE
                    }
                },
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: className,
                                size: 32, // 16pt
                                bold: true
                            })
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: {
                            after: 400,
                            line: 360,
                        },
                    }),
                    new Table({
                        width: {
                            size: 100,
                            type: WidthType.PERCENTAGE,
                        },
                        rows: Array.from({ length: ROWS }, (_, rowIndex) => {
                            return new TableRow({
                                children: Array.from({ length: COLS }, (_, colIndex) => {
                                    const seat = seats.find(s => s.row === rowIndex && s.col === colIndex);
                                    return new TableCell({
                                        children: [
                                            new Paragraph({
                                                children: [
                                                    new TextRun({
                                                        text: seat?.name || '空',
                                                        size: 24, // 12pt
                                                        bold: seat?.name !== '空'
                                                    })
                                                ],
                                                alignment: AlignmentType.CENTER,
                                                spacing: {
                                                    line: 360,
                                                },
                                            }),
                                        ],
                                        width: {
                                            size: 100 / COLS,
                                            type: WidthType.PERCENTAGE,
                                        },
                                        borders: {
                                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                        },
                                    });
                                }),
                            });
                        }),
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `共 ${ROWS} 行 ${COLS} 列，${seats.filter(s => s.name !== '空').length} 名学生`,
                                size: 20, // 10pt
                                color: "666666"
                            })
                        ],
                        alignment: AlignmentType.RIGHT,
                        spacing: {
                            before: 400,
                            line: 360,
                        },
                    }),
                ],
            }],
        });
        
        // 生成文档
        const blob = await Packer.toBlob(doc);
        
        // 使用FileSaver保存文件
        saveAs(blob, `${className}.docx`);
        
        alert('座位表导出成功！');
    } catch (error) {
        console.error('导出错误:', error);
        alert('导出失败：' + error.message);
    }
}

// 页面加载时初始化
window.addEventListener('load', function() {
    // 尝试从localStorage加载保存的座位数据和布局
    const savedSeats = localStorage.getItem('seats');
    const savedLayout = localStorage.getItem('seatLayout');
    
    if (savedLayout) {
        const layout = JSON.parse(savedLayout);
        ROWS = layout.rows;
        COLS = layout.cols;
        document.getElementById('rowCount').value = ROWS;
        document.getElementById('colCount').value = COLS;
        
        // 恢复班级名称
        if (layout.className) {
            document.getElementById('className').value = layout.className;
        }
    }
    
    if (savedSeats) {
        seats = JSON.parse(savedSeats);
    } else {
        initializeSeats();
    }
    renderSeats();
}); 