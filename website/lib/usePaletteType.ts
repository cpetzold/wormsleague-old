import { PaletteType, useMediaQuery } from "@material-ui/core";

import { useCookies } from "react-cookie";

export default function usePaletteType() {
  const prefersLightMode = useMediaQuery("(prefers-color-scheme: light)");
  const [cookies, setCookie] = useCookies(["paletteType"]);
  const paletteType =
    cookies.paletteType ?? (prefersLightMode ? "light" : "dark");

  return [
    paletteType,
    () => setCookie("paletteType", paletteType === "dark" ? "light" : "dark"),
  ];
}
