# The Group 52 Real Estate Rental Platform

A web-based real estate rental platform where customers can discover available properties, make inquiries, request viewings, submit rental applications, and manage their rental journey online.

The platform is operated by the company as the landlord/property manager. Properties listed are managed internally, while customers use the platform to find and rent properties.

## About The Project

The Group 52 Real Estate Rental Platform is being developed to make finding and renting a property easier for customers and easier to manage for the company.

Customers can create an account, browse available properties, view property information, save properties, contact the company, request viewings, and submit rental applications.

On the management side, authorized staff can create and manage property listings, review customer activity, manage applications and viewing requests, and handle the rental process.

**Project Parts:**

- Backend API - Node.js, Express, MongoDB
- Customer & Staff Frontend - React.

The backend provides data, authentication, business logic, and API endpoints used by the frontend.

---

## Tech Stack

**Backend:** Node.js, Express.js, MongoDB + Mongoose, JWT Authentication.
**Frontend:** React,
**Tools:** Git, GitHub

## Main Features

### 1. Customer Accounts

- Create an account & secure login
- View account information
- Access protected customer features
- Manage rental-related activities

> Customer accounts are created with `customer` role by default. Customers cannot assign admin/staff roles.

### 2. Property Listings

Each property contains:

- Property code, title, description, type
- Rental price, period, currency, service charge, caution fee
- Address, area, city, state, country, landmark, coordinates
- Bedrooms, bathrooms, parking, size, furnishing, year built, floor, condition
- Amenities, images, videos, floor plans
- Availability status, visibility, featured status, assigned staff, views

### 3. Finding a Property

Customers can browse public properties with filtering by:

- City, State, Property Type
- Min / Max rental price
- Number of bedrooms
- Furnished / Unfurnished status
- Pagination support

### 4. Property Availability Status

```text
draft - Not yet published
available - Publicly visible and rentable
reserved - Application approved, awaiting payment
rented - Currently occupied
unavailable - Temporarily not available
```
