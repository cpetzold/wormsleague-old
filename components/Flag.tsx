import ReactCountryFlag from "react-country-flag";

export default function Flag({ countryCode, size = 32, ...props }) {
  return (
    <ReactCountryFlag
      countryCode={countryCode}
      svg
      style={{ width: size, height: size * (3 / 4) }}
      {...props}
    />
  );
}
