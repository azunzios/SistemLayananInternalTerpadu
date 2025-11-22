import type { User } from '@/types';

export type ZoomBookingRecord = Record<string, any>;

export interface BookingGroups {
  all: ZoomBookingRecord[];
  pending: ZoomBookingRecord[];
  approved: ZoomBookingRecord[];
  rejected: ZoomBookingRecord[];
}

export interface ZoomAccountUi {
  id: string | number;
  accountId?: string | number | null;
  name: string;
  isActive: boolean;
  color: string;
  lightColor: string;
  borderColor: string;
  dotColor: string;
}

export interface ZoomAccountDisplay {
  name: string;
  hostKey: string;
}

export interface QuickBookingFormState {
  title: string;
  purpose: string;
  participants: string;
  breakoutRooms: string;
  startTime: string;
  endTime: string;
}

export interface ApprovalFormState {
  meetingLink: string;
  passcode: string;
  zoomAccount: string;
}

export interface ZoomProAccountMeta {
  id: string;
  name: string;
  email: string;
  hostKey: string;
}

export interface CoHostSearchState {
  availableUsers: User[];
  selectedCoHostIds: string[];
  coHostQuery: string;
  isSearchingCoHost: boolean;
  coHostResults: User[];
}
