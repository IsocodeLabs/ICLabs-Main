/**
 * Alternate public slugs → the role's real slug. Middleware answers these with a
 * permanent redirect. The PM role is titled "Product Management Intern"; its
 * page stays at the original slug `product-manager-intern`, and the slug that
 * matches the title redirects there.
 */
export const ROLE_SLUG_ALIASES: Record<string, string> = {
  'product-management-intern': 'product-manager-intern',
}
