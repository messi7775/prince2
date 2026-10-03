# Audit Log — Improvements

## What changed

- Unified the full `AuditAction` list in `packages/config/src/constants.ts` with the current Prisma/types contract.
- Added a single frontend mapping for action labels, entity labels, field labels, status labels, value formatting, and action tones.
- Reworked the audit details dialog into a structured Arabic UI instead of raw JSON-only output.
- Added before/after change comparison when both snapshots exist.
- Preserved the original JSON snapshots and added copy actions for IDs and JSON.
- Added search across entity type, user email, entity ID, and IP address.
- Added a reset-filters action and improved responsive filter layout.
- Improved the audit table with clickable rows, clearer action badges, and better hierarchy.
- Kept the raw audit data available for technical investigation.

## Safety

No audit records are deleted or transformed by these UI/read-side changes. Existing `oldValues` and `newValues` remain intact.

## Remaining backend coverage note

`BACKUP_CREATED` and `BACKUP_RESTORED` are part of the audit contract, but the current backup backend in this project does not yet contain the corresponding audit calls. They should be added when the backup service/controller is completed.
