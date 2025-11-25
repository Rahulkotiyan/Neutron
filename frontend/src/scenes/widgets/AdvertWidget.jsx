import { Typography, useTheme } from "@mui/material";
import FlexBetween from "components/FlexBetween";
import WidgetWrapper from "components/WidgetWrapper";

const AdvertWidget = () => {
  const { palette } = useTheme();
  const dark = palette.neutral.dark;
  const main = palette.neutral.main;
  const medium = palette.neutral.medium;

  return (
    <WidgetWrapper>
      <FlexBetween>
        <Typography color={dark} variant="h5" fontWeight="500">
          Upcoming Events
        </Typography>
        <Typography color={medium}>Create Ad</Typography>
      </FlexBetween>
      <img
        width="100%"
        height="auto"
        alt="advert"
        src="http://localhost:5000/assets/event.jpg" // You can put a placeholder image in server/public/assets/event.jpg
        style={{ borderRadius: "0.75rem", margin: "0.75rem 0" }}
      />
      <FlexBetween>
        <Typography color={main}>Hackathon 2024</Typography>
        <Typography color={medium}>dait.edu.in</Typography>
      </FlexBetween>
      <Typography color={medium} m="0.5rem 0">
        Join the biggest coding hackathon in the campus. Win prizes worth 50k!
      </Typography>
    </WidgetWrapper>
  );
};

export default AdvertWidget;
