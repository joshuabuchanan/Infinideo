import { auth } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { users } from '@/db/schema'

export async function POST() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const name = 'Clerk User'
    const imageUrl = ''

    await db
      .insert(users)
      .values({
        clerkId: userId,
        name,
        imageUrl,
      })
      .onConflictDoUpdate({
        target: users.clerkId,
        set: {
          updatedAt: new Date(),
        },
      })

    const syncedUser = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1)

    return Response.json({
      ok: true,
      user: {
        id: userId,
        dbId: syncedUser[0]?.id ?? null,
        clerkId: userId,
        name,
        imageUrl: syncedUser[0]?.imageUrl ?? imageUrl,
      },
    })
  } catch (error) {
    console.error('Error syncing Clerk user:', error)
    return Response.json({ ok: false, error: 'Failed to sync user' }, { status: 500 })
  }
}
