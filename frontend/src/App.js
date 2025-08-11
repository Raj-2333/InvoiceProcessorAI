import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Container, AppBar, Toolbar, Typography, Button } from '@mui/material';
import InvoiceUploader from './components/InvoiceUploader';
import InvoiceList from './components/InvoiceList';
import InvoiceDetail from './components/InvoiceDetail';

function App() {
  return (
    <BrowserRouter>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Invoice AI</Typography>
          <Button color="inherit" component={Link} to="/">Upload</Button>
          <Button color="inherit" component={Link} to="/history">History</Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Routes>
          <Route path="/" element={<InvoiceUploader />} />
          <Route path="/history" element={<InvoiceList />} />
          <Route path="/invoice/:id" element={<InvoiceDetail />} />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}

export default App;
