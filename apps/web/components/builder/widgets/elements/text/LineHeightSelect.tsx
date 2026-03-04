import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import FormatLineSpacingIcon from "@mui/icons-material/FormatLineSpacing";
import { ListItemText, Menu, MenuItem, ToggleButton } from "@mui/material";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { useEffect, useState } from "react";

const LINE_HEIGHT_PRESETS = [
  { label: "1", value: "1" },
  { label: "1.15", value: "1.15" },
  { label: "1.5", value: "1.5" },
  { label: "2", value: "2" },
  { label: "2.5", value: "2.5" },
  { label: "3", value: "3" },
];

interface LineHeightSelectProps {
  editor: Editor;
  onOpen?: () => void;
  onClose?: () => void;
  forceClose?: boolean;
}

const LineHeightSelect: React.FC<LineHeightSelectProps> = ({
  editor,
  onOpen,
  onClose,
  forceClose,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const editorState = useEditorState({
    editor,
    selector: ({ editor: e }: { editor: Editor }) => {
      // Line height is a block-level attribute on paragraph/heading, not on textStyle
      const lineHeight = (e.getAttributes("paragraph").lineHeight || e.getAttributes("heading").lineHeight) as string | undefined;
      return { lineHeight: lineHeight || null };
    },
  });

  // Close when forceClose becomes true
  useEffect(() => {
    if (forceClose && anchorEl) {
      setAnchorEl(null);
    }
  }, [forceClose, anchorEl]);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    if (anchorEl) {
      setAnchorEl(null);
    } else {
      onOpen?.();
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
    onClose?.();
  };

  const handleSelect = (value: string) => {
    editor.chain().focus().setLineHeight(value).run();
    handleClose();
  };

  const currentValue = editorState?.lineHeight ?? "1.5";

  return (
    <>
      <ToggleButton
        value="lineHeight"
        size="small"
        selected={open}
        onClick={handleOpen}
        sx={{ display: "flex", alignItems: "center" }}>
        <FormatLineSpacingIcon fontSize="small" sx={{ color: open ? "primary.main" : "inherit" }} />
        <ArrowDropDownIcon fontSize="small" />
      </ToggleButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        sx={{ zIndex: 1500 }}
        slotProps={{
          paper: {
            onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
            onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
          },
        }}>
        {LINE_HEIGHT_PRESETS.map((item) => (
          <MenuItem
            dense
            key={item.value}
            selected={currentValue === item.value}
            onClick={() => handleSelect(item.value)}>
            <ListItemText>{item.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LineHeightSelect;
