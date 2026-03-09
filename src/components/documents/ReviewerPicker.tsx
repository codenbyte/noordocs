/**
 * ReviewerPicker — dropdown to select an imam/admin to review a document.
 * Used on the Review step of Nikah and Will builder pages.
 */

import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  CircularProgress,
} from "@mui/material";
import { Mosque } from "@mui/icons-material";
import { useAdminUsers, type AdminUser } from "@/hooks/useAdminUsers";

interface Props {
  selectedUid: string;
  onChange: (reviewer: AdminUser | null) => void;
}

export default function ReviewerPicker({ selectedUid, onChange }: Props) {
  const { admins, loading } = useAdminUsers();

  return (
    <Box sx={{ mt: 2, mb: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Mosque sx={{ fontSize: 18, color: "primary.main" }} />
        <Typography variant="subtitle2" fontWeight={600}>
          Send to Imam / Reviewer
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        Choose a specific imam or admin to review your document. They'll be notified by email.
      </Typography>

      <FormControl fullWidth size="small">
        <InputLabel>Select Reviewer</InputLabel>
        <Select
          value={selectedUid}
          label="Select Reviewer"
          onChange={(e) => {
            const uid = e.target.value;
            if (!uid) {
              onChange(null);
            } else {
              const admin = admins.find((a) => a.uid === uid) || null;
              onChange(admin);
            }
          }}
          disabled={loading}
          startAdornment={loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : undefined}
          sx={{ borderRadius: "12px" }}
        >
          <MenuItem value="">
            <Typography variant="body2" color="text.secondary">
              Any available reviewer
            </Typography>
          </MenuItem>
          {admins.map((admin) => (
            <MenuItem key={admin.uid} value={admin.uid}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Avatar
                  src={admin.photoURL}
                  sx={{ width: 28, height: 28, fontSize: 13 }}
                >
                  {admin.displayName[0]}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    {admin.displayName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {admin.email}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
