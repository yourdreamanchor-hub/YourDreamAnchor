import type { Access } from 'payload'

export const anyone: Access = () => true

export const loggedIn: Access = ({ req: { user } }) => Boolean(user)
