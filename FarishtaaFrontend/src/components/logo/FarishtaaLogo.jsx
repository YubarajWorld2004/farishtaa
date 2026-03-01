const FarishtaaLogo = ({ className = "" }) => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      fill="none"
      stroke="#E50914"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} inline-block align-middle`}
      aria-hidden="true"
      role="img"
    >
      {/* Seven-petal minimalist health flower */}
      {[...Array(7)].map((_, i) => (
        <path
          key={i}
          d="
            M50 20 
            C60 25, 70 40, 50 55
            C30 40, 40 25, 50 20
          "
          transform={`rotate(${i * (360 / 7)} 50 50)`}
        />
      ))}
      <circle cx="50" cy="50" r="6" stroke="#E50914" />
    </svg>
  );
}
export default FarishtaaLogo;