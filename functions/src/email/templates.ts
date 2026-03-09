/**
 * Email Templates — HTML email builders for NoorSpace document notifications.
 */

// ── Shared layout ──

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NoorSpace</title>
</head>
<body style="margin:0;padding:0;background:#F5F5F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(160deg,#0F3D2E 0%,#0A2B20 40%,#0C1B2E 100%);padding:28px 32px;text-align:center;">
              <div style="font-size:20px;color:#C8A951;margin-bottom:4px;">&#9790;</div>
              <div style="font-size:18px;font-weight:700;color:#FFFFFF;letter-spacing:0.3px;">NoorSpace</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #E8E5DC;text-align:center;">
              <div style="font-size:11px;color:#999;line-height:1.5;">
                NoorSpace &mdash; Your home in the Ummah<br/>
                This is an automated notification. Please do not reply to this email.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Review Request ──

export interface ReviewRequestEmailData {
  reviewerName: string;
  submitterName: string;
  documentTitle: string;
  documentType: string;
  documentId: string;
  appUrl: string;
}

export function reviewRequestEmail(data: ReviewRequestEmailData): { subject: string; html: string } {
  const typeLabel = data.documentType === "nikah_contract" ? "Nikah Contract" : "Islamic Will";
  const documentUrl = `${data.appUrl}/documents/${data.documentId}`;

  const subject = `Review Request: ${typeLabel} from ${data.submitterName}`;

  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:18px;color:#1A1A1A;">
      Assalamu Alaikum, ${data.reviewerName}
    </h2>
    <p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.6;">
      A new document has been submitted for your review on NoorSpace.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F7F4;border-radius:12px;padding:20px;margin-bottom:24px;">
      <tr>
        <td>
          <div style="font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">Document Details</div>
          <div style="font-size:15px;font-weight:600;color:#1A1A1A;margin-bottom:6px;">${data.documentTitle}</div>
          <div style="font-size:13px;color:#555;margin-bottom:4px;">Type: ${typeLabel}</div>
          <div style="font-size:13px;color:#555;">Submitted by: ${data.submitterName}</div>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${documentUrl}" style="display:inline-block;background:#0F3D2E;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:10px;">
            Review Document
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0;font-size:12px;color:#999;text-align:center;line-height:1.5;">
      You can approve, reject, or request changes from the document page.
    </p>
  `);

  return { subject, html };
}

// ── Review Complete (notify submitter) ──

export interface ReviewCompleteEmailData {
  submitterName: string;
  reviewerName: string;
  documentTitle: string;
  documentType: string;
  documentId: string;
  decision: "approved" | "rejected" | "changes_requested";
  note?: string;
  appUrl: string;
}

export function reviewCompleteEmail(data: ReviewCompleteEmailData): { subject: string; html: string } {
  const typeLabel = data.documentType === "nikah_contract" ? "Nikah Contract" : "Islamic Will";
  const documentUrl = `${data.appUrl}/documents/${data.documentId}`;

  const decisionLabels: Record<string, { label: string; color: string; emoji: string }> = {
    approved: { label: "Approved", color: "#2E7D32", emoji: "&#10004;" },
    rejected: { label: "Rejected", color: "#D32F2F", emoji: "&#10006;" },
    changes_requested: { label: "Changes Requested", color: "#ED6C02", emoji: "&#9998;" },
  };

  const d = decisionLabels[data.decision];
  const subject = `${typeLabel}: ${d.label} by ${data.reviewerName}`;

  const html = layout(`
    <h2 style="margin:0 0 8px;font-size:18px;color:#1A1A1A;">
      Assalamu Alaikum, ${data.submitterName}
    </h2>
    <p style="margin:0 0 20px;font-size:14px;color:#555;line-height:1.6;">
      Your document has been reviewed by ${data.reviewerName}.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F7F4;border-radius:12px;padding:20px;margin-bottom:24px;">
      <tr>
        <td>
          <div style="font-size:15px;font-weight:600;color:#1A1A1A;margin-bottom:8px;">${data.documentTitle}</div>
          <div style="font-size:13px;color:#555;margin-bottom:12px;">Type: ${typeLabel}</div>
          <div style="display:inline-block;background:${d.color};color:#FFFFFF;font-size:12px;font-weight:600;padding:4px 12px;border-radius:6px;">
            ${d.emoji} ${d.label}
          </div>
          ${data.note ? `<div style="margin-top:14px;padding:12px;background:#FFFFFF;border-radius:8px;border:1px solid #E8E5DC;font-size:13px;color:#555;line-height:1.5;"><strong>Note:</strong> ${data.note}</div>` : ""}
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${documentUrl}" style="display:inline-block;background:#0F3D2E;color:#FFFFFF;font-size:14px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:10px;">
            View Document
          </a>
        </td>
      </tr>
    </table>
  `);

  return { subject, html };
}
