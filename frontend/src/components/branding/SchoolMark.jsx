// Reusable school logo image component used across branded screens.
export default function SchoolMark({ className = '' }) {
  return (
    <img
      src="/hhca-logo.png"
      alt="Holy Heart Christian Academy logo"
      className={`object-contain ${className}`}
      draggable="false"
    />
  );
}
