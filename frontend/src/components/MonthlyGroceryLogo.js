import { Link } from "react-router-dom";

/**
 * MonthlyGrocery brand mark — official uploaded logo (Feb 2026).
 *
 * The provided PNG has a warm cream background, so we render it in a rounded
 * container on light surfaces and swap to a soft cream chip on dark surfaces so
 * the logo always sits on the tone it was designed for.
 */
const LOGO_URL = "https://customer-assets-agu9un31.emergentagent.net/job_zopin-preview/artifacts/ajjfrqqn_image.png";

export default function MonthlyGroceryLogo({ size = "md", to = "/", variant = "light" }) {
  const height = size === "lg" ? 56 : size === "sm" ? 32 : 44;
  const isDark = variant === "dark";
  return (
    <Link to={to} className="inline-flex items-center group" data-testid="brand-logo" aria-label="MonthlyGrocery">
      <span
        className={`inline-flex items-center rounded-2xl overflow-hidden ${isDark ? "bg-[#F7F3E9] px-2 py-1 ring-1 ring-white/10" : ""}`}
      >
        <img
          src={LOGO_URL}
          alt="MonthlyGrocery"
          height={height}
          style={{ height, width: "auto", display: "block" }}
          className="select-none"
          draggable={false}
        />
      </span>
    </Link>
  );
}
