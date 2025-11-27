import { Box, Typography, useTheme } from "@mui/material";
import WidgetWrapper from "components/WidgetWrapper";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const TrendingWidget = () => {
  const { palette } = useTheme();
  const dark = palette.neutral.dark;
  const main = palette.neutral.main;
  const medium = palette.neutral.medium;

  const trends = [
    { tag: "#IPLFinal", count: "20k Posts" },
    { tag: "#SemesterExams", count: "15k Posts" },
    { tag: "#DAIT_FEST24", count: "10k Posts" },
  ];

  return (
    <WidgetWrapper>
      <Typography color={dark} variant="h5" fontWeight="500" sx={{ mb: "1.5rem" }}>
        What's Trending
      </Typography>
      <Box display="flex" flexDirection="column" gap="1rem">
        {trends.map((trend, i) => (
          <Box key={i}>
            <Typography color={main} fontWeight="bold">
              {trend.tag}
            </Typography>
            <Typography color={medium} fontSize="0.75rem">
              {trend.count}
            </Typography>
          </Box>
        ))}
      </Box>
    </WidgetWrapper>
  );
};

const EventsWidget = () => {
  const { palette } = useTheme();
  const dark = palette.neutral.dark;
  const medium = palette.neutral.medium;
  const [events, setEvents] = useState([]);
  const token = useSelector((state) => state.token);

  const getEvents = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/events", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.log("Error fetching events:", error);
    }
  };

  useEffect(() => {
    getEvents();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <WidgetWrapper m="2rem 0">
      <Typography color={dark} variant="h5" fontWeight="500" sx={{ mb: "1.5rem" }}>
        Upcoming Events
      </Typography>
      <Box display="flex" flexDirection="column" gap="1rem">
        {events.length > 0 ? (
          events.map((event) => (
            <Box key={event._id} p="1rem" backgroundColor={palette.background.default} borderRadius="0.75rem">
              <Typography color={dark} fontWeight="bold">
                {event.title}
              </Typography>
              <Typography color={medium} fontSize="0.75rem">
                {event.location} - {new Date(event.date).toLocaleDateString()}
              </Typography>
            </Box>
          ))
        ) : (
          <Typography color={medium}>No upcoming events.</Typography>
        )}
      </Box>
    </WidgetWrapper>
  );
};

const QuickLinksWidget = () => {
  const { palette } = useTheme();
  const dark = palette.neutral.dark;

  return (
    <WidgetWrapper>
      <Typography color={dark} variant="h5" fontWeight="500" sx={{ mb: "1.5rem" }}>
        Quick Links
      </Typography>
      <Box display="flex" flexDirection="column" gap="0.5rem">
        <Typography color={palette.primary.main} sx={{ cursor: "pointer" }}>
          University Portal
        </Typography>
        <Typography color={palette.primary.main} sx={{ cursor: "pointer" }}>
          Academic Calendar
        </Typography>
      </Box>
    </WidgetWrapper>
  );
};

const RightSidebar = () => {
  return (
    <Box>
      <TrendingWidget />
      <EventsWidget />
      <QuickLinksWidget />
    </Box>
  );
};

export default RightSidebar;
