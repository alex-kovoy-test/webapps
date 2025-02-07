export type RecordingsQuery = {
  from: Date;
  to: Date;
  limit?: number;
  startKey?: string;
};

export type RecordingsResponse = {
  recordings: Recording[];
  startKey: string;
};

export type Recording = {
  duration: number;
  durationText: string;
  sid: string;
  createdDate: Date;
  users: string;
  hostname: string;
  description: string;
};
