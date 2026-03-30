declare module "virtual:styles" {
  interface Styles {
    palette: Record<string, string>;
    fills: Record<string, string>;
    roles: Record<string, string>;
  }
  const styles: Styles;
  export default styles;
}

declare module "virtual:theme-vars.css" {
  const css: string;
  export default css;
}
