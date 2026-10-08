import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

/** Removes enquiries created by browser tests (local database only, see tests/localEnv.ts). */
export async function deleteTestInquiries(namePrefix: string): Promise<void> {
  const payload = await getPayload({ config })
  await payload.delete({ collection: 'inquiries', where: { name: { like: namePrefix } } })
}
