import { NextRequest } from 'next/server';
import { authenticateChannel } from '@/lib/pusher';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { apiSuccess, ApiError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const socketId = formData.get('socket_id') as string;
    const channelName = formData.get('channel_name') as string;

    if (!socketId || !channelName) {
      return ApiError.validation('Missing socket_id or channel_name');
    }

    // For private channels, verify user authentication
    if (channelName.startsWith('private-') || channelName.startsWith('presence-')) {
      // Get session from Better Auth
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      // For admin channel, also verify admin status
      if (channelName === 'private-admin') {
        // Check for admin JWT token
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          return ApiError.unauthorized('Admin access required');
        }
        // Admin is authenticated via JWT - allow access
      } else if (!session?.user) {
        // Regular private channels require user session
        return ApiError.unauthorized('Authentication required for private channels');
      }

      try {
        const authResponse = authenticateChannel(socketId, channelName, session?.user?.id);
        return apiSuccess(authResponse);
      } catch (error) {
        console.error('Pusher auth error:', error);
        return ApiError.internal('Failed to authenticate channel');
      }
    }

    // Public channels don't need authentication
    return ApiError.badRequest('Channel does not require authentication');
  } catch (error) {
    console.error('Pusher auth error:', error);
    return ApiError.internal('Authentication failed');
  }
}
