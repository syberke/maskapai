import test from "node:test";
import assert from "node:assert/strict";
import {
  passengerGenderLabel,
  validatePassengerManifest,
} from "../lib/passengerManifest";

test("menyimpan lima penumpang berdasarkan seatId walaupun urutan payload berbeda", () => {
  const seatIds = [11, 12, 13, 14, 15];
  const result = validatePassengerManifest(seatIds, [
    { seatId: 15, name: "Penumpang Lima", nik: "3573010101010005", gender: "FEMALE" },
    { seatId: 11, name: "Penumpang Satu", nik: "3573010101010001", gender: "MALE" },
    { seatId: 14, name: "Penumpang Empat", nik: "3573010101010004", gender: "FEMALE" },
    { seatId: 12, name: "Penumpang Dua", nik: "3573010101010002", gender: "FEMALE" },
    { seatId: 13, name: "Penumpang Tiga", nik: "3573010101010003", gender: "MALE" },
  ]);

  assert.equal(result.success, true);
  if (!result.success) return;

  const bySeat = new Map(result.passengers.map((passenger) => [passenger.seatId, passenger]));
  assert.equal(bySeat.size, 5);
  assert.equal(bySeat.get(11)?.name, "Penumpang Satu");
  assert.equal(bySeat.get(11)?.gender, "MALE");
  assert.equal(bySeat.get(12)?.gender, "FEMALE");
  assert.equal(bySeat.get(15)?.name, "Penumpang Lima");
});

test("menolak dua identitas yang menunjuk kursi sama", () => {
  const result = validatePassengerManifest([21, 22], [
    { seatId: 21, name: "Satu", nik: "3573010101010001", gender: "MALE" },
    { seatId: 21, name: "Dua", nik: "3573010101010002", gender: "FEMALE" },
  ]);

  assert.equal(result.success, false);
  if (result.success) return;
  assert.match(result.message, /kursi/i);
});

test("menolak manifest jika satu gender belum dipilih", () => {
  const result = validatePassengerManifest([31], [
    { seatId: 31, name: "Penumpang", nik: "3573010101010001", gender: "" },
  ]);

  assert.equal(result.success, false);
});

test("tetap menerima payload client lama dengan fallback urutan seatIds", () => {
  const result = validatePassengerManifest([41, 42], [
    { name: "Penumpang A", nik: "3573010101010001", gender: "MALE" },
    { name: "Penumpang B", nik: "3573010101010002", gender: "FEMALE" },
  ]);

  assert.equal(result.success, true);
  if (!result.success) return;
  assert.deepEqual(result.passengers.map((passenger) => passenger.seatId), [41, 42]);
});

test("label gender tidak menganggap UNKNOWN sebagai perempuan", () => {
  assert.equal(passengerGenderLabel("MALE"), "Laki-laki");
  assert.equal(passengerGenderLabel("FEMALE"), "Perempuan");
  assert.equal(passengerGenderLabel("UNKNOWN"), "Belum diisi");
  assert.equal(passengerGenderLabel(null), "Belum diisi");
});
