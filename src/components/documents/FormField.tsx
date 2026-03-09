/**
 * Reusable form field that renders the right MUI input
 * based on the FieldDef type. Used across all document builders.
 */

import { TextField } from "@mui/material";
import type { FieldDef } from "@/types";

interface Props {
  field: FieldDef;
  value: string;
  onChange: (key: string, value: string) => void;
  error?: string;
  disabled?: boolean;
}

export default function FormField({ field, value, onChange, error, disabled }: Props) {
  return (
    <TextField
      fullWidth
      label={field.label + (field.required ? " *" : "")}
      placeholder={field.placeholder}
      helperText={error || field.helperText}
      error={!!error}
      type={field.type === "textarea" ? "text" : field.type}
      multiline={field.type === "textarea"}
      rows={field.type === "textarea" ? field.rows || 3 : undefined}
      value={value}
      onChange={(e) => onChange(field.key, e.target.value)}
      disabled={disabled}
      slotProps={field.type === "date" ? { inputLabel: { shrink: true } } : undefined}
      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
    />
  );
}
