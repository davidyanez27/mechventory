// Single shared package, organized by module. Prefer the module subpaths
// (e.g. `@shared/auth`, `@shared/user`, `@shared/common`); this barrel
// re-exports everything for convenience.
export * from './auth';
export * from './user';
export * from './company';
export * from './common';
export * from './product';
export * from './customer';
export * from './invoice';
