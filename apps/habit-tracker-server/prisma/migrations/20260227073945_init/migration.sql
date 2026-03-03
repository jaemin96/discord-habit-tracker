-- CreateTable
CREATE TABLE "Checkin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "customFields" JSONB,

    CONSTRAINT "Checkin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "duration" INTEGER,
    "calories" INTEGER,
    "description" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "appleHealthId" TEXT,

    CONSTRAINT "Workout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "camera" TEXT,
    "lens" TEXT,
    "iso" INTEGER,
    "shutterSpeed" TEXT,
    "aperture" TEXT,
    "focalLength" INTEGER,
    "location" TEXT,
    "description" TEXT,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatisticsCache" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "StatisticsCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Checkin_userId_date_idx" ON "Checkin"("userId", "date");

-- CreateIndex
CREATE INDEX "Workout_userId_date_idx" ON "Workout"("userId", "date");

-- CreateIndex
CREATE INDEX "Photo_userId_date_idx" ON "Photo"("userId", "date");

-- CreateIndex
CREATE INDEX "Photo_camera_idx" ON "Photo"("camera");

-- CreateIndex
CREATE UNIQUE INDEX "StatisticsCache_userId_period_startDate_key" ON "StatisticsCache"("userId", "period", "startDate");
