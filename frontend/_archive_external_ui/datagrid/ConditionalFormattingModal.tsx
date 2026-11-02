import React, { useState } from 'react';
import {
  Palette,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  Eye,
} from 'lucide-react';
import {
  ConditionalColorRule,
  ColorScope,
  Operator,
  DataGridColumn,
} from './types';
import {
  OPERATOR_OPTIONS,
  PRESET_COLORS,
  getStyleFromColor,
} from './conditionalFormatting';
import { formatHeaderTitle } from './excelUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export interface ConditionalFormattingModalProps<T = any> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rules: ConditionalColorRule[];
  onRulesChange: (rules: ConditionalColorRule[]) => void;
  columns: DataGridColumn<T>[];
}

export function ConditionalFormattingModal<T = any>({
  open,
  onOpenChange,
  rules,
  onRulesChange,
  columns,
}: ConditionalFormattingModalProps<T>) {
  // Filter eligible columns for comparison (exclude stt and actions columns)
  const eligibleColumns = columns.filter((col) => {
    if (!col.id || col.id === '__stt__' || col.id === 'actions') return false;
    const headerStr = typeof col.header === 'string' ? col.header.toLowerCase().trim() : '';
    if (headerStr === 'thao tác' || headerStr === 'hành động') return false;
    return true;
  });

  // Eligible columns for coloring scope (exclude select / dropdown columns to preserve theme contrast)
  const eligibleScopeColumns = eligibleColumns.filter(
    (col) => col.editorType !== 'select' && !col.editorOptions
  );

  const defaultField = eligibleColumns[0]?.id || '';

  // Add new rule
  const handleAddRule = () => {
    const newRule: ConditionalColorRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      color: PRESET_COLORS[0].hex, // Default to Mint
      scope: 'row', // Default: whole row
      field: defaultField,
      operator: 'equals',
      value: '',
      enabled: true,
    };
    onRulesChange([...rules, newRule]);
  };

  // Update specific rule
  const handleUpdateRule = (id: string, updates: Partial<ConditionalColorRule>) => {
    onRulesChange(rules.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  // Delete specific rule
  const handleDeleteRule = (id: string) => {
    onRulesChange(rules.filter((r) => r.id !== id));
  };

  // Clear all rules
  const handleClearAll = () => {
    onRulesChange([]);
  };

  const enabledCount = rules.filter((r) => r.enabled).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl">
        {/* MODAL HEADER */}
        <DialogHeader className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>Tô màu có điều kiện</span>
                  {rules.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300 border border-blue-200 dark:border-blue-800">
                      {enabledCount}/{rules.length} quy tắc đang bật
                    </span>
                  )}
                </DialogTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Thiết lập màu nền tự động cho toàn bộ hàng hoặc từng ô cụ thể khi dữ liệu thỏa mãn điều kiện.
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* MODAL BODY: RULES LIST */}
        <div className="p-5 max-h-[62vh] overflow-y-auto space-y-4 scrollbar-thin">
          {rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/40 dark:bg-slate-900/20">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400 flex items-center justify-center mb-3 shadow-inner">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                Chưa có quy tắc tô màu nào
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
                Tạo các quy tắc như: <em>"Tô đỏ hàng có ưu tiên High"</em> hoặc <em>"Tô vàng ô có ngày kết thúc trước hôm nay"</em>.
              </p>
              <Button
                type="button"
                onClick={handleAddRule}
                size="sm"
                className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm quy tắc đầu tiên
              </Button>
            </div>
          ) : (
            rules.map((rule, idx) => {
              const currentOperator = OPERATOR_OPTIONS.find((o) => o.value === rule.operator);
              const requiresValue = currentOperator ? currentOperator.requiresValue : true;
              const previewStyle = getStyleFromColor(rule.color);

              return (
                <div
                  key={rule.id}
                  className={`p-4 rounded-xl border transition-all ${
                    rule.enabled
                      ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs'
                      : 'border-slate-200/50 dark:border-slate-800/40 bg-slate-50/60 dark:bg-slate-900/40 opacity-70'
                  }`}
                >
                  {/* RULE CARD HEADER */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <Checkbox
                        id={`enable-${rule.id}`}
                        checked={rule.enabled}
                        onCheckedChange={(checked) =>
                          handleUpdateRule(rule.id, { enabled: Boolean(checked) })
                        }
                      />
                      <label
                        htmlFor={`enable-${rule.id}`}
                        className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer select-none"
                      >
                        Quy tắc #{idx + 1}
                      </label>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${
                          rule.enabled
                            ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {rule.enabled ? 'Đang kích hoạt' : 'Đã tắt'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Xóa quy tắc này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* CONFIGURATION GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3.5">
                    {/* SCOPE SELECTOR */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-blue-500" />
                        <span>Phạm vi áp dụng (Scope)</span>
                      </label>
                      <select
                        value={rule.scope}
                        onChange={(e) => handleUpdateRule(rule.id, { scope: e.target.value as ColorScope })}
                        className="w-full h-8 px-2.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="row">Toàn bộ dòng (Entire Row)</option>
                        {eligibleScopeColumns.length > 0 && (
                          <optgroup label="Hoặc chỉ tô riêng một cột:">
                            {eligibleScopeColumns.map((col) => (
                              <option key={col.id} value={col.id}>
                                Ô thuộc cột: {typeof col.header === 'string' ? formatHeaderTitle(col.header) : col.id}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>

                    {/* TARGET FIELD SELECTOR */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <span>Trường dữ liệu kiểm tra</span>
                      </label>
                      <select
                        value={rule.field}
                        onChange={(e) => handleUpdateRule(rule.id, { field: e.target.value })}
                        className="w-full h-8 px-2.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      >
                        {eligibleColumns.map((col) => (
                          <option key={col.id} value={col.id}>
                            {typeof col.header === 'string' ? formatHeaderTitle(col.header) : col.id} ({col.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* OPERATOR SELECTOR */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Thao tác so sánh (Operator)
                      </label>
                      <select
                        value={rule.operator}
                        onChange={(e) =>
                          handleUpdateRule(rule.id, { operator: e.target.value as Operator })
                        }
                        className="w-full h-8 px-2.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      >
                        <optgroup label="Chuỗi ký tự & Văn bản">
                          {OPERATOR_OPTIONS.filter((o) => o.category === 'text').map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Thời gian / Ngày tháng">
                          {OPERATOR_OPTIONS.filter((o) => o.category === 'date').map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Số học">
                          {OPERATOR_OPTIONS.filter((o) => o.category === 'number').map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Khác / Ô trống">
                          {OPERATOR_OPTIONS.filter((o) => o.category === 'general').map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    {/* VALUE INPUT (Dynamic based on operator) */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Giá trị so sánh
                      </label>
                      {!requiresValue ? (
                        <div className="h-8 px-2.5 text-xs flex items-center rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 italic">
                          <Info className="w-3.5 h-3.5 mr-1.5 shrink-0 text-blue-500" />
                          <span>Tự động đối soát (Không cần nhập giá trị)</span>
                        </div>
                      ) : currentOperator?.category === 'date' ? (
                        <input
                          type="date"
                          value={rule.value || ''}
                          onChange={(e) => handleUpdateRule(rule.id, { value: e.target.value })}
                          className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      ) : currentOperator?.category === 'number' ? (
                        <input
                          type="number"
                          placeholder="Nhập số..."
                          value={rule.value ?? ''}
                          onChange={(e) => handleUpdateRule(rule.id, { value: e.target.value })}
                          className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <input
                          type="text"
                          placeholder="Nhập từ khóa so sánh..."
                          value={rule.value ?? ''}
                          onChange={(e) => handleUpdateRule(rule.id, { value: e.target.value })}
                          className="w-full h-8 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      )}
                    </div>
                  </div>

                  {/* COLOR SELECTION & LIVE PREVIEW */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Chọn màu nền (Pastel Palette)
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {PRESET_COLORS.map((preset) => {
                          const isSelected = rule.color.toLowerCase() === preset.hex.toLowerCase();
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => handleUpdateRule(rule.id, { color: preset.hex })}
                              style={{ backgroundColor: preset.hex, borderColor: preset.borderColor }}
                              className={`w-6 h-6 rounded-full border flex items-center justify-center transition-transform hover:scale-110 cursor-pointer shadow-2xs ${
                                isSelected ? 'ring-2 ring-blue-500 scale-110 shadow-xs' : ''
                              }`}
                              title={preset.name}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 text-slate-700" />}
                            </button>
                          );
                        })}

                        {/* Custom Color Input */}
                        <div className="relative inline-flex items-center ml-1">
                          <input
                            type="color"
                            value={rule.color.startsWith('#') ? rule.color : '#E6F7FF'}
                            onChange={(e) => handleUpdateRule(rule.id, { color: e.target.value })}
                            className="w-6 h-6 rounded-full overflow-hidden cursor-pointer border border-slate-300 dark:border-slate-600 p-0"
                            title="Tùy chọn mã màu khác"
                          />
                        </div>
                      </div>
                    </div>

                    {/* LIVE PREVIEW CHIP */}
                    <div className="sm:self-end">
                      <div
                        style={{
                          backgroundColor: previewStyle.backgroundColor,
                          borderColor: previewStyle.borderColor || '#cbd5e1',
                        }}
                        className="px-3 py-1 rounded-lg border text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <Eye className="w-3 h-3 text-slate-500" />
                        <span>Xem trước mẫu tô màu</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* MODAL FOOTER */}
        <DialogFooter className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex items-center justify-between sm:justify-between w-full">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddRule}
              className="text-xs font-bold gap-1.5 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 dark:text-sky-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm quy tắc mới
            </Button>

            {rules.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Xóa tất cả
              </Button>
            )}
          </div>

          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            size="sm"
            className="text-xs font-bold px-4 bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
          >
            Áp dụng & Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default ConditionalFormattingModal;
