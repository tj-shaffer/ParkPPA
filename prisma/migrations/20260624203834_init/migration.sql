-- CreateEnum
CREATE TYPE "GarageStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'CLOSED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CONSUMER', 'MANAGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "NotifyPreference" AS ENUM ('EMAIL', 'SMS', 'BOTH');

-- CreateEnum
CREATE TYPE "LeaseType" AS ENUM ('TWENTY_FOUR_HR', 'DAYTIME', 'NIGHTTIME', 'WEEKEND');

-- CreateEnum
CREATE TYPE "ResidentProofStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "LeaseStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'PAST_DUE', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentProcessor" AS ENUM ('STRIPE', 'PAYEREXPRESS', 'MANUAL');

-- CreateEnum
CREATE TYPE "MagicLinkPurpose" AS ENUM ('LOGIN', 'PAYMENT', 'LEASE_VIEW');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PAYMENT_DUE', 'PAST_DUE', 'PAYMENT_CONFIRM', 'LEASE_EXPIRY', 'RATE_CHANGE', 'CLOSURE', 'WELCOME', 'CUSTOM');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('WAITING', 'OFFERED', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Garage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "totalSpaces" INTEGER NOT NULL,
    "leasedSpaces" INTEGER NOT NULL DEFAULT 0,
    "monthlyRate" DECIMAL(10,2) NOT NULL,
    "residentMonthlyRate" DECIMAL(10,2),
    "daytimeRate" DECIMAL(10,2),
    "nightRate" DECIMAL(10,2),
    "phone" TEXT,
    "email" TEXT,
    "imageUrl" TEXT,
    "status" "GarageStatus" NOT NULL DEFAULT 'ACTIVE',
    "operatingHours" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Garage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CONSUMER',
    "notifyPreference" "NotifyPreference" NOT NULL DEFAULT 'EMAIL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lease" (
    "id" TEXT NOT NULL,
    "leaseNumber" TEXT NOT NULL,
    "garageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "spotNumber" TEXT,
    "type" "LeaseType" NOT NULL DEFAULT 'TWENTY_FOUR_HR',
    "monthlyRate" DECIMAL(10,2) NOT NULL,
    "isResident" BOOLEAN NOT NULL DEFAULT false,
    "residentProofStatus" "ResidentProofStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "status" "LeaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "processorId" TEXT,
    "processor" "PaymentProcessor" NOT NULL DEFAULT 'MANUAL',
    "receiptUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoPay" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripePaymentMethodId" TEXT,
    "cardLast4" TEXT,
    "cardBrand" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoPay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "purpose" "MagicLinkPurpose" NOT NULL DEFAULT 'LOGIN',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leaseId" TEXT,
    "paymentId" TEXT,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "content" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "garageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestedType" "LeaseType" NOT NULL DEFAULT 'TWENTY_FOUR_HR',
    "position" INTEGER NOT NULL,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'WAITING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GarageManagers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GarageManagers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Lease_leaseNumber_key" ON "Lease"("leaseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AutoPay_leaseId_key" ON "AutoPay"("leaseId");

-- CreateIndex
CREATE UNIQUE INDEX "MagicLink_token_key" ON "MagicLink"("token");

-- CreateIndex
CREATE INDEX "OtpCode_phone_code_idx" ON "OtpCode"("phone", "code");

-- CreateIndex
CREATE INDEX "OtpCode_email_code_idx" ON "OtpCode"("email", "code");

-- CreateIndex
CREATE INDEX "_GarageManagers_B_index" ON "_GarageManagers"("B");

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "Garage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoPay" ADD CONSTRAINT "AutoPay_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MagicLink" ADD CONSTRAINT "MagicLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "Garage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GarageManagers" ADD CONSTRAINT "_GarageManagers_A_fkey" FOREIGN KEY ("A") REFERENCES "Garage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GarageManagers" ADD CONSTRAINT "_GarageManagers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
