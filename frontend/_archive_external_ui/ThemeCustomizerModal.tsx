import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { THEME_PRESETS, type ThemePreset, type CustomBrandColor } from '@/types/theme';
import { Palette, Check, X, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface ColorPickerDropdownProps {
  color: string;
  onChange: (hex: string) => void;
  presetPalette?: string[];
  align?: 'start' | 'center' | 'end';
}

function ColorPickerDropdown({
  color,
  onChange,
  presetPalette = [
    '#c2185b', '#e11d48', '#f97316', '#eab308', '#10b981',
    '#06b6d4', '#0284c7', '#4f46e5', '#7c3aed', '#64748b',
    '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#94a3b8',
    '#334155', '#1e293b', '#0f172a', '#020617', '#000000',
  ],
  align = 'center',
}: ColorPickerDropdownProps) {
  const [inputVal, setInputVal] = useState(color);

  const handleUpdate = (val: string) => {
    setInputVal(val);
    onChange(val);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full h-7 px-1.5 rounded-md border border-border/80 flex items-center justify-between text-[11px] font-mono shadow-xs hover:border-border transition-colors bg-background"
        >
          <span
            className="h-3.5 w-3.5 rounded-sm border border-black/15 shrink-0"
            style={{ backgroundColor: color }}
          />
          <ChevronDown className="h-3 w-3 text-muted-foreground ml-auto" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-60 p-3 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl z-[60] space-y-3"
        align={align}
      >
        <div>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
            Bảng màu gợi ý
          </span>
          <div className="grid grid-cols-5 gap-1.5">
            {presetPalette.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleUpdate(p)}
                className={`h-6 w-full rounded-md border transition-transform hover:scale-110 active:scale-95 flex items-center justify-center ${
                  color.toLowerCase() === p.toLowerCase()
                    ? 'ring-2 ring-primary ring-offset-1 border-primary/50'
                    : 'border-border/60'
                }`}
                style={{ backgroundColor: p }}
              >
                {color.toLowerCase() === p.toLowerCase() && (
                  <Check
                    className={`w-3 h-3 ${
                      p === '#ffffff' || p === '#f8fafc' || p === '#f1f5f9'
                        ? 'text-black'
                        : 'text-white'
                    }`}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-border/50 flex items-center gap-2">
          <label className="relative cursor-pointer shrink-0">
            <span
              className="w-7 h-7 rounded-lg border border-border/80 shadow-xs block"
              style={{ backgroundColor: color }}
            />
            <input
              type="color"
              value={color.startsWith('#') && color.length === 7 ? color : '#c2185b'}
              onChange={(e) => handleUpdate(e.target.value)}
              className="sr-only"
            />
          </label>
          <div className="flex-1 flex items-center border border-border rounded-lg px-2 py-0.5 bg-muted/30 focus-within:ring-1 focus-within:ring-primary">
            <span className="text-muted-foreground text-xs font-mono mr-1">#</span>
            <input
              type="text"
              value={inputVal.replace(/^#/, '')}
              maxLength={6}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9A-Fa-f]/g, '');
                setInputVal('#' + raw);
                if (raw.length === 6 || raw.length === 3) {
                  onChange('#' + raw);
                }
              }}
              className="w-full text-xs font-mono bg-transparent outline-none uppercase text-foreground"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ThemeCustomizerModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    previewThemeId,
    previewCustomBrand,
    isPreviewCustom,
    setPreviewTheme,
    setPreviewCustomBrand,
    applyTheme,
    cancelPreview,
  } = useTheme();

  const [brandAccent, setBrandAccent] = useState(previewCustomBrand?.accent || '#c2185b');
  const [brandBg, setBrandBg] = useState(previewCustomBrand?.background || '#faf9f9');
  const [brandSidebar, setBrandSidebar] = useState(
    previewCustomBrand?.sidebar || (previewCustomBrand?.background ? previewCustomBrand.background : '#ffffff')
  );

  const handleSelectPreset = (preset: ThemePreset) => {
    setPreviewTheme(preset.id);
  };

  const handleSelectCustom = () => {
    const brand: CustomBrandColor = {
      accent: brandAccent,
      background: brandBg,
      sidebar: brandSidebar,
    };
    setPreviewCustomBrand(brand);
  };

  const handleAccentChange = (hex: string) => {
    setBrandAccent(hex);
    setPreviewCustomBrand({ accent: hex, background: brandBg, sidebar: brandSidebar });
  };

  const handleBgChange = (hex: string) => {
    setBrandBg(hex);
    // If sidebar was identical to previous background, keep it in sync
    const newSidebar = brandSidebar === brandBg ? hex : brandSidebar;
    if (brandSidebar === brandBg) setBrandSidebar(hex);
    setPreviewCustomBrand({ accent: brandAccent, background: hex, sidebar: newSidebar });
  };

  const handleSidebarChange = (hex: string) => {
    setBrandSidebar(hex);
    setPreviewCustomBrand({ accent: brandAccent, background: brandBg, sidebar: hex });
  };

  const handleApply = () => {
    applyTheme();
    onOpenChange(false);
    toast.success('Đã áp dụng và lưu giao diện thành công');
  };

  const handleCancel = () => {
    cancelPreview();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleCancel();
        } else {
          onOpenChange(true);
        }
      }}
    >
      <DialogContent className="max-w-[420px] p-0 gap-0 rounded-2xl overflow-hidden shadow-2xl border-border/60">
        {/* Header */}
        <div className="p-4 border-b border-border/40 flex items-start gap-3 bg-muted/20">
          <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-foreground">
              Tuỳ chỉnh giao diện
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Chọn theme hoặc màu để xem thử. Nhấn Áp dụng để lưu lại cho lần sau.
            </p>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Section: TUỲ MÀU */}
          <div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              TUỲ MÀU
            </div>

            <div
              onClick={handleSelectCustom}
              className={`p-3 rounded-xl border cursor-pointer transition-all space-y-2.5 ${
                isPreviewCustom
                  ? 'border-primary bg-primary/10 ring-1 ring-primary/20'
                  : 'border-border/60 hover:border-border hover:bg-muted/30'
              }`}
            >
              {/* Row 1: Swatches + Title + Radio */}
              <div className="flex items-center justify-between gap-3">
                {/* 3 Swatches: Accent, Menu, Nền */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div
                    className="w-4 h-8 rounded-sm shadow-xs border border-black/10"
                    title={`Màu Accent: ${brandAccent}`}
                    style={{ backgroundColor: brandAccent }}
                  />
                  <div
                    className="w-4 h-8 rounded-sm shadow-xs border border-black/10"
                    title={`Nền Menu: ${brandSidebar}`}
                    style={{ backgroundColor: brandSidebar }}
                  />
                  <div
                    className="w-4 h-8 rounded-sm shadow-xs border border-border"
                    title={`Nền Trang: ${brandBg}`}
                    style={{ backgroundColor: brandBg }}
                  />
                </div>

                {/* Title & Desc */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs text-foreground">Tuỳ màu thương hiệu</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    Accent {brandAccent} • Menu {brandSidebar} • Nền {brandBg}
                  </p>
                </div>

                {/* Radio check */}
                <div className="shrink-0 ml-1">
                  {isPreviewCustom ? (
                    <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full border border-border/80" />
                  )}
                </div>
              </div>

              {/* Row 2: 3 Color Pickers with Labels */}
              <div
                className="pt-2 border-t border-border/40 grid grid-cols-3 gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                {/* 1. Accent picker */}
                <div className="space-y-1">
                  <span className="text-[10px] font-medium text-muted-foreground block truncate">
                    1. Điểm nhấn
                  </span>
                  <ColorPickerDropdown
                    color={brandAccent}
                    onChange={handleAccentChange}
                    align="start"
                  />
                </div>

                {/* 2. Page Bg picker */}
                <div className="space-y-1">
                  <span className="text-[10px] font-medium text-muted-foreground block truncate">
                    2. Nền Trang
                  </span>
                  <ColorPickerDropdown
                    color={brandBg}
                    onChange={handleBgChange}
                    align="center"
                  />
                </div>

                {/* 3. Sidebar/Menu Bg picker */}
                <div className="space-y-1">
                  <span className="text-[10px] font-medium text-muted-foreground block truncate">
                    3. Nền Menu
                  </span>
                  <ColorPickerDropdown
                    color={brandSidebar}
                    onChange={handleSidebarChange}
                    align="end"
                  />
                </div>
              </div>

              {/* Row 3: Quick presets for Menu background */}
              <div
                className="flex items-center gap-1.5 pt-1"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[10px] text-muted-foreground shrink-0">Menu:</span>
                <button
                  type="button"
                  onClick={() => handleSidebarChange(brandBg)}
                  className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${
                    brandSidebar === brandBg
                      ? 'border-primary bg-primary/10 font-semibold text-primary'
                      : 'border-border/60 hover:bg-muted/40 text-muted-foreground'
                  }`}
                >
                  Cùng nền trang
                </button>
                <button
                  type="button"
                  onClick={() => handleSidebarChange('#ffffff')}
                  className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${
                    brandSidebar === '#ffffff'
                      ? 'border-primary bg-primary/10 font-semibold text-primary'
                      : 'border-border/60 hover:bg-muted/40 text-muted-foreground'
                  }`}
                >
                  Trắng sáng
                </button>
                <button
                  type="button"
                  onClick={() => handleSidebarChange('#0f172a')}
                  className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${
                    brandSidebar === '#0f172a'
                      ? 'border-primary bg-primary/10 font-semibold text-primary'
                      : 'border-border/60 hover:bg-muted/40 text-muted-foreground'
                  }`}
                >
                  Tối
                </button>
              </div>
            </div>
          </div>

          {/* Section: THEME CÓ SẴN */}
          <div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              THEME CÓ SẴN
            </div>

            <div className="space-y-2">
              {THEME_PRESETS.map((preset) => {
                const isSelected = !isPreviewCustom && previewThemeId === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/20 shadow-xs'
                        : 'border-border/50 hover:border-border hover:bg-muted/20'
                    }`}
                  >
                    {/* Swatches */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div
                        className="w-4 h-8 rounded-sm shadow-xs border border-black/10"
                        style={{ backgroundColor: preset.swatches[0] }}
                      />
                      <div
                        className="w-4 h-8 rounded-sm shadow-xs border border-black/10"
                        style={{ backgroundColor: preset.swatches[1] }}
                      />
                      <div
                        className="w-4 h-8 rounded-sm shadow-xs border border-border"
                        style={{ backgroundColor: preset.swatches[2] }}
                      />
                    </div>

                    {/* Information */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-foreground">{preset.name}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        {preset.description}
                      </p>
                    </div>

                    {/* Radio Checkmark */}
                    <div className="shrink-0 ml-1">
                      {isSelected ? (
                        <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full border border-border/80" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border/40 bg-muted/20 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="gap-1.5 text-xs h-8"
          >
            <X className="h-3.5 w-3.5" /> Huỷ bỏ
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            className="gap-1.5 text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Check className="h-3.5 w-3.5 stroke-[2.5]" /> Áp dụng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
