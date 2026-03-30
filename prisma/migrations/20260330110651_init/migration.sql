-- CreateTable
CREATE TABLE "ClientAsset" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isClientSent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ClientAsset_pkey" PRIMARY KEY ("id")
);
