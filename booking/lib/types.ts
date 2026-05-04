export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  role: string;
  isBanned: boolean;
  bannedAt: string | null;
  creationTime: string;
  trustScore: number;
  outstandingBalance: number;
  isProvisional: boolean;
}

export interface TrustHistoryDto {
  id: string;
  previousScore: number;
  newScore: number;
  adjustment: number;
  reason: string;
  details: string | null;
  bookingRoom: string | null;
  triggeredBy: string | null;
  creationTime: string;
}

export interface AuthResponse {
  token: string;
  user: UserDto;
}

// ─── Booking domain ───

export type RoomStatus =
  | "Open"
  | "OpenPlay"
  | "Tournament"
  | "Closed"
  | "Maintenance";

export type BookingType = "Regular" | "OpenPlaySeat";

export type BookingStatus =
  | "PendingPayment"
  | "ProofSubmitted"
  | "Approved"
  | "Rejected"
  | "Expired"
  | "Cancelled";

export type PaymentStatus =
  | "AwaitingProof"
  | "Submitted"
  | "Approved"
  | "Rejected"
  | "Outstanding";

export type PaymentMethod = "GCash" | "Cash" | "OnlineBanking";

export type QueueState = "Queued" | "InMatch" | "Left";

export interface GameDto {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
}

export interface RoomDto {
  id: string;
  gameId: string;
  name: string;
  description: string | null;
  capacity: number;
  hourlyRate: number;
  imageUrl: string | null;
}

export interface RoomSlotDto {
  start: string;
  end: string;
  status: RoomStatus;
  available: boolean;
  windowId: string | null;
  seatRate: number | null;
  matchSize: number | null;
  queueLength: number | null;
}

export interface RoomAvailabilityDto {
  room: RoomDto;
  slots: RoomSlotDto[];
}

export interface AvailabilityResponse {
  game: GameDto;
  from: string;
  to: string;
  rooms: RoomAvailabilityDto[];
}

export interface PaymentDto {
  id: string;
  bookingId: string;
  bookerName: string | null;
  bookerEmail: string | null;
  roomName: string | null;
  bookingStartTime: string | null;
  bookingEndTime: string | null;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  referenceNumber: string | null;
  proofS3Key: string | null;
  proofPresignedUrl: string | null;
  remarks: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
}

export interface BookingDto {
  id: string;
  roomId: string;
  roomName: string;
  bookedByUserId: string;
  type: BookingType;
  status: BookingStatus;
  startTime: string;
  endTime: string;
  totalAmount: number;
  holdExpiresAt: string | null;
  notes: string | null;
  payment: PaymentDto | null;
}

export interface CreateRegularBookingRequest {
  roomId: string;
  startTime: string;
  hours: number;
  notes?: string | null;
}

// ─── Open play ───

export interface OpenPlayWindowSummary {
  windowId: string;
  roomId: string;
  roomName: string;
  gameId: string;
  gameName: string;
  startTime: string;
  endTime: string;
  seatRate: number;
  matchSize: number;
  queueCap: number | null;
  queueLength: number;
  activeMatchCount: number;
}

export interface QueuePartyDto {
  partyId: string;
  size: number;
  leaderUserId: string;
  leaderName: string;
  partnerUserId: string | null;
  partnerName: string | null;
  enqueuedAt: string;
  state: QueueState;
}

export interface MatchPlayerDto {
  userId: string;
  name: string;
  partyId: string | null;
}

export interface MatchDto {
  id: string;
  windowId: string;
  roomId: string;
  startedAt: string;
  endedAt: string | null;
  players: MatchPlayerDto[];
}

export interface OpenPlayWindowState {
  summary: OpenPlayWindowSummary;
  queue: QueuePartyDto[];
  activeMatches: MatchDto[];
}

export interface JoinOpenPlayResponse {
  partyId: string;
  bookings: BookingDto[];
}

// ─── Display ───

export interface DisplayRoomState {
  roomId: string;
  roomName: string;
  gameId: string;
  gameName: string;
  currentStatus: RoomStatus;
  currentReservationLabel: string | null;
  currentEndsAt: string | null;
  nextStartsAt: string | null;
  nextLabel: string | null;
  openPlayQueueLength: number | null;
  openPlayActiveMatches: number | null;
  currentMatchId: string | null;
  currentMatchPlayers: MatchPlayerDto[] | null;
}

export interface DisplaySnapshot {
  asOf: string;
  rooms: DisplayRoomState[];
}

// ─── Schedule calendar ───

export interface ScheduleGameDto {
  id: string;
  name: string;
}

export interface ScheduleRoomDto {
  id: string;
  name: string;
  game: GameDto;
}

export interface ScheduleBookingDto {
  id: string;
  roomId: string;
  bookerName: string;
  type: BookingType;
  status: BookingStatus;
  startTime: string;
  endTime: string;
  totalAmount: number;
}

export interface ScheduleOpenPlayDto {
  id: string;
  windowId: string;
  roomId: string;
  status: RoomStatus;
  windowNotes: string;
  matchSize: number | null;
  startTime: string;
  endTime: string;
}

export interface ScheduleDayDto {
  rooms: ScheduleRoomDto[];
  bookings: ScheduleBookingDto[];
  openPlayWindows: ScheduleOpenPlayDto[];
}

export interface AuditLogDto {
  id: string;
  level: "Information" | "Warning" | "Error";
  userId: string | null;
  userName: string | null;
  email: string | null;
  httpMethod: string;
  requestUrl: string;
  ipAddress: string | null;
  userAgent: string | null;
  statusCode: number;
  durationMs: number;
  creationTime: string;
  errorMessage: string | null;
  errorStackTrace: string | null;
  requestBody: string | null;
}

export interface AdminBookingSummaryDto {
  id: string;
  roomId: string;
  bookerName: string;
  roomName: string;
  type: BookingType;
  status: BookingStatus;
  startTime: string;
  endTime: string;
  totalAmount: number;
}

export interface CreateGameRequest {
  name: string;
  description: string | null;
  iconUrl: string | null;
}

export interface CreateRoomRequest {
  gameId: string;
  name: string;
  description: string | null;
  capacity: number;
  hourlyRate: number;
}

export interface UpdateRoomRequest {
  name: string;
  description: string | null;
  capacity: number;
  hourlyRate: number;
}

export interface ScheduleWindowDto {
  id: string;
  roomId: string;
  status: RoomStatus;
  startTime: string;
  endTime: string;
  notes: string | null;
  seatRate: number | null;
  matchSize: number | null;
  queueCap: number | null;
}

export interface ScheduleWindowRequest {
  status: RoomStatus;
  startTime: string;
  endTime: string;
  notes: string | null;
  seatRate: number | null;
  matchSize: number | null;
  queueCap: number | null;
}

export interface UpcomingEventDto {
  id: string;
  roomName: string;
  gameName: string;
  status: RoomStatus;
  startTime: string;
  endTime: string;
  notes: string | null;
  matchSize: number | null;
  seatRate: number | null;
}

export interface PaymentSummaryDto {
  id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  referenceNumber: string | null;
  remarks: string | null;
  proofPresignedUrl: string | null;
  reviewedAt: string | null;
}

export interface AdminBookingListDto {
  id: string;
  roomId: string;
  roomName: string;
  gameName: string;
  bookedByUserId: string;
  bookerName: string;
  bookerEmail: string;
  bookerIsProvisional: boolean;
  type: BookingType;
  status: BookingStatus;
  startTime: string;
  endTime: string;
  totalAmount: number;
  notes: string | null;
  holdExpiresAt: string | null;
  payment: PaymentSummaryDto | null;
}

export interface CreateAdminBookingRequest {
  userId: string;
  roomId: string;
  startTime: string;
  hours: number;
  notes?: string | null;
  paymentMethod: PaymentMethod;
  referenceNumber?: string | null;
  remarks?: string | null;
}
