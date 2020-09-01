import { Box, Tooltip } from "@material-ui/core";

import ReactCountryFlag from "react-country-flag";
import countryList from "country-list";

export default function Flag({ countryCode, size = 24, ...props }) {
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
