import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Typography, Paper, Grid, Button, LinearProgress, Box
} from '@mui/material';
import axios from 'axios';

const InvoiceDetail = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/invoices/${id}`);
      setInvoice(res.data.invoice);
    } catch (err) {
      console.error(err);
    }
  };

  if (!invoice) return <Typography>Loading...</Typography>;

  const downloadJson = () => window.open(`http://localhost:5000/api/invoices/${id}/download-json`, '_blank');
  const downloadImage = () => window.open(`http://localhost:5000/api/invoices/${id}/download-image`, '_blank');

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Invoice Detail</Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Invoice Number</Typography>
            <Typography>{invoice.invoiceNumber || '-'}</Typography>

            <Typography variant="subtitle2" sx={{ mt: 1 }}>Date Issued</Typography>
            <Typography>{invoice.dateIssued || '-'}</Typography>

            <Typography variant="subtitle2" sx={{ mt: 1 }}>Vendor</Typography>
            <Typography>{invoice.vendorName || '-'}</Typography>

            <Typography variant="subtitle2" sx={{ mt: 1 }}>Total</Typography>
            <Typography>{invoice.totalAmount || '-'}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Actions</Typography>
            <Button variant="contained" sx={{ mt: 1 }} onClick={downloadJson}>Download JSON</Button>
            <Button variant="outlined" sx={{ mt: 1, ml: 2 }} onClick={downloadImage}>Download Image</Button>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Line Items</Typography>
            {Array.isArray(invoice.lineItems) && invoice.lineItems.length ? invoice.lineItems.map((li, idx) => (
              <Box key={idx} sx={{ mt: 1 }}>
                <Typography><strong>{li.description}</strong></Typography>
                <Typography>Qty: {li.quantity} • Unit: {li.unitPrice} • Confidence: {li.confidence || '-'}</Typography>
              </Box>
            )) : <Typography>No line items</Typography>}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Confidence values</Typography>
            {invoice.confidences ? Object.entries(invoice.confidences).map(([k, v]) => (
              <Box key={k} sx={{ mt: 1 }}>
                <Typography variant="subtitle2">{k}</Typography>
                <LinearProgress variant="determinate" value={Number(v) || 0} sx={{ height: 8, borderRadius: 2 }} />
                <Typography variant="caption">{v}%</Typography>
              </Box>
            )) : <Typography>No confidence data</Typography>}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InvoiceDetail;
