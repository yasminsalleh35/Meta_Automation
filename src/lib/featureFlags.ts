// audit DATA-01: Advanced Analytics still renders estimated/static numbers.
// Hidden by default until it is rebuilt on real Meta insights; set
// VITE_FEATURE_ADVANCED_ANALYTICS=true to expose the route for internal testing.
export const FEATURE_ADVANCED_ANALYTICS =
  import.meta.env.VITE_FEATURE_ADVANCED_ANALYTICS === 'true';
