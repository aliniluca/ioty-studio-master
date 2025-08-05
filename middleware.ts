import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Specify that this is an Edge Runtime
export const runtime = 'experimental-edge';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Performance optimizations
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Add caching headers for static assets
  if (pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot|webmanifest|xml|json)$/i)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  // Add caching for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300');
  }

  // Add caching for pages
  if (!pathname.startsWith('/_next/') && !pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'public, max-age=60, s-maxage=300');
  }

  // Mobile-specific optimizations
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  if (isMobile) {
    // Add mobile-specific headers
    response.headers.set('Vary', 'User-Agent');
    
    // Optimize for mobile performance
    if (pathname.startsWith('/_next/static/')) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }

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

  // Performance monitoring
  if (pathname === '/api/health') {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    return response;
  }

  // Otherwise, continue with the request
  return response;
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