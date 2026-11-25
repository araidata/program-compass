-- CreateTable
CREATE TABLE "ImportPreview" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "appliedAt" TIMESTAMP(3),
    "schemaHash" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "baseHash" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "payload" JSONB NOT NULL,

    CONSTRAINT "ImportPreview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataUpload" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "finalizedAt" TIMESTAMP(3),
    "byteLength" INTEGER NOT NULL,
    "partCount" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,

    CONSTRAINT "DataUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataUploadPart" (
    "uploadId" TEXT NOT NULL,
    "part" INTEGER NOT NULL,
    "base64" TEXT NOT NULL,

    CONSTRAINT "DataUploadPart_pkey" PRIMARY KEY ("uploadId","part")
);

-- AddForeignKey
ALTER TABLE "DataUploadPart" ADD CONSTRAINT "DataUploadPart_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "DataUpload"("id") ON DELETE CASCADE ON UPDATE CASCADE;
