import { auth, currentUser } from '@clerk/nextjs/server'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { users } from '@/db/schema'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const clerkUser = await currentUser()

    if (!clerkUser) {
      return Response.json({ ok: false, error: 'User not found' }, { status: 404 })
    }

    const localUsers = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1)

    const localUser = localUsers[0]
    const fallbackName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || 'Clerk User'

    return Response.json({
      ok: true,
      user: {
        id: clerkUser.id,
        dbId: localUser?.id ?? null,
        clerkId: clerkUser.id,
        name: localUser?.name ?? fallbackName,
        imageUrl: localUser?.imageUrl ?? clerkUser.imageUrl ?? '',
        isSynced: !!localUser,
      },
    })
  } catch (error) {
    console.error('Error fetching current user:', error)
    return Response.json({ ok: false, error: 'Failed to fetch current user' }, { status: 500 })
  }
}
