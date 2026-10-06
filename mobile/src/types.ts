export type AlertRecipient = { name: string; email: string };

export type AlertRecord = {
  id: string;
  type: "SOS" | "JOURNEY_NO_RESPONSE" | "USER_REQUESTED";
  lat: number;
  lng: number;
  mapLink: string;
  message: string;
  status: "SENT" | "FAILED";
  createdAt: string;
  recipients: AlertRecipient[];
};

export type Journey = {
  id: string;
  destinationLabel: string;
  startLat: number;
  startLng: number;
  expectedArrival: string;
  status: "ACTIVE" | "AWAITING_RESPONSE" | "COMPLETED" | "ALERT_SENT";
  confirmDeadline: string | null;
  createdAt: string;
  endedAt: string | null;
};
