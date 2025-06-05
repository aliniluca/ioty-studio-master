
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for maintenance mode (e.g., via an environment variable NEXT_PUBLIC_MAINTENANCE_MODE)
  // Ensure the variable is read as a string 'true'
  // const isInMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';
  // For demonstration purposes, to "trigger" maintenance mode, we'll hardcode this to true.
  // In a real scenario, you would set the NEXT_PUBLIC_MAINTENANCE_MODE environment variable.
  const isInMaintenanceMode = false; // Changed to false to disable maintenance mode

  // If in maintenance mode:
  // - and the current path is not the maintenance page itself
  // - and the path is not for Next.js internal static files
  // - and the path is not for API routes
  // - and the path is not a common static asset extension
  // Then, rewrite to the maintenance page.
  if (
    isInMaintenanceMode &&
    pathname !== '/maintenance' &&
    !pathname.startsWith('/_next/') &&
    !pathname.startsWith('/api/') &&
    !pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot|webmanifest|xml|json)$/i)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/maintenance';
    return NextResponse.rewrite(url);
  }

  // Otherwise, continue with the request
  return NextResponse.next();
}

// Configure the matcher to apply middleware to relevant paths.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     *
     * This is a general filter. The logic within the middleware function above
     * provides more granular control, for example, to ensure the /maintenance
     * page itself is accessible even if it matches this pattern.
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

