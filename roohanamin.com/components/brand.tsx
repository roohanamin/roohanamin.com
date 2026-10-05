export function Brand() {
  return (
    <a className="brand" href="/weight" aria-label="Weight Log home">
      <span className="brand-mark" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 16l5-6 5 3 6-8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 5h4v4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span>
        weight<span className="brand-light">log</span>
        <small>by Roohan Amin</small>
      </span>
    </a>
  );
}
