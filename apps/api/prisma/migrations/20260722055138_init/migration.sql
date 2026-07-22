-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentSpec" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "powerWatts" DECIMAL(65,30),
    "currentAmps" DECIMAL(65,30),
    "voltage" DECIMAL(65,30) NOT NULL,
    "powerFactor" DECIMAL(65,30),
    "phase" INTEGER NOT NULL,
    "connectorType" TEXT NOT NULL,
    "isContinuousLoad" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "source" TEXT,
    "unverified" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentSpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CableSpec" (
    "id" TEXT NOT NULL,
    "gaugeAwg" TEXT NOT NULL,
    "conductorCount" INTEGER NOT NULL,
    "connectorType" TEXT NOT NULL,
    "ratedAmps" DECIMAL(65,30) NOT NULL,
    "resistanceOhmsPer1000ft" DECIMAL(65,30) NOT NULL,
    "source" TEXT,
    "unverified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CableSpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plot" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "venue" TEXT,
    "eventDate" TIMESTAMP(3),
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistroUnit" (
    "id" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "inputConnector" TEXT NOT NULL,
    "maxAmps" DECIMAL(65,30) NOT NULL,
    "phaseConfig" INTEGER NOT NULL,
    "voltage" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "DistroUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Circuit" (
    "id" TEXT NOT NULL,
    "distroUnitId" TEXT NOT NULL,
    "breakerRatingAmps" DECIMAL(65,30) NOT NULL,
    "voltage" DECIMAL(65,30) NOT NULL,
    "phaseLeg" TEXT NOT NULL,
    "connectorType" TEXT NOT NULL,
    "isContinuousOverride" BOOLEAN,

    CONSTRAINT "Circuit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentInstance" (
    "id" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "equipmentSpecId" TEXT NOT NULL,
    "circuitId" TEXT,
    "cableSpecId" TEXT,
    "cableLengthFt" DECIMAL(65,30),
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "pinned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EquipmentInstance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "EquipmentSpec" ADD CONSTRAINT "EquipmentSpec_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plot" ADD CONSTRAINT "Plot_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistroUnit" ADD CONSTRAINT "DistroUnit_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "Plot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Circuit" ADD CONSTRAINT "Circuit_distroUnitId_fkey" FOREIGN KEY ("distroUnitId") REFERENCES "DistroUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentInstance" ADD CONSTRAINT "EquipmentInstance_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "Plot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentInstance" ADD CONSTRAINT "EquipmentInstance_equipmentSpecId_fkey" FOREIGN KEY ("equipmentSpecId") REFERENCES "EquipmentSpec"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentInstance" ADD CONSTRAINT "EquipmentInstance_circuitId_fkey" FOREIGN KEY ("circuitId") REFERENCES "Circuit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentInstance" ADD CONSTRAINT "EquipmentInstance_cableSpecId_fkey" FOREIGN KEY ("cableSpecId") REFERENCES "CableSpec"("id") ON DELETE SET NULL ON UPDATE CASCADE;
