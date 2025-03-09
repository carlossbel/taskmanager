// src/layouts/AdminLayout.jsx
import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Typography, message } from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
  DashboardOutlined,
  TeamOutlined,
  LogoutOutlined,
  SettingOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import AuthService from '../services/authService';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = AuthService.getCurrentUser();

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = () => {
    AuthService.logout();
    message.success('Has cerrado sesión correctamente');
    navigate('/login');
  };

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes('/admin/dashboard')) return '1';
    if (path.includes('/admin/users')) return '2';
    if (path.includes('/admin/tasks')) return '3';
    if (path.includes('/admin/groups')) return '4';
    if (path.includes('/admin/settings')) return '5';
    return '1'; // default to dashboard
  };

  // Configuración del menú del usuario administrador
  const userMenuItems = [
    {
      key: '1',
      icon: <SettingOutlined />,
      label: <Link to="/admin/settings">Configuración</Link>,
    },
    {
      type: 'divider',
    },
    {
      key: '2',
      icon: <LogoutOutlined />,
      label: 'Cerrar Sesión',
      onClick: handleLogout,
    },
  ];

  // Elementos del menú principal
  const menuItems = [
    {
      key: '1',
      icon: <DashboardOutlined />,
      label: <Link to="/admin/dashboard">Dashboard</Link>,
    },
    {
      key: '2',
      icon: <UserOutlined />,
      label: <Link to="/admin/users">Usuarios</Link>,
    },
    {
      key: '3',
      icon: <CalendarOutlined />,
      label: <Link to="/admin/tasks">Tareas</Link>,
    },
    {
      key: '4',
      icon: <TeamOutlined />,
      label: <Link to="/admin/groups">Grupos</Link>,
    },
    {
      key: '5',
      icon: <SettingOutlined />,
      label: <Link to="/admin/settings">Configuración</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 4 }} />
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={[getSelectedKey()]}
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header style={{ 
          padding: 0,
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Button 
            type="text" 
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} 
            onClick={toggleCollapsed}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', marginRight: 16 }}>
            <Text style={{ marginRight: 8 }}>Administrador: {user.username || 'Admin'}</Text>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar 
                style={{ cursor: 'pointer', backgroundColor: '#ff4d4f' }} 
                icon={<UserOutlined />}
              />
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            background: '#fff',
            minHeight: 280,
            borderRadius: 4
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;