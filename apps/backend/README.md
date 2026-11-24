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

The review page can request sandbox account-rate estimates through FedEx Rates
and Transit Times API independently of the shipment creation flag. Rate requests
require an active company membership with permission to view prices. Compare
up to five manually selected ship dates; each date is a separate API request.
The quotes do not confirm service availability and do not necessarily include
customs, insurance, special services, or future pickup charges. Package
dimensions must be positive whole numbers, in the selected unit.
The estimated billing weight and rating method are displayed only when supplied
by FedEx. Cargobase dimensions in centimetres are converted to the nearest whole
inch (minimum one inch); operators must verify the result. The fixed packaging
type `YOUR_PACKAGING` is only appropriate for customer-provided packaging.

Run `python manage.py migrate` to create the FedEx address, notification
preference, shipment, and label tables. Saved addresses are shared within the
active company, and notification preferences are stored per company and CB.
Both require an active company membership with price-view permission.

Shipment creation remains disabled unless `FEDEX_SHIPMENT_CREATION_ENABLED` is
explicitly enabled, and the backend independently rejects creation unless
`FEDEX_BASE_URL` is exactly `https://apis-sandbox.fedex.com`. The initial flow
accepts only US-to-US shipments with `DROPOFF_AT_FEDEX_LOCATION`; it does not
schedule a pickup. A CB can have only one active, created, or unresolved FedEx
shipment per company. Definite FedEx rejections can be retried; timeouts and
ambiguous outcomes remain blocked until an authorized company administrator
verifies them in FedEx and records the resolution. Billing account numbers are
never stored in the shipment snapshot. Labels are validated as PDFs, stored in
the database, and served only to authorized members of the shipment's company.
An attempt stuck in `processing` cannot be resolved through the interface:
first investigate whether the request is still running and verify the outcome
with FedEx before carrying out any manual recovery.

Sending the label by email is a separate, user-confirmed action after shipment
creation; the backend attaches the stored label, not a file supplied by the
browser. Configure the backend SMTP sender with `EMAIL_HOST`, `EMAIL_PORT`,
`EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`, and
`DEFAULT_FROM_EMAIL`. For Gmail, use a mailbox app password rather than its
normal sign-in password. Do not put these credentials in frontend or
`NEXT_PUBLIC_` variables.

Creation notifications are limited to FedEx sandbox. Set
`FEDEX_CREATION_NOTIFICATION_TEST_EMAIL` in the backend environment to one
authorized test inbox and configure SMTP as above. If a saved preference for
the CB selects "Envío ha sido creado", the system sends one test message to
that inbox only, listing the selected recipient categories; it never sends this
notification to the actual contacts. The message includes the CB, tracking
number, sender, recipient and service, but no labels. The selected categories
are captured when creation begins; save preference changes before creating.
No other notification events are sent yet. Existing shipments are not emailed
retroactively.

The shipment and labels are saved before attempting email. A missing or
invalid configuration, or an SMTP failure, leaves the shipment created and
the notice unconfirmed; retry it on the creation screen or in Mis envíos.
SMTP acceptance does not guarantee delivery, and an error or interrupted
request may still result in delivery. Check the test inbox before retrying to
avoid duplicates. An attempt marked "sending" may be retried after five
minutes only after checking the inbox. `EMAIL_TIMEOUT` defaults to 15 seconds.
The separate manual label email is not redirected to this test inbox; it sends
to the address explicitly entered for that action.
