import logoSrc from '../../assets/logo.jpg';

/**
 * Logo Madior Insight — image officielle (fond sombre, monogramme M/S cuivré).
 * `size` contrôle la hauteur/largeur du cadre ; `rounded` ajuste le radius.
 */
export default function Logo({ size = 40, rounded = 10, style = {} }) {
  return (
    <img
      src={logoSrc}
      alt="Madior Insight"
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        objectFit: 'cover',
        flexShrink: 0,
        display: 'block',
        ...style,
      }}
    />
  );
}
