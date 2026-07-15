-- Add isBoarded column to Booking table
ALTER TABLE "Booking" ADD COLUMN "isBoarded" BOOLEAN NOT NULL DEFAULT false;