// src/components/GroupForm/GroupForm.jsx
import React, { useEffect } from "react";
import { Form, Input, Select, Button } from "antd";

const { Option } = Select;

const GroupForm = ({ 
  form, 
  onFinish, 
  users = [], 
  initialValues = null,
  buttonText = "Crear Grupo",
  loading = false
}) => {
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [form, initialValues]);

  return (
    <Form 
      form={form} 
      onFinish={onFinish} 
      layout="vertical"
    >
      <Form.Item 
        name="name" 
        label="Nombre del Grupo" 
        rules={[{ required: true, message: "Por favor, ingresa el nombre del grupo" }]}
      >
        <Input placeholder="Nombre del Grupo" />
      </Form.Item>
      
      <Form.Item 
        name="user" 
        label="Usuarios"
      >
        <Select 
          mode="multiple" 
          placeholder="Selecciona los usuarios" 
          style={{ width: '100%' }} 
          showSearch
          filterOption={(input, option) => 
            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
          }
        >
          {users.map((user) => (
            <Option key={user._id} value={user._id}>
              {user.email} ({user.username})
            </Option>
          ))}
        </Select>
      </Form.Item>
      
      <Form.Item>
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={loading}
          style={{ width: '100%' }}
        >
          {buttonText}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default GroupForm;