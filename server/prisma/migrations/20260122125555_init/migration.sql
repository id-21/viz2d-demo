-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "gcsPath" TEXT NOT NULL,
    "gcsUrl" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "thumbnailUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "imageId" TEXT NOT NULL,
    "inputGcsUrl" TEXT NOT NULL,
    "viz2dJobId" TEXT,
    "viz2dToken" TEXT,
    "outputUrl" TEXT,
    "failReason" TEXT,
    "viz2dFileId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    CONSTRAINT "Job_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Job_viz2dFileId_fkey" FOREIGN KEY ("viz2dFileId") REFERENCES "Viz2dFile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Viz2dFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "gcsPath" TEXT NOT NULL,
    "gcsUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "imageId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Viz2dFile_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Job_viz2dJobId_key" ON "Job"("viz2dJobId");

-- CreateIndex
CREATE UNIQUE INDEX "Job_viz2dFileId_key" ON "Job"("viz2dFileId");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");

-- CreateIndex
CREATE INDEX "Job_viz2dJobId_idx" ON "Job"("viz2dJobId");

-- CreateIndex
CREATE INDEX "Viz2dFile_imageId_idx" ON "Viz2dFile"("imageId");
