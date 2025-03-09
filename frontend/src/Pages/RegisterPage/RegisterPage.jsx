// src/pages/RegisterPage/RegisterPage.jsx
import React, { useState, useEffect } from "react";
import { Form, Input, Button, Typography, message, Card, Row, Col } from "antd";
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import AuthService from "../../services/authService";

const { Title } = Typography;

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Comprobamos si hay algún token antiguo y lo eliminamos
    // para asegurar que el usuario inicie sesión de nuevo
    AuthService.logout();
    
    console.log("RegisterPage - Auth check:", AuthService.isAuthenticated());
    
    // Si ya está autenticado, redirigir al dashboard
    if (AuthService.isAuthenticated()) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      
      // Verify password match
      if (values.password !== values.confirmPassword) {
        message.error("Las contraseñas no coinciden");
        setLoading(false);
        return;
      }
      
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...userData } = values;
      
      console.log("Intentando registrar con:", userData.email);
      
      const response = await AuthService.register(userData);
      
      if (response) {
        message.success("Usuario registrado con éxito. Ahora puedes iniciar sesión.");
        navigate("/login");
      } else {
        message.error("Error al registrar el usuario. Respuesta inválida del servidor.");
      }
    } catch (error) {
      console.error("Error al registrar:", error);
      
      // Handle specific errors
      if (error.response && error.response.data) {
        message.error(error.response.data.message || "Error al registrar usuario");
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
            Crear una nueva cuenta
          </Typography.Text>
        </div>

        <Form
          name="register"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: "Por favor, ingresa tu nombre de usuario" },
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Nombre de Usuario" 
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Por favor, ingresa tu correo electrónico" },
              { type: "email", message: "Por favor, ingresa un correo válido" },
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="Correo Electrónico" 
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: "Por favor, ingresa tu contraseña" },
              { min: 6, message: "La contraseña debe tener al menos 6 caracteres" }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Contraseña" 
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: "Por favor, confirma tu contraseña" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Las contraseñas no coinciden'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Confirmar Contraseña" 
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
              Registrarse
            </Button>
          </Form.Item>
          <Row justify="center">
            <Col>
              <Typography.Text>
                ¿Ya tienes una cuenta? <Link to="/login" style={{ color: '#1890ff' }}>Iniciar Sesión</Link>
              </Typography.Text>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default RegisterPage;