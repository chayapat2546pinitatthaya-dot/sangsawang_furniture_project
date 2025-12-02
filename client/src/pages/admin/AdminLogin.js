import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import InputGroup from 'react-bootstrap/InputGroup';
import axios from 'axios';

export default function AdminLogin({ login }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/admin/login', formData);
      login(response.data.user, response.data.token);
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Admin login error:', error);
      setError(error.response?.data?.error || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ 
      minHeight: '100vh', 
      background: '#f6f1e6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Container>
        <Row className="justify-content-center">
          <Col lg={5} md={6}>
            <Card style={{ 
              backgroundColor: '#ffffff', 
              border: 'none',
              borderRadius: '15px',
              boxShadow: '0 10px 30px rgba(58, 47, 39, 0.12)'
            }}>
              <Card.Body style={{ padding: '40px' }}>
                {/* Header Icons */}
                <div className="text-center mb-4">
                  <i className="bi bi-shield-lock" style={{ fontSize: '32px', color: '#b7895b' }}></i>
                </div>

                <h2 className="text-center mb-2" style={{ color: '#3a2f27', fontSize: '32px', fontWeight: 'bold' }}>
                  แสงสว่าง แอดมิน
                </h2>
                <p className="text-center mb-4" style={{ color: '#796b60', fontSize: '14px' }}>
                  เข้าสู่ระบบเพื่อจัดการระบบ
                </p>
                
                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Control
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      placeholder="ชื่อผู้ใช้แอดมิน"
                      style={{
                        backgroundColor: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '15px',
                        fontSize: '16px',
                        boxShadow: '0 2px 8px rgba(58, 47, 39, 0.08)'
                      }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <InputGroup
                      style={{
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(58, 47, 39, 0.08)'
                      }}
                    >
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder="รหัสผ่าน"
                        style={{
                          backgroundColor: '#fff',
                          border: 'none',
                          padding: '15px',
                          fontSize: '16px'
                        }}
                      />
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => setShowPassword((prev) => !prev)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#b7895b',
                          fontSize: '20px',
                          padding: '0 18px'
                        }}
                      >
                        <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </Button>
                    </InputGroup>
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100 mb-3"
                    disabled={isLoading}
                    style={{
                      background: 'linear-gradient(125deg, #b7895b 0%, #cf9356 110%)',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '15px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#fff'
                    }}
                  >
                    {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                  </Button>
                </Form>

                <div className="d-flex justify-content-center mt-3">
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate('/login')}
                    style={{
                      borderRadius: '10px',
                      padding: '12px 20px',
                      fontSize: '14px',
                      borderColor: '#b7895b',
                      color: '#b7895b'
                    }}
                  >
                    เข้าสู่ระบบลูกค้า
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

