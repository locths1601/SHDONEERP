# ezHR BaseDataGrid - Enterprise Spreadsheet & Data View Suite

Bộ component **BaseDataGrid** được thiết kế và chuẩn hóa nhằm cung cấp trải nghiệm bảng lưới dữ liệu hiện đại dạng Spreadsheet / Airtable / Base cho toàn bộ ứng dụng ezHR.

---

## 🌟 Chức năng tiện ích chuyên sâu

1. **Cố định cột linh hoạt (Freeze / Column Pinning)**:
   - Hỗ trợ ghim cố định một hoặc nhiều cột bên trái (`pinned: 'left'`) khi cuộn ngang.
   - Tự động tính toán vị trí offset pixel (`sticky left`) cho từng cột đã ghim.
   - Cột cố định ngoài cùng có viền đổ bóng ranh giới chuẩn mực (`shadow-[2px_0_5px_-1px_rgba(0,0,0,0.06)] border-r-2 border-r-blue-500/40`), ngăn nội dung cuộn bên dưới bị lộ nhờ nền đặc (`bg-white dark:bg-slate-900`).
   - Cố định / Bỏ cố định nhanh chóng qua Menu 3 chấm trên tiêu đề cột hoặc Popover thanh công cụ.

2. **Tùy chỉnh Ẩn / Hiện cột (Column Visibility)**:
   - Popover checklist hỗ trợ bật/tắt hiển thị từng cột theo ý muốn.
   - Tích hợp ô tìm kiếm tên cột nhanh khi bảng có nhiều cột.
   - Phím tắt tiện lợi: *"Hiện tất cả"* và *"Đặt lại mặc định"*.
   - Khóa các cột bắt buộc không cho ẩn (`hideable: false`).

3. **Sắp xếp đa chiều (Multi-way Sorting)**:
   - Nhấp trực tiếp vào tiêu đề cột để xoay vòng trạng thái: **Tăng dần (A → Z) ➔ Giảm dần (Z → A) ➔ Hủy sắp xếp**, đi kèm biểu tượng mũi tên định hướng.
   - Menu 3 chấm trên từng cột cung cấp tùy chọn sắp xếp riêng biệt.
   - Popover sắp xếp trên thanh công cụ cho phép chọn cột và chiều sắp xếp tổng thể.

4. **Bộ lọc dữ liệu nâng cao (Multi-Condition & Quick Filter)**:
   - **Bộ lọc nhiều điều kiện**: Cho phép thêm nhiều dòng điều kiện lọc với các toán tử phong phú (`chứa`, `không chứa`, `bằng`, `khác`, `bắt đầu bằng`, `kết thúc bằng`, `trống`, `không trống`, `lớn hơn`, `nhỏ hơn`).
   - **Lọc nhanh theo cột**: Tìm kiếm từ khóa tức thì trên từng cột.
   - **Thanh Tag lọc hoạt động (Filter Chips Bar)**: Hiển thị trực quan các điều kiện đang áp dụng ngay dưới thanh công cụ, hỗ trợ xóa nhanh 1-click hoặc nút *"Xóa tất cả bộ lọc"*.

5. **Group by đa tầng (Collapsible Grouping)**:
   - Group by linh hoạt theo bất kỳ trường nào (`PIC`, `Dự án`, `Phase`, `Khách hàng`, `Trạng thái`...).
   - Hỗ trợ đóng/mở từng nhóm mượt mà (Accordion collapse).
   - Thanh tiêu đề nhóm tự động ghim dính khi cuộn (`sticky top-9`), kèm avatar đại diện và số lượng bản ghi trong nhóm.

6. **Ghim cố định Header & Footer tràn viền (Sticky Header & Footer)**:
   - Header cố định trên đỉnh (`sticky top-0 bg-white dark:bg-slate-900`).
   - Summary Footer ghim sát đáy màn hình (`sticky bottom-0 bg-white dark:bg-slate-900 mt-auto`).
   - Tối ưu 100% Full-Width và Full-Height, triệt tiêu khoảng trống thừa ở 2 bên và đáy bảng.

7. **Phân chia ô chuẩn Spreadsheet / Base**:
   - Vạch kẻ dọc tinh tế (`divide-x divide-slate-200/80 dark:divide-slate-800`).
   - Hỗ trợ ô chọn Checkbox hàng loạt (Select All / Row Selection).
   - Cột STT đánh số tự động.

8. **Tùy chỉnh độ cao dòng (Row Height Mode)**:
   - **Compact (Thu gọn)**: 32px (`h-8 text-xs`) — hiển thị mật độ thông tin tối đa.
   - **Normal (Tiêu chuẩn)**: 40px (`h-10 text-xs`) — cân bằng, dễ đọc.
   - **Tall (Rộng rãi)**: 48px (`h-12 text-sm`) — thoáng đãng.

9. **Tô màu có điều kiện (Conditional Formatting)**:
   - Cho phép người dùng tự cấu hình các quy tắc tô màu động (Dynamic Color Rules) cho toàn bộ dòng (`scope: 'row'`) hoặc từng ô cụ thể (`scope: fieldKey`).
   - Đa dạng toán tử so sánh thông minh:
     - **Văn bản (Text)**: `contains`, `not_contains`, `equals`, `not_equals`
     - **Thời gian (Date)**: `before`, `after`, `is_today`, `is_yesterday`, `is_tomorrow`
     - **Số học (Number)**: `greater_than`, `less_than`
     - **Ô trống (Empty)**: `is_empty`, `is_not_empty`
   - Bảng màu Pastel chuẩn Enterprise (Mint, Sky, Emerald, Amber, Rose, Purple, Orange, Slate) tối ưu hiển thị cho cả giao diện Sáng và Tối (Dark Mode).
   - Tự động lưu cấu hình theo bảng vào `localStorage` qua thuộc tính `gridStorageKey`.

10. **Tương tác chuẩn Excel / Google Sheets (Excel-Grade Interactivity)**:
    - **Cell & Range Selection**: Bấm chọn 1 ô (viền xanh lá chuối `#107c41`/emerald), nhấp giữ chuột kéo chọn vùng $M \times N$, `Shift + Click` hoặc `Shift + Arrow Keys` để mở rộng vùng chọn. Bấm STT chọn cả hàng, bấm tiêu đề chọn cả cột.
    - **Copy / Paste chuẩn Excel**: `Ctrl+C` xuất bảng Tab-Separated Values (`TSV`) tương thích 100% với Excel/Sheets, kèm viền đứt đoạn chạy quanh vùng copy (Marching Ants). `Ctrl+V` dán thông minh (Smart Fill 1 giá trị vào cả vùng hoặc dán ma trận nhiều ô).
    - **Kéo thả điền tự động (Drag-to-fill)**: Nút chấm vuông (Fill Handle) ở góc dưới bên phải ô/vùng chọn. Kéo dọc/ngang để copy-fill hoặc tự động tăng cấp số cộng (Sequence Fill cho Số và Ngày tháng).
    - **Phím tắt & Chỉnh sửa trực tiếp (Inline Editing)**:
      - Di chuyển ô: `Arrow Keys`, `Tab` (qua phải), `Shift+Tab` (qua trái), `Enter` (xuống dưới), `Shift+Enter` (lên trên).
      - Kích hoạt sửa: Nhấp đúp chuột, bấm `Enter`, `F2`, hoặc gõ ký tự bất kỳ. Bấm `Esc` để hủy.
      - Xóa nhanh: Bấm `Delete` hoặc `Backspace` để xóa dữ liệu trong toàn bộ vùng chọn.
      - Hoàn tác / Làm lại: `Ctrl+Z` (Undo), `Ctrl+Y` / `Ctrl+Shift+Z` (Redo), kèm nút bấm trực quan trên Toolbar.
    - **Thanh thống kê tức thì (Quick Range Stats)**: Khi chọn nhiều ô số, Footer tự động tính và hiển thị `Số ô`, `Tổng (Sum)` và `Trung bình cộng (Average)`.

---

## 🚀 Hướng dẫn sử dụng nhanh

```tsx
import React, { useState } from 'react';
import {
  BaseDataGrid,
  DataGridColumn,
  DataGridGroupOption,
  CellChange,
} from '@/components/common/datagrid';
import { FolderGit2, Calendar, User, Tag } from 'lucide-react';

interface ProjectTask {
  id: string;
  code: string;
  title: string;
  assignee: string;
  project: string;
  priority: number;
  dueDate: string;
}

const columns: DataGridColumn<ProjectTask>[] = [
  {
    id: 'code',
    header: 'Mã',
    accessorKey: 'code',
    width: 100,
    pinned: 'left',
    hideable: false,
    readOnly: true, // Ô chỉ đọc, không cho sửa/paste
  },
  {
    id: 'title',
    header: 'Tên nhiệm vụ',
    accessorKey: 'title',
    width: 260,
    editable: true, // Cho phép chỉnh sửa trực tiếp dạng text
  },
  {
    id: 'priority',
    header: 'Mức ưu tiên',
    accessorKey: 'priority',
    width: 120,
    editorType: 'number', // Input dạng số
    editable: true,
  },
  {
    id: 'assignee',
    header: 'Người phụ trách',
    accessorKey: 'assignee',
    width: 180,
    icon: User,
    editable: true,
    editorType: 'select',
    editorOptions: [
      { label: 'Nguyễn Văn A', value: 'Nguyễn Văn A' },
      { label: 'Trần Thị B', value: 'Trần Thị B' },
    ],
  },
  {
    id: 'dueDate',
    header: 'Hạn chót',
    accessorKey: 'dueDate',
    width: 140,
    icon: Calendar,
    editorType: 'date',
    editable: true,
  },
];

export function MyTaskPage() {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);

  // Xử lý cập nhật thay đổi ô (từ Edit, Paste, Drag-to-fill, Clear, Undo/Redo)
  const handleCellsChange = (changes: CellChange<ProjectTask>[]) => {
    setTasks((prev) => {
      const next = [...prev];
      changes.forEach((ch) => {
        const item = next.find((t) => t.id === ch.rowKey);
        if (item) {
          (item as any)[ch.field] = ch.newValue;
        }
      });
      return next;
    });
  };

  return (
    <div className="w-full h-[calc(100vh-60px)] flex flex-col bg-white dark:bg-slate-950">
      <BaseDataGrid<ProjectTask>
        data={tasks}
        columns={columns}
        keyExtractor={(item) => item.id}
        enableExcelMode={true} // Bật Chức năng Excel (Mặc định: true)
        editable={true} // Bật chỉnh sửa bảng
        onCellsChange={handleCellsChange}
        addNewLabel="Tạo nhiệm vụ mới"
      />
    </div>
  );
}
```

---

## ⌨️ Bảng phím tắt chuẩn Excel (Keyboard Shortcuts)

> **Lưu ý**: Phím tắt `Ctrl + F` / `Ctrl + H` (Tìm kiếm & Thay thế) mặc định **bị tắt**.
> Để bật lại, truyền `enableFindReplace={true}` cho `BaseDataGrid`. Khi tắt, trình duyệt
> sẽ giữ find/replace gốc của nó làm fallback. Nút trên toolbar / formula bar và
> mục menu chuột phải cũng tự động ẩn theo prop này.

| Phím tắt | Thao tác | Mô tả |
| :--- | :--- | :--- |
| `↑` `↓` `←` `→` | Di chuyển Focus | Di chuyển ô đang chọn lên / xuống / trái / phải |
| `Shift + Mũi tên` | Mở rộng vùng chọn | Mở rộng hoặc thu hẹp vùng chọn nhiều ô ($M \times N$) |
| `Shift + Click` | Chọn dải ô | Mở rộng vùng chọn từ ô Focus ban đầu đến ô vừa click |
| `Tab` / `Shift + Tab` | Qua phải / Qua trái | Chuyển ô tiếp theo hoặc ô trước đó (tự động xuống dòng) |
| `Enter` / `Shift + Enter` | Xuống dưới / Lên trên | Lưu chỉnh sửa và chuyển ô bên dưới / bên trên |
| `Enter` / `F2` / Gõ ký tự | Chỉnh sửa trực tiếp | Mở Inline Editor tại ô đang chọn |
| `Escape` | Hủy thao tác | Hủy chỉnh sửa ô, hoặc xóa viền Copy (Marching Ants) |
| `Ctrl + C` / `Cmd + C` | Sao chép | Xuất định dạng TSV chuẩn sang Clipboard của hệ thống |
| `Ctrl + V` / `Cmd + V` | Dán dữ liệu | Dán giá trị hoặc bảng từ Excel/Sheets vào DataGrid |
| `Delete` / `Backspace` | Xóa dữ liệu | Xóa giá trị của toàn bộ các ô trong vùng đang chọn |
| `Ctrl + Z` / `Cmd + Z` | Hoàn tác (Undo) | Quay lại trạng thái trước khi sửa / paste / drag-fill |
| `Ctrl + Y` / `Ctrl+Shift+Z`| Làm lại (Redo) | Phục hồi lại thao tác vừa Undo |

---

## 📦 Các file cấu thành

- [`types.ts`](./types.ts): Định nghĩa kiểu TypeScript gốc mở rộng của DataGrid.
- [`excelTypes.ts`](./excelTypes.ts): Định nghĩa kiểu dữ liệu cho tọa độ ô (`CellCoord`), dải ô (`CellRange`), thay đổi (`CellChange`), cấu hình Editor và lịch sử Undo/Redo.
- [`excelUtils.ts`](./excelUtils.ts): Thư viện tính toán tọa độ ma trận, chuẩn hóa Range, phân tích TSV Clipboard, nhận diện cấp số cộng / chuỗi ngày tháng (`extrapolateSequence`) và ép kiểu dữ liệu thông minh.
- [`ExcelCellEditor.tsx`](./ExcelCellEditor.tsx): Component Inline Editor hỗ trợ Text, Number, Date, Select dropdown và Custom Editor.
- [`useExcelGrid.ts`](./useExcelGrid.ts): Custom Hook quản lý toàn bộ trạng thái Excel (Selection, Drag-to-fill, Marching Ants, Clipboard, Edit mode, Undo/Redo stack, Phím tắt).
- [`DataGridToolbar.tsx`](./DataGridToolbar.tsx): Thanh điều khiển đa năng tích hợp nút Undo / Redo, Popover bộ lọc điều kiện, ghim/ẩn cột, sắp xếp, Group by, độ cao dòng và Filter Chips Bar.
- [`DataGridActionsCell.tsx`](./DataGridActionsCell.tsx): Component chuẩn hóa cột Thao tác (View / Preview Drawer / Edit / Delete / ExternalLink) tích hợp Tooltip, stopPropagation và phân quyền `Can`.
- [`BaseDataGrid.tsx`](./BaseDataGrid.tsx): Bảng lưới chính kết hợp tương tác chuẩn Excel, sticky left freeze pane, menu 3 chấm trên tiêu đề cột, sticky header/footer và thống kê số liệu tự động.
- [`index.ts`](./index.ts): Barrel export toàn bộ components, hooks và utilities.
