import ReactCountryFlag from "react-country-flag";
import { Tooltip, Box } from "@material-ui/core";
import countryList from "country-list";

export default function Flag({ countryCode, size = 32, ...props }) {
  return (
    <Tooltip title={countryList.getName(countryCode)} placement="top" arrow>
      <span>
        <ReactCountryFlag
          countryCode={countryCode}
          svg
          style={{ width: size, height: size * (3 / 4) }}
          {...props}
        />
      </span>
    </Tooltip>
  );
}
