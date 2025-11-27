import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  useMediaQuery,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Navbar from "scenes/navbar";
import WidgetWrapper from "components/WidgetWrapper";
import FlexBetween from "components/FlexBetween";
import Dropzone from "react-dropzone";

const MarketplacePage = () => {
  const [items, setItems] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const token = useSelector((state) => state.token);
  const { _id } = useSelector((state) => state.user);
  const isNonMobile = useMediaQuery("(min-width:1000px)");

  // Form State
  const [form, setForm] = useState({
    title: "",
    price: "",
    category: "Books",
    description: "",
    image: null,
  });

  const getItems = async () => {
    const response = await fetch("http://localhost:5000/api/market", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setItems(data);
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("sellerId", _id);
    formData.append("title", form.title);
    formData.append("price", form.price);
    formData.append("category", form.category);
    formData.append("description", form.description);
    if (form.image) formData.append("picture", form.image);

    await fetch("http://localhost:5000/api/market", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    setForm({
      title: "",
      price: "",
      category: "Books",
      description: "",
      image: null,
    });
    setIsFormOpen(false);
    getItems(); // Refresh list
  };

  useEffect(() => {
    getItems();
  }, []);

  return (
    <Box>
      <Navbar />
      <Box padding="2rem 6%">
        {/* HEADER */}
        <FlexBetween mb="2rem">
          <Typography variant="h3" fontWeight="bold">
            Campus Marketplace
          </Typography>
          <Button
            variant="contained"
            onClick={() => setIsFormOpen(!isFormOpen)}
          >
            {isFormOpen ? "Close Form" : "Sell Item"}
          </Button>
        </FlexBetween>

        {/* SELL FORM */}
        {isFormOpen && (
          <WidgetWrapper mb="2rem">
            <Box display="flex" flexDirection="column" gap="1rem">
              <TextField
                label="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <TextField
                label="Price (₹)"
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
              <TextField
                label="Description"
                multiline
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
              <TextField
                select
                label="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {["Books", "Electronics", "Stationery", "Other"].map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </TextField>
              <Dropzone
                onDrop={(accepted) => setForm({ ...form, image: accepted[0] })}
              >
                {({ getRootProps, getInputProps }) => (
                  <Box
                    {...getRootProps()}
                    border="1px dashed grey"
                    p="1rem"
                    textAlign="center"
                  >
                    <input {...getInputProps()} />
                    <Typography>
                      {form.image ? form.image.name : "Drag Image Here"}
                    </Typography>
                  </Box>
                )}
              </Dropzone>
              <Button variant="contained" onClick={handleSubmit}>
                Post Ad
              </Button>
            </Box>
          </WidgetWrapper>
        )}

        {/* ITEM GRID */}
        <Box
          display="grid"
          gridTemplateColumns={isNonMobile ? "repeat(3, 1fr)" : "1fr"}
          gap="2rem"
        >
          {items.map((item) => (
            <WidgetWrapper key={item._id}>
              {item.images[0] && (
                <img
                  src={`http://localhost:5000/assets/${item.images[0]}`}
                  style={{
                    width: "100%",
                    height: "200px",
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                />
              )}
              <Typography variant="h5" mt="0.5rem">
                {item.title}
              </Typography>
              <Typography color="primary" fontWeight="bold">
                ₹{item.price}
              </Typography>
              <Typography color="textSecondary" fontSize="0.8rem">
                {item.category}
              </Typography>
              <Typography mt="0.5rem">{item.description}</Typography>
              <Button sx={{ mt: "1rem" }} fullWidth variant="outlined">
                Contact Seller
              </Button>
            </WidgetWrapper>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default MarketplacePage;
