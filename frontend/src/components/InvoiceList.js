import React, { useEffect, useState } from 'react';
import {
  Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Button
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import axios from 'axios';
import { Link } from 'react-router-dom';

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await axios.get('https://invoiceprocessor-backend.onrender.com/api/invoices?limit=50');
      setInvoices(res.data.invoices || []);
    } catch (err) {
      console.error(err);
    }
  };

  const downloadJson = (id) => {
    window.open(`https://invoiceprocessor-backend.onrender.com/api/invoices/${id}/download-json`, '_blank');
  };

  const downloadImage = (id) => {
    window.open(`https://invoiceprocessor-backend.onrender.com/api/invoices/${id}/download-image`, '_blank');
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>History</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Invoice #</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Uploaded</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map(inv => (
              <TableRow key={inv._id}>
                <TableCell>{inv.invoiceNumber || '-'}</TableCell>
                <TableCell>{inv.vendorName || '-'}</TableCell>
                <TableCell>{inv.totalAmount || '-'}</TableCell>
                <TableCell>{new Date(inv.createdAt).toLocaleString()}</TableCell>
                <TableCell align="right">
                  <IconButton component={Link} to={`/invoice/${inv._id}`}><VisibilityIcon /></IconButton>
                  <IconButton onClick={() => downloadJson(inv._id)}><DownloadIcon /></IconButton>
                  <Button size="small" onClick={() => downloadImage(inv._id)} sx={{ ml: 1 }}>Image</Button>
                </TableCell>
              </TableRow>
            ))}
            {invoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">No invoices found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default InvoiceList;
