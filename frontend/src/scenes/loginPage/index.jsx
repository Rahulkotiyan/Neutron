import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import Form from "./Form"; // We will create this next

const LoginPage = () => {
  const theme = useTheme();
  const isNonMobileScreens = useMediaQuery("(min-width: 1000px)");

  return (
    <Box>
      <Box
        width="100%"
        backgroundColor={theme.palette?.background?.alt || "#fff"}
        p="1rem 6%"
        textAlign="center"
      >
        <Typography fontWeight="bold" fontSize="32px" color="primary">
          Neutron
        </Typography>
      </Box>

      <Box
        width={isNonMobileScreens ? "50%" : "93%"}
        p="2rem"
        m="2rem auto"
        borderRadius="1.5rem"
        backgroundColor={theme.palette?.background?.alt || "#fff"}
        boxShadow="0px 0px 20px rgba(0,0,0,0.1)"
      >
        <Typography fontWeight="500" variant="h5" sx={{ mb: "1.5rem" }}>
          Welcome to CampusHub, the digital heart of your college.
        </Typography>
        <Form />
      </Box>
    </Box>
  );
};

export default LoginPage;
