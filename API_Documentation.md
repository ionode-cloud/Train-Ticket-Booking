# Train Booking App - API Documentation for Postman

**Base URL:** `https://train-ticket-booking-uj88.onrender.com/api`

---

## 1. Fetch All Trains (GET)
Use this to retrieve the list of available trains. You can also filter them using Query Parameters.

* **Method:** `GET`
* **URL:** `https://train-ticket-booking-uj88.onrender.com/api/trains`
* **Options:** You can add query parameters to filter (e.g., `?source=New Delhi&destination=Mumbai Central`)
* **How to send data in Postman:**
  1. Open Postman and select **GET** from the dropdown.
  2. Paste the URL.
  3. Click **Send**.

---

## 2. Add a New Train (POST)
Use this to add a new train to the database. You will send data using a JSON Body.

* **Method:** `POST`
* **URL:** `https://train-ticket-booking-uj88.onrender.com/api/trains`
* **How to send data in Postman:**
  1. Select **POST** and paste the URL.
  2. Go to the **Body** tab, select the **raw** radio button, and choose **JSON** from the dropdown menu to the right.
  3. Enter the following data in the text area and click **Send**:
```json
{
  "trainName": "Vande Bharat Express",
  "trainNumber": "22436",
  "source": "New Delhi",
  "destination": "Varanasi",
  "departureTime": "06:00",
  "arrivalTime": "14:00",
  "duration": "8h 00m",
  "trainType": "Superfast",
  "price": 1500,
  "availableSeats": 100,
  "imageUrl": "https://images.unsplash.com/photo-1541427468627-a89a96e5ca1d?q=80&w=2070",
  "seatTypes": [
    { "code": "CC", "label": "Chair Car", "price": 1500, "totalSeats": 50, "availableSeats": 50 },
    { "code": "EC", "label": "Exec Chair", "price": 2500, "totalSeats": 50, "availableSeats": 50 }
  ]
}
```

---

## 3. Update an Existing Train (PUT)
Use this if you want to update train details like price or schedule. You will send Data using a JSON Body.

* **Method:** `PUT`
* **URL:** `https://train-ticket-booking-uj88.onrender.com/api/trains/[TRAIN_ID_HERE]` *(Replace with actual MongoDB _id)*
* **How to send data in Postman:**
  1. Select **PUT** and paste the URL containing the specific Train ID.
  2. Go to the **Body** tab, select the **raw** radio button, and choose **JSON** from the right dropdown.
  3. Enter the fields you want to update and click **Send**:
```json
{
  "price": 1800,
  "departureTime": "06:30"
}
```

---

## 4. Delete a Train (DELETE)
Use this to remove a train entirely.

* **Method:** `DELETE`
* **URL:** `https://train-ticket-booking-uj88.onrender.com/api/trains/[TRAIN_ID_HERE]` *(Replace with actual MongoDB _id)*
* **How to send data in Postman:**
  1. Select **DELETE** from the HTTP method dropdown.
  2. Paste the URL containing the Train ID you want to delete.
  3. Click **Send**.

---

## 5. Book a Ticket (POST)
Use this to simulate a user booking a ticket with the new multiple passengers feature. You will send data using a JSON Body.

* **Method:** `POST`
* **URL:** `https://train-ticket-booking-uj88.onrender.com/api/book-ticket`
* **How to send data in Postman:**
  1. Select **POST** and paste the URL.
  2. Go to the **Body** tab, select the **raw** radio button, and choose **JSON** from the right dropdown.
  3. Paste the following data *(Make sure to use a valid Train ID!)* in the text area and click **Send**:
```json
{
  "trainId": "REPLACE_WITH_VALID_TRAIN_ID",
  "seatType": "3AC",
  "numberOfSeats": 2,
  "travelDate": "2026-04-15",
  "email": "testuser@gmail.com",
  "phone": "9876543210",
  "passengers": [
    {
      "name": "Rahul Sharma",
      "aadhar": "123412341234"
    },
    {
      "name": "Priya Sharma",
      "aadhar": "567856785678"
    }
  ]
}
```
