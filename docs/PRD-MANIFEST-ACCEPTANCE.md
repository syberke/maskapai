# Acceptance Criteria: Multi-Passenger Ticket & Staff Manifest

## Booking

- A booking supports 1 to 5 passengers.
- The number of selected seats must equal the passenger count.
- Every selected seat must have exactly one passenger identity.
- Every passenger identity contains a name, NIK of 8 to 20 digits, and gender `MALE` or `FEMALE`.
- Passenger data is bound by `seatId`, not by array position.
- A transaction either saves the booking, payment row, seat locks, and all passenger manifest rows together, or saves none of them.

## Ticket and Boarding Pass

- The booking detail response includes all `BookingSeat` records and their `FlightSeat` relation.
- Checkout and boarding pass show each passenger name, NIK, gender, seat number, and seat class.
- Unknown legacy gender is displayed as `Belum diisi`, never inferred as female.

## Staff Operations

- Staff operational manifest has one row per passenger ticket.
- Staff report shows total passengers, male, female, legacy incomplete gender, and boarded passengers.
- Staff can filter by flight and export one CSV row per passenger ticket.
- Only authenticated staff can access the report page and CSV endpoint.

## Database

- New booking manifest rows require a non-null gender.
- PostgreSQL accepts only `MALE`, `FEMALE`, or `UNKNOWN` for legacy compatibility.
- New booking API requests accept only `MALE` or `FEMALE`.
