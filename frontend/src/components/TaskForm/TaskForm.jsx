// src/components/TaskForm/TaskForm.jsx
import React, { useEffect } from "react";
import { Form, Input, Select, Button, DatePicker, Typography } from "antd";
import moment from "moment";

const { Option } = Select;
const { Text } = Typography;

const TaskForm = ({ 
  form, 
  onFinish, 
  isGroupTask = false, 
  groupId = null, 
  users = [], 
  initialValues = null,
  buttonText = "Crear Tarea",
  loading = false,
  editMode = false // Parámetro para indicar si estamos editando una tarea existente
}) => {
  useEffect(() => {
    if (initialValues) {
      // Solo cargamos los valores iniciales para el campo de estado
      form.setFieldsValue({
        status: initialValues.status || 'In Progress'
      });
    } else {
      form.resetFields();
    }
  }, [form, initialValues]);

  const handleSubmit = (values) => {
    // Si estamos en modo edición, solo enviamos el estado
    if (editMode) {
      onFinish({ status: values.status });
      return;
    }
    
    // En modo creación, enviamos todos los campos
    const formattedValues = {
      ...values,
      dead_line: values.dead_line ? values.dead_line.toISOString() : new Date().toISOString(),
    };

    // Add groupId if it's a group task
    if (isGroupTask && groupId) {
      formattedValues.groupId = groupId;
    }

    onFinish(formattedValues);
  };

  // Si estamos en modo edición, solo mostramos el selector de estado y la fecha límite (no editable)
  if (editMode) {
    // Formatear la fecha para mostrarla
    const deadlineFormatted = initialValues && initialValues.dead_line
      ? moment(initialValues.dead_line).format('DD/MM/YYYY')
      : 'Sin fecha límite';

    return (
      <Form 
        form={form} 
        onFinish={handleSubmit} 
        layout="vertical"
      >
        {/* Mostrar la fecha límite como texto informativo */}
        <div style={{ marginBottom: 16 }}>
          <Text strong>Fecha límite:</Text> <Text>{deadlineFormatted}</Text>
        </div>

        {/* Campo de estado editable */}
        <Form.Item 
          name="status" 
          label="Estado" 
          initialValue={initialValues?.status || "In Progress"}
        >
          <Select>
            <Option value="In Progress">En Progreso</Option>
            <Option value="Done">Hecho</Option>
            <Option value="Paused">Pausado</Option>
            <Option value="Review">Revisión</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            style={{ width: '100%' }}
          >
            Actualizar Estado
          </Button>
        </Form.Item>
      </Form>
    );
  }

  // Formulario completo para creación de tareas
  return (
    <Form 
      form={form} 
      onFinish={handleSubmit} 
      layout="vertical"
    >
      <Form.Item 
        name="name_task" 
        label="Nombre de la Tarea" 
        rules={[{ required: true, message: "Por favor, ingresa el nombre de la tarea" }]}
      >
        <Input placeholder="Nombre de la Tarea"/>
      </Form.Item>

      <Form.Item 
        name="description" 
        label="Descripción"  
        rules={[{ required: true, message: "Por favor, ingresa una descripción" }]}
      >
        <Input.TextArea placeholder="Descripción" rows={4}/>
      </Form.Item>

      <Form.Item 
        name="category" 
        label="Categoría"
      >
        <Input placeholder="Categoría" />
      </Form.Item>

      <Form.Item 
        name="dead_line" 
        label="Fecha de Vencimiento" 
        rules={[{ required: true, message: "Por favor, selecciona una fecha" }]}
      >
        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
      </Form.Item>

      <Form.Item 
        name="status" 
        label="Estado" 
        initialValue="In Progress"
      >
        <Select>
          <Option value="In Progress">En Progreso</Option>
          <Option value="Done">Hecho</Option>
          <Option value="Paused">Pausado</Option>
          <Option value="Review">Revisión</Option>
        </Select>
      </Form.Item>

      {isGroupTask && (
        <Form.Item 
          name="assignedTo" 
          label="Asignar a" 
          rules={[{ required: true, message: "Por favor, selecciona al menos un usuario" }]}
        >
          <Select 
            mode="multiple"
            placeholder="Selecciona usuarios" 
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
      )}

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

export default TaskForm;