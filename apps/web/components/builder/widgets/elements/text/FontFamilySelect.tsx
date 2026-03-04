import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { ListItemText, Menu, MenuItem, ToggleButton, Typography } from "@mui/material";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { useEffect, useState } from "react";

import { FONT_FAMILIES } from "@/lib/constants/typography";

interface FontFamilySelectProps {
  editor: Editor;
  onOpen?: () => void;
  onClose?: () => void;
  forceClose?: boolean;
}

const FontFamilySelect: React.FC<FontFamilySelectProps> = ({
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
      const fontFamily = e.getAttributes("textStyle").fontFamily as string | undefined;
      return { fontFamily: fontFamily || null };
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
    editor.chain().focus().setFontFamily(value).run();
    handleClose();
  };

  // Find current font label
  const currentFont = FONT_FAMILIES.find((f) => f.value === editorState?.fontFamily);
  const displayLabel = currentFont?.label ?? "Arial";

  return (
    <>
      <ToggleButton
        value="fontFamily"
        size="small"
        selected={open}
        onClick={handleOpen}
        sx={{ display: "flex", alignItems: "center", textTransform: "none", maxWidth: 120 }}>
        <Typography
          variant="caption"
          noWrap
          sx={{ fontWeight: 600, lineHeight: 1, fontSize: "0.8rem" }}>
          {displayLabel}
        </Typography>
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
            sx: { maxHeight: 300 },
          },
        }}>
        {FONT_FAMILIES.map((font) => (
          <MenuItem
            dense
            key={font.value}
            selected={font.value === editorState?.fontFamily}
            onClick={() => handleSelect(font.value)}>
            <ListItemText sx={{ "& .MuiTypography-root": { fontFamily: font.value } }}>
              {font.label}
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default FontFamilySelect;
