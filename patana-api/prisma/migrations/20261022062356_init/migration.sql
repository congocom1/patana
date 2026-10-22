-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "booking";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "catalog";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "checkout";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "shared";

-- CreateTable
CREATE TABLE "shared"."User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "passwordHash" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'customer',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."Owner" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "businessName" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking"."Customer" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."Property" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."Unit" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "pricePerNight" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking"."Availability" (
    "id" UUID NOT NULL,
    "unitId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "priceOverride" DECIMAL(12,2),

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking"."Booking" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "unitId" UUID NOT NULL,
    "checkIn" DATE NOT NULL,
    "checkOut" DATE NOT NULL,
    "guests" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkout"."Payment" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" TEXT NOT NULL,
    "providerReference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared"."Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "shared"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Owner_userId_key" ON "catalog"."Owner"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_userId_key" ON "booking"."Customer"("userId");

-- CreateIndex
CREATE INDEX "Property_city_idx" ON "catalog"."Property"("city");

-- CreateIndex
CREATE UNIQUE INDEX "Availability_unitId_date_key" ON "booking"."Availability"("unitId", "date");

-- CreateIndex
CREATE INDEX "Booking_unitId_checkIn_checkOut_idx" ON "booking"."Booking"("unitId", "checkIn", "checkOut");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerReference_key" ON "checkout"."Payment"("providerReference");

-- AddForeignKey
ALTER TABLE "catalog"."Owner" ADD CONSTRAINT "Owner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "shared"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking"."Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "shared"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "catalog"."Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."Unit" ADD CONSTRAINT "Unit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "catalog"."Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking"."Availability" ADD CONSTRAINT "Availability_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "catalog"."Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking"."Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "booking"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking"."Booking" ADD CONSTRAINT "Booking_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "catalog"."Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout"."Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "booking"."Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "shared"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
