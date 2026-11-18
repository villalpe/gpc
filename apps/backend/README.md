# ci check registration
# FedEx Cargobase shipment flow

The Cargobase FedEx review page is a prototype. Shipment creation and email
are disabled by default by `FEDEX_SHIPMENT_CREATION_ENABLED=False`. Do not
enable them until the implementation, permissions, shipment persistence, and
sandbox behavior have been reviewed. The default FedEx URL is the sandbox.
Keep FedEx credentials and the billing account number in backend environment
variables.

Required backend variables:

- `FEDEX_API_KEY`
- `FEDEX_SECRET_KEY`
- `FEDEX_ACCOUNT_NUMBER`
- `FEDEX_BASE_URL` (defaults to `https://apis-sandbox.fedex.com`)

Sending the label by email is a separate, user-confirmed action after shipment
creation. Configure the backend SMTP sender with `EMAIL_HOST`, `EMAIL_PORT`,
`EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`, and
`DEFAULT_FROM_EMAIL`. For Gmail, use a mailbox app password rather than its
normal sign-in password. Do not put these credentials in frontend or
`NEXT_PUBLIC_` variables.
