import { Webhook } from 'svix'
import { headers } from 'next/headers'
import type { WebhookEvent } from '@clerk/nextjs/webhooks'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { users } from '@/db/schema'

export async function GET() {
  return Response.json(
    { ok: false, message: 'This webhook endpoint only accepts POST requests.' },
    { status: 405 },
  )
}

export async function HEAD() {
  return new Response(null, { status: 405 })
}

export async function POST(req: Request) {
  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET

  if (!signingSecret) {
    return new Response('Missing webhook signing secret', { status: 500 })
  }

  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Error: Missing Svix headers', { status: 400 })
  }

  const payload = await req.text()
  const webhook = new Webhook(signingSecret)

  try {
    const evt = webhook.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent

    const eventType = evt.type

    if (eventType === 'user.created') {
      const data = evt.data
      const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || 'Clerk User'

      await db.insert(users).values({
        clerkId: data.id,
        name,
        imageUrl: data.image_url ?? '',
      })
    }

    if (eventType === 'user.deleted') {
      const { data } = evt

      if (!data.id) {
        return new Response('Missing user id', { status: 400 })
      }

      await db.delete(users).where(eq(users.clerkId, data.id))
    }

    if (eventType === 'user.updated') {
      const { data } = evt

      if (!data.id) {
        return new Response('Missing user id', { status: 400 })
      }

      const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || 'Clerk User'

      await db
        .update(users)
        .set({
          name,
          imageUrl: data.image_url ?? '',
        })
        .where(eq(users.clerkId, data.id))
    }

    return new Response('Webhook received', { status: 200 })
  } catch (error) {
    console.error('Error verifying webhook:', error)
    return new Response('Error verifying webhook', { status: 400 })
  }
}
