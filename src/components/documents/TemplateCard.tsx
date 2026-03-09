import { Box, Card, CardContent, Typography, Button } from "@mui/material";
import { Description, Gavel } from "@mui/icons-material";
import type { DocumentType } from "@/types";

interface Props {
  type: DocumentType;
  onSelect: (type: DocumentType) => void;
}

const TEMPLATES: Record<DocumentType, { icon: React.ReactNode; title: string; description: string }> = {
  nikah_contract: {
    icon: <Gavel sx={{ fontSize: 36, color: "primary.main" }} />,
    title: "Nikah Contract",
    description: "Create a marriage contract with mahr details, witnesses, and imam certification.",
  },
  islamic_will: {
    icon: <Description sx={{ fontSize: 36, color: "primary.main" }} />,
    title: "Islamic Will",
    description: "Prepare a will according to Islamic inheritance principles with executor and witnesses.",
  },
};

export default function TemplateCard({ type, onSelect }: Props) {
  const t = TEMPLATES[type];

  return (
    <Card
      sx={{
        cursor: "pointer",
        transition: "box-shadow 0.2s, transform 0.2s",
        "&:hover": { boxShadow: 4, transform: "translateY(-2px)" },
        borderRadius: "16px",
        height: "100%",
      }}
      onClick={() => onSelect(type)}
    >
      <CardContent sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ mb: 2 }}>{t.icon}</Box>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          {t.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flex: 1 }}>
          {t.description}
        </Typography>
        <Button variant="outlined" size="small" sx={{ alignSelf: "flex-start", borderRadius: "12px" }}>
          Start
        </Button>
      </CardContent>
    </Card>
  );
}
