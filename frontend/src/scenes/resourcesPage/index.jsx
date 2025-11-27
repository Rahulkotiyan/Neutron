import { Box, Button, TextField, Typography, MenuItem } from "@mui/material";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Navbar from "scenes/navbar";
import WidgetWrapper from "components/WidgetWrapper";
import FlexBetween from "components/FlexBetween";
import Dropzone from "react-dropzone";

const ResourcesPage = () => {
  const [resources, setResources] = useState([]);
  const token = useSelector((state) => state.token);
  const {
    _id,
    department: userDept,
    year,
  } = useSelector((state) => state.user);

  // Filters & Form
  const [filterDept, setFilterDept] = useState(userDept || "CSE");
  const [filterSem, setFilterSem] = useState("1");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");

  const getResources = async () => {
    const response = await fetch(
      `http://localhost:5000/api/resources?department=${filterDept}&semester=${filterSem}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await response.json();
    setResources(data);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("uploaderId", _id);
    formData.append("title", title);
    formData.append("subject", "General"); // Can add subject field later
    formData.append("department", filterDept);
    formData.append("semester", filterSem);
    formData.append("category", "Notes");
    formData.append("file", file);

    await fetch("http://localhost:5000/api/resources", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    setIsUploadOpen(false);
    getResources();
  };

  useEffect(() => {
    getResources();
  }, [filterDept, filterSem]);

  return (
    <Box>
      <Navbar />
      <Box padding="2rem 6%">
        <FlexBetween mb="2rem">
          <Typography variant="h3">Resource Library</Typography>
          <Button
            variant="contained"
            onClick={() => setIsUploadOpen(!isUploadOpen)}
          >
            Upload Note
          </Button>
        </FlexBetween>

        {/* UPLOAD BOX */}
        {isUploadOpen && (
          <WidgetWrapper mb="2rem">
            <TextField
              label="Title (e.g., Unit 1 Notes)"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Dropzone onDrop={(accepted) => setFile(accepted[0])}>
              {({ getRootProps, getInputProps }) => (
                <Box
                  {...getRootProps()}
                  border="1px dashed grey"
                  p="2rem"
                  textAlign="center"
                  mb="1rem"
                >
                  <input {...getInputProps()} />
                  <Typography>{file ? file.name : "Drag PDF Here"}</Typography>
                </Box>
              )}
            </Dropzone>
            <Button
              fullWidth
              variant="contained"
              onClick={handleUpload}
              disabled={!file}
            >
              Upload
            </Button>
          </WidgetWrapper>
        )}

        {/* FILTERS */}
        <Box display="flex" gap="1rem" mb="2rem">
          <TextField
            select
            label="Department"
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            sx={{ width: "150px" }}
          >
            {["CSE", "ECE", "MECH", "CIVIL"].map((d) => (
              <MenuItem key={d} value={d}>
                {d}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Semester"
            value={filterSem}
            onChange={(e) => setFilterSem(e.target.value)}
            sx={{ width: "100px" }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* LIST */}
        <Box display="flex" flexDirection="column" gap="1rem">
          {resources.map((res) => (
            <WidgetWrapper
              key={res._id}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box>
                <Typography variant="h6">{res.title}</Typography>
                <Typography color="textSecondary">
                  {res.subject} • {res.category}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                href={`http://localhost:5000/assets/${res.fileUrl}`}
                target="_blank"
              >
                Download
              </Button>
            </WidgetWrapper>
          ))}
          {resources.length === 0 && (
            <Typography>No notes found for this semester.</Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ResourcesPage;
