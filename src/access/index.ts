import type { Access } from 'payload'

/** Only authenticated admins (founders). */
export const adminOnly: Access = ({ req }) => Boolean(req.user)

/** Anyone may read — published site content. */
export const publicRead: Access = () => true

/** Nobody via the API — mutations happen server-side or in admin. */
export const noOne: Access = () => false
