// src/pages/LoginPage/LoginPage.jsx
import React, { useState, useEffect } from "react";
import { Form, Input, Button, Typography, message, Card, Row, Col } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import AuthService from "../../services/authService";

const { Title } = Typography;

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Comprobamos si hay algún token antiguo y lo eliminamos
    // para asegurar que el usuario inicie sesión de nuevo
    AuthService.logout();
    
    console.log("LoginPage - Auth check:", AuthService.isAuthenticated());
    
    // Si ya está autenticado, redirigir al dashboard correspondiente
    if (AuthService.isAuthenticated()) {
      if (AuthService.isAdmin()) {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  }, [navigate]);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      console.log("Intentando iniciar sesión con:", values.email);
      
      const response = await AuthService.login(values);
      
      if (response && response.token) {
        message.success("Inicio de sesión exitoso");
        // Damos tiempo para que el token se guarde correctamente
        setTimeout(() => {
          // Redirect to appropriate dashboard based on role
          if (AuthService.isAdmin()) {
            navigate("/admin/dashboard");
          } else {
            navigate("/dashboard");
          }
        }, 300);
      } else {
        message.error("Respuesta del servidor inválida");
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      if (error.response && error.response.data) {
        message.error(error.response.data.message || "Credenciales incorrectas");
      } else {
        message.error("Error de conexión con el servidor");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #91d5ff 0%, #69c0ff 100%)',
      backgroundSize: 'cover',
      backgroundAttachment: 'fixed'
    }}>
      <Card
        style={{ 
          width: 400, 
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          borderRadius: '12px',
          border: 'none'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>Task Manager</Title>
          <Typography.Text type="secondary">
            Iniciar Sesión en tu cuenta
          </Typography.Text>
        </div>

        <Form
          name="login"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          initialValues={{ remember: true }}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Por favor, ingresa tu correo electrónico" },
              { type: "email", message: "Por favor, ingresa un correo válido" },
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Correo Electrónico" 
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: "Por favor, ingresa tu contraseña" },
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Contraseña" 
              size="large"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
            >
              Iniciar Sesión
            </Button>
          </Form.Item>
          <Row justify="center">
            <Col>
              <Typography.Text>
                ¿No tienes una cuenta? <Link to="/register" style={{ color: '#1890ff' }}>Regístrate</Link>
              </Typography.Text>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;