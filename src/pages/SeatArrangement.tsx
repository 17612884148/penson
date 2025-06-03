import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Button, Upload, message } from 'antd';
import { UploadOutlined, DownloadOutlined, SaveOutlined } from '@ant-design/icons';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType } from 'docx';

interface Student {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'empty';
  row: number;
  col: number;
}

const SeatArrangement: React.FC = () => {
  const [seats, setSeats] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initializeSeats();
  }, []);

  const initializeSeats = () => {
    const initialSeats: Student[] = [];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 8; col++) {
        initialSeats.push({
          id: `${row}-${col}`,
          name: '空',
          gender: 'empty',
          row,
          col,
        });
      }
    }
    setSeats(initialSeats);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const sourceId = result.source.droppableId;
    const destId = result.destination.droppableId;
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    const newSeats = [...seats];
    const [movedSeat] = newSeats.splice(sourceIndex, 1);
    newSeats.splice(destIndex, 0, movedSeat);

    setSeats(newSeats);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const newSeats = [...seats];
        jsonData.forEach((student: any, index: number) => {
          if (index < newSeats.length) {
            newSeats[index] = {
              ...newSeats[index],
              name: student.name || '空',
              gender: student.gender === '男' ? 'male' : student.gender === '女' ? 'female' : 'empty',
            };
          }
        });

        setSeats(newSeats);
        message.success('学生名单导入成功！');
      } catch (error) {
        message.error('文件格式错误，请确保上传正确的Excel文件！');
      }
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const exportToWord = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: '班级座位表',
            heading: 'Heading1',
          }),
          new Table({
            rows: Array.from({ length: 7 }, (_, rowIndex) => {
              return new TableRow({
                children: Array.from({ length: 8 }, (_, colIndex) => {
                  const seat = seats.find(s => s.row === rowIndex && s.col === colIndex);
                  return new TableCell({
                    children: [
                      new Paragraph({
                        text: seat?.name || '空',
                      }),
                    ],
                    width: {
                      size: 1,
                      type: WidthType.INCH,
                    },
                  });
                }),
              });
            }),
          }),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    saveAs(blob, '班级座位表.docx');
  };

  const saveSeats = () => {
    localStorage.setItem('seats', JSON.stringify(seats));
    message.success('座位表保存成功！');
  };

  return (
    <div className="seat-arrangement">
      <div className="controls">
        <Upload
          beforeUpload={handleFileUpload}
          showUploadList={false}
          accept=".xlsx,.xls"
        >
          <Button icon={<UploadOutlined />}>导入学生名单</Button>
        </Upload>
        <Button icon={<SaveOutlined />} onClick={saveSeats}>
          保存座位表
        </Button>
        <Button icon={<DownloadOutlined />} onClick={exportToWord}>
          导出为Word
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="seats">
          {(provided) => (
            <div
              className="seats-grid"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {seats.map((seat, index) => (
                <Draggable key={seat.id} draggableId={seat.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`seat ${seat.gender}`}
                    >
                      {seat.name}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default SeatArrangement; 