/**
 * Reusable form section — renders a titled group of FormFields
 * with a responsive grid layout (half-width fields side by side on desktop).
 */

import { Box, Typography } from "@mui/material";
import Grid2 from "@mui/material/Grid2";
import FormField from "./FormField";
import type { FieldDef } from "@/types";

interface Props {
  title: string;
  description?: string;
  fields: FieldDef[];
  data: Record<string, string>;
  onChange: (key: string, value: string) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

export default function FormSection({
  title,
  description,
  fields,
  data,
  onChange,
  errors = {},
  disabled,
}: Props) {
  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.25 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
      )}

      <Grid2 container spacing={2}>
        {fields.map((field) => (
          <Grid2 key={field.key} size={{ xs: 12, sm: field.gridHalf ? 6 : 12 }}>
            <FormField
              field={field}
              value={data[field.key] || ""}
              onChange={onChange}
              error={errors[field.key]}
              disabled={disabled}
            />
          </Grid2>
        ))}
      </Grid2>
    </Box>
  );
}
