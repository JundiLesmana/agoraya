export * from './enums';
export * from './foundation';
export * from './rbac';
export * from './reporting';
export * from './kyc';
export * from './cms';
export * from './analytics';
export * from './citizen';

import * as enums from './enums';
import * as foundation from './foundation';
import * as rbac from './rbac';
import * as reporting from './reporting';
import * as kyc from './kyc';
import * as cms from './cms';
import * as analytics from './analytics';
import * as citizen from './citizen';

export const tables = { ...foundation, ...rbac, ...reporting, ...kyc, ...cms, ...analytics, ...citizen } as const;
export { enums };
