const baseUrl = process.env.SERVER_URL ?? "http://localhost:3000";

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
};

const container = {
  margin: "0 auto",
  padding: "0 0 48px",
  textAlign: "center" as const,
  width: "100%",
  maxWidth: "600px",
};

const bannerImage = {
  width: "100%",
  height: "auto",
  display: "block",
  marginBottom: "24px",
};

const headingStyles = {
  color: "#000000",
  fontSize: "24px",
  fontWeight: "600",
  margin: "30px 0 15px",
  padding: "0",
};

const paragraphStyles = {
  color: "#000000",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
};

const linkStyle = {
  color: "#000000",
  textDecoration: "underline",
};

const button = {
  backgroundColor: "#000000",
  borderRadius: "4px",
  color: "#ffffff",
  fontSize: "16px",
  textDecoration: "none",
  display: "inline-block",
  padding: "12px 24px",
  margin: "20px auto",
};

const hr = {
  borderColor: "#e6e6e6",
  margin: "20px 0",
};

export {
  bannerImage,
  baseUrl,
  button,
  container,
  headingStyles,
  hr,
  linkStyle,
  main,
  paragraphStyles,
};
