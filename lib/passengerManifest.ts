export const PASSENGER_GENDERS = ["MALE", "FEMALE"] as const;

export type PassengerGender = (typeof PASSENGER_GENDERS)[number];

export type PassengerInput = {
  seatId?: number;
  name?: string;
  nik?: string;
  gender?: string;
};

export type NormalizedPassenger = {
  seatId: number;
  name: string;
  nik: string;
  gender: PassengerGender;
};

export type ManifestValidationResult =
  | { success: true; passengers: NormalizedPassenger[] }
  | { success: false; message: string };

export function isPassengerGender(value: unknown): value is PassengerGender {
  return typeof value === "string" && PASSENGER_GENDERS.includes(value as PassengerGender);
}

export function passengerGenderLabel(value: string | null | undefined) {
  if (value === "MALE") return "Laki-laki";
  if (value === "FEMALE") return "Perempuan";
  return "Belum diisi";
}

export function validatePassengerManifest(
  seatIds: number[],
  passengers: PassengerInput[],
): ManifestValidationResult {
  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    return { success: false, message: "Minimal satu kursi harus dipilih." };
  }

  if (new Set(seatIds).size !== seatIds.length) {
    return { success: false, message: "Kursi yang dipilih tidak boleh duplikat." };
  }

  if (!Array.isArray(passengers) || passengers.length !== seatIds.length) {
    return {
      success: false,
      message: "Data nama, NIK, dan gender harus tersedia untuk setiap kursi.",
    };
  }

  const normalized = passengers.map((passenger, index) => {
    const seatId = Number(passenger.seatId ?? seatIds[index]);
    const gender = String(passenger.gender || "").trim().toUpperCase();

    return {
      seatId,
      name: String(passenger.name || "").trim(),
      nik: String(passenger.nik || "").replace(/\D/g, "").trim(),
      gender,
    };
  });

  const passengerSeatIds = normalized.map((passenger) => passenger.seatId);
  const selectedSeatSet = new Set(seatIds);

  if (
    passengerSeatIds.some((seatId) => !Number.isInteger(seatId) || !selectedSeatSet.has(seatId)) ||
    new Set(passengerSeatIds).size !== passengerSeatIds.length
  ) {
    return {
      success: false,
      message: "Setiap penumpang harus terhubung ke satu kursi yang berbeda.",
    };
  }

  const hasInvalidPassenger = normalized.some((passenger) => {
    return (
      passenger.name.length < 2 ||
      !/^\d{8,20}$/.test(passenger.nik) ||
      !isPassengerGender(passenger.gender)
    );
  });

  if (hasInvalidPassenger) {
    return {
      success: false,
      message: "Nama, NIK 8-20 digit, dan gender setiap penumpang wajib valid.",
    };
  }

  return {
    success: true,
    passengers: normalized.map((passenger) => ({
      ...passenger,
      gender: passenger.gender as PassengerGender,
    })),
  };
}
