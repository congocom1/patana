// Core domain types
export type PropertyType = 'hotel' | 'apartment';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type UnitStatus = 'active' | 'inactive';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type PaymentMethodType = 'card';

// Auth types
export interface Session {
  accessToken: string;
  tokenType: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

// Property & Unit types
export interface Unit {
  id: string;
  propertyId: string;
  name: string;
  capacity: number;
  pricePerNight: number;
  status: UnitStatus;
}

export interface Stay {
  id: string;
  name: string;
  city: string;
  address: string;
  type: PropertyType;
  description?: string;
  imageUrl?: string;
  units: Unit[];
}

// Booking types
export interface Booking {
  id: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: string;
  status: BookingStatus;
  unit?: {
    name: string;
    property: { name: string; city: string };
  };
}

export interface OwnerBooking {
  id: string;
  status: BookingStatus;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: string;
  unit: {
    name: string;
    property: { name: string };
  };
}

// Owner types
export interface OwnerProfile {
  id: string;
  businessName: string;
  verificationStatus: VerificationStatus;
}

// API Request/Response types
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

export interface RegisterOwnerRequest {
  businessName: string;
}

export interface CreatePropertyRequest {
  type: PropertyType;
  name: string;
  city: string;
  address: string;
  description?: string;
  imageUrl?: string;
}

export interface CreateUnitRequest {
  propertyId: string;
  name: string;
  capacity: number;
  pricePerNight: number;
  status?: UnitStatus;
}

export interface CreateBookingRequest {
  unitId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

export interface CreatePaymentIntentRequest {
  bookingId: string;
  paymentMethodType?: PaymentMethodType;
  idempotencyKey?: string;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export interface SearchQuery {
  city?: string;
}

export interface BookingCursorResponse {
  items: OwnerBooking[];
  nextCursor?: string;
  hasMore: boolean;
}