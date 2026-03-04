import { Box, Paper } from "@mui/material";
import { debounce } from "@mui/material/utils";
import { styled, useTheme } from "@mui/material/styles";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { useCallback, useRef, useState } from "react";

import { rgbToHex } from "@/lib/utils/helpers";

import type { RGBColor } from "@/types/map/color";

import { ArrowPopper } from "@/components/ArrowPoper";
import SingleColorSelector from "@/components/map/panels/style/color/SingleColorSelector";

const ColorButton = styled(Box, {
  shouldForwardProp: (prop) => prop !== "buttonColor",
})<{ buttonColor: string }>(({ theme, buttonColor }) => ({
  width: 24,
  height: 24,
  borderRadius: 4,
  backgroundColor: buttonColor,
  border: `1px solid ${theme.palette.divider}`,
  cursor: "pointer",
  transition: "transform 0.1s ease",
  "&:hover": {
    transform: "scale(1.1)",
  },
}));

interface TextColorPickerProps {
  editor: Editor;
  onOpenChange?: (isOpen: boolean) => void;
}

const TextColorPicker: React.FC<TextColorPickerProps> = ({ editor, onOpenChange }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  // Local color for the button preview; null = use editor color
  const [localColor, setLocalColor] = useState<string | null>(null);
  // Stable color snapshot taken when the picker opens — never changes during drag
  const [pickerColor, setPickerColor] = useState<string | null>(null);

  const updateOpen = (value: boolean) => {
    setOpen(value);
    onOpenChange?.(value);
    if (!value) {
      setLocalColor(null);
      setPickerColor(null);
    }
  };

  const editorState = useEditorState({
    editor,
    selector: ({ editor: e }: { editor: Editor }) => {
      const color = e.getAttributes("textStyle").color as string | undefined;
      return { color: color || null };
    },
  });

  const editorColor = editorState?.color || theme.palette.text.primary;
  // Use local color while picker is open (avoids feedback loop), otherwise editor color
  const displayColor = localColor ?? editorColor;

  // Debounced editor update — apply color to editor at most every 150ms
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const applyColorToEditor = useCallback(
    debounce((hex: string) => {
      editor.chain().setColor(hex).run();
    }, 150),
    [editor],
  );

  // Keep a ref for cleanup
  const applyRef = useRef(applyColorToEditor);
  applyRef.current = applyColorToEditor;

  const handleColorChange = (rgb: RGBColor) => {
    const hex = rgbToHex(rgb);
    // Update local color immediately for smooth UI
    setLocalColor(hex);
    // Debounce the actual editor update
    applyColorToEditor(hex);
  };

  return (
    <ArrowPopper
      open={open}
      placement="bottom"
      arrow={false}
      disablePortal={false}
      isClickAwayEnabled={true}
      onClose={() => {
        // Flush any pending debounced update before closing
        applyColorToEditor.clear();
        if (localColor) {
          editor.chain().setColor(localColor).run();
        }
        updateOpen(false);
      }}
      popperStyle={{ zIndex: 1500 }}
      content={
        <Paper
          className="color-picker-popper"
          onMouseDown={(e: React.MouseEvent) => {
            // Prevent focus from leaving the editor so text selection is preserved
            e.preventDefault();
          }}
          sx={{
            py: 3,
            boxShadow: "rgba(0, 0, 0, 0.16) 0px 6px 12px 0px",
            width: "235px",
            maxHeight: "500px",
          }}>
          <SingleColorSelector selectedColor={pickerColor ?? displayColor} onSelectColor={handleColorChange} />
        </Paper>
      }>
      <ColorButton
        buttonColor={displayColor}
        onMouseDown={(e: React.MouseEvent) => {
          // Prevent editor from losing focus/selection when clicking the color button
          e.preventDefault();
        }}
        onClick={() => {
          if (!open) {
            // Snapshot color when opening so the picker doesn't re-render during drag
            setPickerColor(displayColor);
          }
          updateOpen(!open);
        }}
      />
    </ArrowPopper>
  );
};

export default TextColorPicker;
