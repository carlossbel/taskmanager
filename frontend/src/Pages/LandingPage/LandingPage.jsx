// src/pages/LandingPage/LandingPage.jsx
import React from 'react';
import { Button, Typography, Card, Row, Col, Space } from "antd";
import { useNavigate } from "react-router-dom";
import { CheckCircleOutlined, ScheduleOutlined, TeamOutlined } from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

const LandingPage = () => {
  const navigate = useNavigate();

  // Definir las características principales
  const features = [
    {
      icon: <ScheduleOutlined style={{ fontSize: '28px', color: '#1890ff' }} />,
      title: 'Gestión de Tareas',
      description: 'Organiza tus tareas personales y manténte al día con tus responsabilidades.'
    },
    {
      icon: <TeamOutlined style={{ fontSize: '28px', color: '#1890ff' }} />,
      title: 'Trabajo Colaborativo',
      description: 'Colabora con tu equipo en tareas grupales y asigna responsabilidades.'
    },
    {
      icon: <CheckCircleOutlined style={{ fontSize: '28px', color: '#1890ff' }} />,
      title: 'Seguimiento de Progreso',
      description: 'Visualiza el progreso de tus tareas y mantén el control de los plazos.'
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #91d5ff 0%, #69c0ff 100%)',
      backgroundSize: 'cover',
      backgroundAttachment: 'fixed',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Hero Section */}
        <div style={{ 
          textAlign: 'center', 
          color: 'white', 
          marginBottom: '40px',
          marginTop: '40px'
        }}>
          <Title style={{ color: 'white', fontSize: '48px', marginBottom: '16px' }}>
            Task Manager
          </Title>
          <Paragraph style={{ color: 'white', fontSize: '20px', maxWidth: '800px', margin: '0 auto 32px' }}>
            La solución perfecta para gestionar tus tareas personales y colaborar con tu equipo
          </Paragraph>
          <Space size="large">
            <Button 
              type="primary" 
              size="large" 
              onClick={() => navigate("/login")}
            >
              Iniciar Sesión
            </Button>
            <Button 
              size="large" 
              onClick={() => navigate("/register")}
              style={{ 
                borderColor: 'white',
                color: 'white',
                background: 'transparent'
              }}
            >
              Registrarse
            </Button>
          </Space>
        </div>

        {/* Features Section */}
        <Row gutter={[24, 24]} style={{ width: '100%', marginTop: '40px' }}>
          {features.map((feature, index) => (
            <Col xs={24} md={8} key={index}>
              <Card 
                style={{ 
                  height: '100%', 
                  borderRadius: '12px',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                  border: 'none'
                }}
                bodyStyle={{ padding: '30px' }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: '16px' }}>
                    {feature.icon}
                  </div>
                  <Title level={3} style={{ marginBottom: '12px' }}>
                    {feature.title}
                  </Title>
                  <Text type="secondary">
                    {feature.description}
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Footer */}
        <div style={{ marginTop: '60px', textAlign: 'center', color: 'white' }}>
          <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
            © {new Date().getFullYear()} Task Manager. Todos los derechos reservados.
          </Text>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;