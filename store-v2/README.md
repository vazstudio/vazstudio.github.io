# VAZ Store 2.0

VAZ Store 2.0 is the next-generation commerce layer for VAZ, designed from the start to support digital products, physical products, and services.

## Product types

- digital: downloadable products and licensed digital assets
- physical: shippable products
- service: design and creative services

## Core flow

Catalog → Product → Cart → Checkout → Payment verification → Order → Fulfillment → Customer notifications

## Rules

- The current VAZ website and store remain untouched on this foundation branch.
- No payment secrets, API keys, or private credentials belong in frontend code.
- Payment success must be verified server-side before an order is marked paid.
- Digital files are private and delivered through controlled, expiring access.
- Physical orders include fulfillment and shipment status.
- Services include a fulfillment state and customer communication path.

## Planned layers

1. Storefront
2. Backend API
3. PostgreSQL database
4. Private digital storage
5. Payment provider adapter
6. Order/fulfillment engine
7. Admin dashboard
8. Authentication and authorization
9. Notifications
10. Audit logging

This branch is the foundation only; production payment credentials and hosting are intentionally not included.
