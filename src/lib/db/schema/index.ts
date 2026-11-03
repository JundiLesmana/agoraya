export * from './enums';
export * from './foundation';
export * from './rbac';
export * from './reporting';
export * from './kyc';
export * from './cms';
export * from './analytics';
export * from './citizen';
export * from './datasets';
export * from './project-progress';

import * as enums from './enums';
import * as foundation from './foundation';
import * as rbac from './rbac';
import * as reporting from './reporting';
import * as kyc from './kyc';
import * as cms from './cms';
import * as analytics from './analytics';
import * as citizen from './citizen';
import * as datasets from './datasets';
import * as projectProgress from './project-progress';

export const tables = { ...foundation, ...rbac, ...reporting, ...kyc, ...cms, ...analytics, ...citizen, ...datasets, ...projectProgress } as const;
export { enums };
