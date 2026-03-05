import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import DataObjectIcon from "@mui/icons-material/DataObject";
import {
  Divider,
  ListItemText,
  Menu,
  MenuItem,
  ToggleButton,
  Typography,
} from "@mui/material";
import type { Editor } from "@tiptap/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface DynamicTextMenuProps {
  editor: Editor;
  onOpen?: () => void;
  onClose?: () => void;
  forceClose?: boolean;
  /** Available feature attribute names from the atlas coverage layer */
  featureAttributes?: string[];
}

const DynamicTextMenu: React.FC<DynamicTextMenuProps> = ({
  editor,
  onOpen,
  onClose,
  forceClose,
  featureAttributes,
}) => {
  const { t } = useTranslation("common");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

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

  const insertPlaceholder = (text: string) => {
    editor.chain().focus().insertContent(text).run();
    handleClose();
  };

  return (
    <>
      <ToggleButton
        value="dynamicText"
        size="small"
        selected={open}
        onClick={handleOpen}
        sx={{ display: "flex", alignItems: "center" }}>
        <DataObjectIcon fontSize="small" sx={{ color: open ? "primary.main" : "inherit" }} />
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
            sx: { maxHeight: 350 },
          },
        }}>
        {[
          <MenuItem key="page_number" dense onClick={() => insertPlaceholder("{{@page_number}}")}>
            <ListItemText>{t("page_number_variable")}</ListItemText>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
              {"{{@page_number}}"}
            </Typography>
          </MenuItem>,
          <MenuItem key="total_pages" dense onClick={() => insertPlaceholder("{{@total_pages}}")}>
            <ListItemText>{t("total_pages_variable")}</ListItemText>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
              {"{{@total_pages}}"}
            </Typography>
          </MenuItem>,
          ...(featureAttributes && featureAttributes.length > 0
            ? [
                <Divider key="divider" />,
                <Typography key="header" variant="caption" color="text.secondary" sx={{ px: 2, py: 0.5, display: "block" }}>
                  {t("feature_attribute")}
                </Typography>,
                ...featureAttributes.map((attr) => (
                  <MenuItem
                    key={`attr-${attr}`}
                    dense
                    onClick={() => insertPlaceholder(`{{@feature.${attr}}}`)}>
                    <ListItemText>{attr}</ListItemText>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                      {`{{@feature.${attr}}}`}
                    </Typography>
                  </MenuItem>
                )),
              ]
            : []),
        ]}
      </Menu>
    </>
  );
};

export default DynamicTextMenu;
