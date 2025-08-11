import React, { useState } from 'react';
import {
  Box, Typography, Button, Paper, LinearProgress, Alert
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const InvoiceUploader = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const validateFile = (file) => {
    if (!file) return false;
    const types = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!types.includes(file.type)) {
      setError('Only JPG / PNG / PDF allowed');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Max file size 10MB');
      return false;
    }
    setError('');
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (validateFile(f)) setFile(f);
  };

  const handleChange = (e) => {
    const f = e.target.files[0];
    if (validateFile(f)) setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.invoice?._id) {
        // navigate to detail page
        navigate(`/invoice/${res.data.invoice._id}`);
      } else {
        setError('Upload succeeded but response unexpected');
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Upload Invoice</Typography>

      <Paper
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        sx={{ p: 4, textAlign: 'center', border: '2px dashed #1976d2', bgcolor: '#e3f2fd' }}
      >
        <CloudUploadIcon sx={{ fontSize: 48 }} color="primary" />
        <Typography>Drag & drop or click to select</Typography>

        <input type="file" hidden id="file" onChange={handleChange} />
        <label htmlFor="file">
          <Button variant="outlined" sx={{ mt: 2 }} component="span">Choose File</Button>
        </label>

        {file && <Typography mt={1}><strong>Selected:</strong> {file.name}</Typography>}
      </Paper>

      <Button
        variant="contained"
        sx={{ mt: 3 }}
        disabled={!file || loading}
        onClick={handleUpload}
      >
        Upload & Extract
      </Button>

      {loading && <LinearProgress sx={{ mt: 2 }} />}
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Box>
  );
};

export default InvoiceUploader;
