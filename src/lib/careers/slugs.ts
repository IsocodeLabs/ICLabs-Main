/**
 * Alternate public slugs → the role's real slug. Middleware answers these with
 * a permanent redirect. PRD v3 named the PM page `product-management-intern`;
 * v2 already shipped `product-manager-intern`, so that one stays canonical.
 */
export const ROLE_SLUG_ALIASES: Record<string, string> = {
  'product-management-intern': 'product-manager-intern',
}
