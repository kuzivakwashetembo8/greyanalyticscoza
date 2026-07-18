// Alert system — shared types for the WhatsApp + Email alert pipeline
// triggered after Transmit Assessment completes.

export type AlertChannel = "whatsapp" | "email";
export type AlertStatus = "sent" | "failed";

export interface SentAlert {
  id: string;
  reportId: string;
  businessName: string;
  anomalyType: string;
  amount: number;          // ZAR; 0 if unknown
  severity: "high" | "medium" | "low";
  fixSummary: string;
  channel: AlertChannel;
  status: AlertStatus;
  sentAt: number;          // epoch ms
  error?: string;          // populated when status === "failed"
  to: string;              // destination phone / email
  retryCount?: number;
}

export interface AlertRequestPayload {
  reportId: string;
  businessName: string;
  whatsappTo?: string;
  emailTo?: string;
  reportLink: string;
  anomalies: Array<{
    type: string;
    amount: number;
    severity: "high" | "medium" | "low";
    fix: string;
    description: string;
  }>;
  retryChannel?: AlertChannel;
}

export interface AlertChannelResult {
  channel: AlertChannel;
  status: AlertStatus;
  to: string;
  error?: string;
}

export interface AlertResponse {
  success: boolean;
  triggered: boolean;          // false when nothing met the threshold
  reason?: string;             // why nothing was sent
  results: AlertChannelResult[];
  anomalies: AlertRequestPayload["anomalies"];
}
