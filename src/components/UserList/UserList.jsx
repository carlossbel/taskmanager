// src/components/UserList/UserList.jsx
import React from "react";
import { Table, Button, Tag, Popconfirm, Select } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

const { Option } = Select;

const UserList = ({ 
  users, 
  loading, 
  onEditUser, 
  onDeleteUser, 
  onChangeRole, 
  currentUserId 
}) => {
  const columns = [
    {
      title: 'Usuario',
      dataIndex: 'username',
      key: 'username',
      sorter: (a, b) => a.username.localeCompare(b.username),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Rol',
      dataIndex: 'role',
      key: 'role',
      render: (role, record) => {
        // Prevent changing own role
        const isCurrentUser = record._id === currentUserId;
        return isCurrentUser ? (
          <Tag color={role === 'admin' ? 'red' : 'blue'}>{role}</Tag>
        ) : (
          <Select
            defaultValue={role || 'user'}
            style={{ width: 120 }}
            onChange={(value) => onChangeRole(record._id, value)}
            disabled={loading}
          >
            <Option value="user">user</Option>
            <Option value="admin">admin</Option>
          </Select>
        );
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => {
        // Prevent actions on own account
        const isCurrentUser = record._id === currentUserId;
        return !isCurrentUser ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              icon={<EditOutlined />} 
              onClick={() => onEditUser(record)} 
              size="small"
            />
            <Popconfirm
              title="¿Estás seguro de eliminar este usuario?"
              onConfirm={() => onDeleteUser(record._id)}
              okText="Sí"
              cancelText="No"
            >
              <Button 
                icon={<DeleteOutlined />} 
                danger 
                size="small"
              />
            </Popconfirm>
          </div>
        ) : (
          <span>No disponible</span>
        );
      },
    },
  ];

  return (
    <Table
      dataSource={users}
      columns={columns}
      rowKey="_id"
      loading={loading}
      pagination={{ pageSize: 10 }}
    />
  );
};

export default UserList;