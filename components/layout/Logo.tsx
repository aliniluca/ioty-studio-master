// src/components/layout/Logo.tsx
export function Logo() {
  return (
    <div className="flex items-center cursor-pointer" aria-label="ioty.ro">
      <svg
        className="h-9 w-auto" // Adjusted height slightly for new logo proportions
        viewBox="0 0 170 40" // Adjusted viewBox for the new wider logo
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main text "iÖty.ro" */}
        <text
          x="10" // Initial x position
          y="28" // Baseline for the text
          fontSize="26" // Adjusted font size
          fontWeight="bold"
          fill="hsl(var(--primary))"
          fontFamily="Arial, Helvetica, sans-serif"
          letterSpacing="-0.5" // Slight adjustment for character spacing if needed
        >
          iÖty.ro
        </text>

        {/* Decorative elements: Triangle and three dots for the 'Ö' */}
        {/* Triangle: Positioned above the 'Ö'. 'Ö' is approx second char. */}
        {/* Assuming 'i' is at x=10, 'Ö' center is roughly x=30 with fontSize=26 */}
        {/* Triangle points: (base left), (base right), (top) */}
        <path
          d="M26,9 L34,9 L30,4 Z" // x-center 30, y-top 4, height 5, base-width 8
          fill="hsl(var(--primary))"
        />

        {/* Three dots to the right of the triangle */}
        {/* Dot 1 (largest) */}
        <circle cx="37" cy="6.5" r="2.5" fill="hsl(var(--primary))" />
        {/* Dot 2 (medium) */}
        <circle cx="42" cy="7.5" r="2" fill="hsl(var(--primary))" />
        {/* Dot 3 (smallest) */}
        <circle cx="46.5" cy="8.5" r="1.5" fill="hsl(var(--primary))" />
      </svg>
    </div>
  );
}
