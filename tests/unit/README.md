# Unit test organization

Keep unit tests grouped by the module or feature they cover instead of adding
test files directly under this directory. Use the existing module folders where
they apply, and create a feature folder for new modules when needed.

For example, ASN registration flow and confirmation tests live under
`asn/register-asn/`. Vitest discovers `*.test.ts` and `*.test.tsx` files
recursively, so folder changes do not require configuration changes.
