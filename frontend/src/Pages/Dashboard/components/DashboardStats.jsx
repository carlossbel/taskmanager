// src/pages/Dashboard/components/DashboardStats.jsx
import React from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileSearchOutlined,
  TeamOutlined
} from '@ant-design/icons';

const DashboardStats = ({ stats }) => {
  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Tareas Totales"
            value={stats.totalTasks}
            valueStyle={{ color: '#1890ff' }}
            prefix={<FileSearchOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Tareas Completadas"
            value={stats.completedTasks}
            valueStyle={{ color: '#52c41a' }}
            prefix={<CheckCircleOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Tareas Pendientes"
            value={stats.pendingTasks}
            valueStyle={{ color: '#faad14' }}
            prefix={<ClockCircleOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic
            title="Grupos"
            value={stats.groups}
            valueStyle={{ color: '#722ed1' }}
            prefix={<TeamOutlined />}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default DashboardStats;