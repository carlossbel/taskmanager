const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY || "SECRET_KEY";

// Firebase setup
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Necesitarás crear este archivo

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Configuraciones de CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json());

// Middleware de autenticación
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.userId = decoded.userId;
    req.email = decoded.email; 
    next();
  } catch (error) {
    res.status(400).json({ message: 'Token inválido.' });
  }
};

// Función para crear un administrador inicial
const createAdminUser = async () => {
  try {
    // Verificar si ya existe un admin
    const adminSnapshot = await db.collection('users').where('role', '==', 'admin').get();
    
    if (!adminSnapshot.empty) {
      console.log('El usuario administrador ya existe');
      return;
    }

    const hashedPassword = await bcrypt.hash('adminpass', 10);
    
    const adminData = {
      email: 'admin@gmail.com',
      username: '123456',
      password: hashedPassword,
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').add(adminData);
    console.log('Usuario administrador creado con éxito');
    console.log('Email: admin@gmail.com, Password: adminpass');
  } catch (error) {
    console.error('Error al crear usuario administrador:', error);
  }
};

// Crear un administrador al iniciar el servidor
createAdminUser();

// RUTAS DE USUARIOS
// =======================================

// Registro de usuario
app.post('/api/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }

    // Verificar si el email ya está registrado
    const userSnapshot = await db.collection('users').where('email', '==', email).get();
    
    if (!userSnapshot.empty) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      email,
      username,
      password: hashedPassword,
      role: 'user',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const userRef = await db.collection('users').add(newUser);

    res.status(201).json({ 
      message: 'Usuario registrado con éxito.',
      userId: userRef.id
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ message: 'Error al registrar el usuario.', error: error.message });
  }
});

// Inicio de sesión
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario por email
    const userSnapshot = await db.collection('users').where('email', '==', email).get();
    
    if (userSnapshot.empty) {
      return res.status(400).json({ message: 'Usuario no encontrado.' });
    }

    // Obtener el primer documento (debería ser único por email)
    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Contraseña incorrecta.' });
    }

    // Generar token JWT
    const token = jwt.sign({ 
      userId: userDoc.id, 
      email: user.email 
    }, SECRET_KEY, { expiresIn: '1h' });

    res.status(200).json({ 
      message: 'Inicio de sesión exitoso.', 
      token, 
      userId: userDoc.id, 
      email: user.email,
      username: user.username,
      role: user.role || 'user' 
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ message: 'Error al iniciar sesión.', error: error.message });
  }
});

// Obtener todos los usuarios (accesible para usuarios autenticados)
app.get("/api/users", authenticate, async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = [];
    
    usersSnapshot.forEach(doc => {
      // Excluir al usuario actual
      if (doc.id !== req.userId) {
        const userData = doc.data();
        users.push({
          _id: doc.id,
          email: userData.email,
          username: userData.username,
          role: userData.role
        });
      }
    });
    
    console.log("Usuarios encontrados:", users.length);
    res.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ message: "Error al obtener usuarios", error: error.message });
  }
});

// Obtener un usuario por ID
app.get("/api/users/:userId", authenticate, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.params.userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    const userData = userDoc.data();
    
    res.json({
      _id: userDoc.id,
      email: userData.email,
      username: userData.username,
      role: userData.role
    });
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ message: "Error al obtener usuario", error: error.message });
  }
});

// Crear usuario (solo admin)
app.post('/api/users/admin', authenticate, async (req, res) => {
  try {
    // Verificar si el usuario es administrador
    const adminDoc = await db.collection('users').doc(req.userId).get();
    
    if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para crear usuarios.' });
    }
    
    const { email, username, password, role } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }

    // Verificar si el email ya está registrado
    const existingUserSnapshot = await db.collection('users').where('email', '==', email).get();
    
    if (!existingUserSnapshot.empty) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      email,
      username,
      password: hashedPassword,
      role: role || 'user',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').add(newUser);

    res.status(201).json({ message: 'Usuario creado con éxito.' });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ message: 'Error al crear el usuario.', error: error.message });
  }
});

// Actualizar usuario
app.put('/api/users/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, email } = req.body;
    
    // Verificar que el usuario a actualizar existe
    const userToUpdateDoc = await db.collection('users').doc(userId).get();
    
    if (!userToUpdateDoc.exists) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    
    // Verificar permisos (solo el propio usuario o un admin)
    const currentUserDoc = await db.collection('users').doc(req.userId).get();
    
    if (!currentUserDoc.exists) {
      return res.status(404).json({ message: 'Usuario autenticado no encontrado.' });
    }
    
    const currentUserData = currentUserDoc.data();
    const isAdmin = currentUserData.role === 'admin';
    const isSameUser = req.userId === userId;
    
    if (!isAdmin && !isSameUser) {
      return res.status(403).json({ message: 'No tienes permiso para actualizar este usuario.' });
    }
    
    // Construir objeto con campos a actualizar
    const updateFields = {};
    if (username) updateFields.username = username;
    if (email) updateFields.email = email;
    
    // Actualizar usuario
    await db.collection('users').doc(userId).update(updateFields);
    
    // Obtener datos actualizados
    const updatedUserDoc = await db.collection('users').doc(userId).get();
    const updatedUserData = updatedUserDoc.data();
    
    res.status(200).json({
      message: 'Usuario actualizado con éxito.',
      user: {
        _id: userId,
        username: updatedUserData.username,
        email: updatedUserData.email,
        role: updatedUserData.role
      }
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ message: 'Error al actualizar el usuario.', error: error.message });
  }
});

// Actualizar el rol de un usuario (solo admin)
app.put('/api/users/:userId/role', authenticate, async (req, res) => {
  try {
    // Verificar si el usuario es administrador
    const adminDoc = await db.collection('users').doc(req.userId).get();
    
    if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para cambiar roles.' });
    }
    
    const { role } = req.body;
    const { userId } = req.params;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Rol no válido.' });
    }

    // Verificar que el usuario a actualizar existe
    const userToUpdateDoc = await db.collection('users').doc(userId).get();
    
    if (!userToUpdateDoc.exists) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Actualizar rol
    await db.collection('users').doc(userId).update({ role });
    
    // Obtener datos actualizados
    const updatedUserDoc = await db.collection('users').doc(userId).get();
    const updatedUserData = updatedUserDoc.data();

    res.status(200).json({ 
      message: 'Rol de usuario actualizado con éxito.',
      user: {
        _id: userId,
        email: updatedUserData.email,
        username: updatedUserData.username,
        role: updatedUserData.role
      }
    });
  } catch (error) {
    console.error('Error al actualizar rol:', error);
    res.status(500).json({ message: 'Error al actualizar el rol del usuario.', error: error.message });
  }
});

// Eliminar usuario (solo admin)
app.delete('/api/users/:userId', authenticate, async (req, res) => {
  try {
    // Verificar si el usuario es administrador
    const adminDoc = await db.collection('users').doc(req.userId).get();
    
    if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para eliminar usuarios.' });
    }
    
    // Verificar que el usuario a eliminar existe
    const userToDeleteDoc = await db.collection('users').doc(req.params.userId).get();
    
    if (!userToDeleteDoc.exists) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    
    // Eliminar tareas del usuario
    const tasksSnapshot = await db.collection('tasks').where('userId', '==', req.params.userId).get();
    const batch = db.batch();
    
    tasksSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Eliminar usuario de los grupos
    const groupsSnapshot = await db.collection('groups').where('user', 'array-contains', req.params.userId).get();
    
    groupsSnapshot.forEach(doc => {
      const groupData = doc.data();
      const updatedUsers = groupData.user.filter(uid => uid !== req.params.userId);
      batch.update(doc.ref, { user: updatedUsers });
    });
    
    // Eliminar el usuario
    batch.delete(db.collection('users').doc(req.params.userId));
    
    // Ejecutar todas las operaciones en batch
    await batch.commit();
    
    res.status(200).json({ message: 'Usuario eliminado con éxito.' });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ message: 'Error al eliminar el usuario.', error: error.message });
  }
});

// RUTAS DE TAREAS
// =======================================

// Crear tarea personal
app.post('/api/tasks', authenticate, async (req, res) => {
  try {
    const { name_task, description, dead_line, status, category, groupId, assignedTo } = req.body;

    if (!name_task || !description || !dead_line) {
      return res.status(400).json({ message: 'Nombre, descripción y fecha límite son requeridos.' });
    }

    const newTask = {
      name_task,
      description,
      dead_line: new Date(dead_line),
      status: status || 'In Progress',
      category,
      userId: req.userId,
      groupId: groupId || null,
      assignedTo: assignedTo || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Crear nueva tarea
    const taskRef = await db.collection('tasks').add(newTask);
    
    // Obtener la tarea creada con su ID
    const taskDoc = await taskRef.get();
    const task = taskDoc.data();
    
    // Obtener información de usuarios asignados si existen
    let assignedUsers = [];
    
    if (assignedTo && assignedTo.length > 0) {
      const usersSnapshot = await db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', assignedTo).get();
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        assignedUsers.push({
          _id: doc.id,
          username: userData.username,
          email: userData.email
        });
      });
    }
    
    res.status(201).json({ 
      message: 'Tarea creada con éxito.', 
      task: {
        _id: taskRef.id,
        ...task,
        assignedTo: assignedUsers
      } 
    });
  } catch (error) {
    console.error("Error al crear tarea:", error);
    res.status(500).json({ message: 'Error al crear la tarea.', error: error.message });
  }
});

// Crear tarea de grupo
app.post('/api/tasks/group', authenticate, async (req, res) => {
  try {
    const { name_task, description, dead_line, status, category, groupId, assignedTo } = req.body;
    
    if (!name_task || !description || !dead_line || !groupId) {
      return res.status(400).json({ message: 'Faltan campos requeridos para la tarea de grupo.' });
    }
    
    // Verificar que el grupo existe
    const groupDoc = await db.collection('groups').doc(groupId).get();
    
    if (!groupDoc.exists) {
      return res.status(404).json({ message: 'Grupo no encontrado.' });
    }
    
    const groupData = groupDoc.data();
    
    // Verificar permisos (dueño o miembro del grupo)
    const isOwner = groupData.ownerId === req.userId;
    const isMember = groupData.user.includes(req.userId);
    
    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'No tienes permiso para crear tareas en este grupo.' });
    }
    
    const newTask = {
      name_task,
      description,
      dead_line: new Date(dead_line),
      status: status || 'In Progress',
      category,
      userId: req.userId,
      groupId,
      assignedTo: assignedTo || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Crear la tarea
    const taskRef = await db.collection('tasks').add(newTask);
    
    // Obtener la tarea creada con su ID
    const taskDoc = await taskRef.get();
    const task = taskDoc.data();
    
    // Obtener información de usuarios asignados si existen
    let assignedUsers = [];
    
    if (assignedTo && assignedTo.length > 0) {
      const usersSnapshot = await db.collection('users').where(admin.firestore.FieldPath.documentId(), 'in', assignedTo).get();
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        assignedUsers.push({
          _id: doc.id,
          username: userData.username,
          email: userData.email
        });
      });
    }
    
    res.status(201).json({ 
      message: 'Tarea colaborativa creada con éxito.', 
      task: {
        _id: taskRef.id,
        ...task,
        assignedTo: assignedUsers
      }
    });
  } catch (error) {
    console.error("Error al crear tarea de grupo:", error);
    res.status(500).json({ message: 'Error al crear la tarea colaborativa.', error: error.message });
  }
});

// Obtener tareas de un usuario
app.get('/api/tasks/:userId', authenticate, async (req, res) => {
  try {
    console.log("Token decodificado userId:", req.userId);
    console.log("Params userId:", req.params.userId);
    
    // Verificar que el usuario solicita sus propias tareas
    if (req.userId !== req.params.userId) {
      console.log("Los IDs no coinciden");
      return res.status(403).json({ 
        message: 'No autorizado para ver estas tareas.',
        details: {
          requestUserId: req.userId,
          paramUserId: req.params.userId
        }
      });
    }
    
    // Buscar tareas donde el usuario es creador o está asignado
    const tasksCreatedSnapshot = await db.collection('tasks').where('userId', '==', req.params.userId).get();
    const tasksAssignedSnapshot = await db.collection('tasks').where('assignedTo', 'array-contains', req.params.userId).get();
    
    const tasks = [];
    const processedTaskIds = new Set();
    
    // Procesar tareas creadas por el usuario
    tasksCreatedSnapshot.forEach(doc => {
      const taskData = doc.data();
      processedTaskIds.add(doc.id);
      
      tasks.push({
        _id: doc.id,
        ...taskData,
        dead_line: taskData.dead_line.toDate(),
        createdAt: taskData.createdAt?.toDate() || null
      });
    });
    
    // Procesar tareas asignadas al usuario (evitando duplicados)
    tasksAssignedSnapshot.forEach(doc => {
      if (!processedTaskIds.has(doc.id)) {
        const taskData = doc.data();
        tasks.push({
          _id: doc.id,
          ...taskData,
          dead_line: taskData.dead_line.toDate(),
          createdAt: taskData.createdAt?.toDate() || null
        });
      }
    });
    
    // Obtener información de usuarios asignados
    const userIds = new Set();
    tasks.forEach(task => {
      if (task.assignedTo && Array.isArray(task.assignedTo)) {
        task.assignedTo.forEach(userId => userIds.add(userId));
      }
    });
    
    // Solo buscar usuarios si hay IDs para buscar
    let userMap = {};
    if (userIds.size > 0) {
      const userIdsArray = Array.from(userIds);
      // Firestore no permite consultas 'in' con más de 10 elementos, así que dividimos en chunks si es necesario
      const chunkSize = 10;
      for (let i = 0; i < userIdsArray.length; i += chunkSize) {
        const chunk = userIdsArray.slice(i, i + chunkSize);
        const usersSnapshot = await db.collection('users')
          .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
          .get();
        
        usersSnapshot.forEach(doc => {
          const userData = doc.data();
          userMap[doc.id] = {
            _id: doc.id,
            username: userData.username,
            email: userData.email
          };
        });
      }
    }
    
    // Reemplazar IDs de usuarios asignados con sus datos
    tasks.forEach(task => {
      if (task.assignedTo && Array.isArray(task.assignedTo)) {
        task.assignedTo = task.assignedTo.map(userId => userMap[userId] || userId);
      }
    });
    
    console.log(`Encontradas ${tasks.length} tareas para el usuario ${req.params.userId}`);
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    res.status(500).json({ message: 'Error al obtener las tareas', error: error.message });
  }
});

// Obtener todas las tareas (solo admin)
app.get('/api/tasks', authenticate, async (req, res) => {
  try {
    // Verificar si el usuario es administrador
    const adminDoc = await db.collection('users').doc(req.userId).get();
    
    if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado para esta acción.' });
    }
    
    // Obtener todas las tareas
    const tasksSnapshot = await db.collection('tasks').get();
    const tasks = [];
    
    // Recopilar todos los IDs de usuario y grupo
    const userIds = new Set();
    const groupIds = new Set();
    
    tasksSnapshot.forEach(doc => {
      const taskData = doc.data();
      
      // Recopilar IDs de usuario y grupo
      if (taskData.userId) userIds.add(taskData.userId);
      if (taskData.groupId) groupIds.add(taskData.groupId);
      if (taskData.assignedTo && Array.isArray(taskData.assignedTo)) {
        taskData.assignedTo.forEach(id => userIds.add(id));
      }
      
      tasks.push({
        _id: doc.id,
        ...taskData,
        dead_line: taskData.dead_line.toDate(),
        createdAt: taskData.createdAt?.toDate() || null
      });
    });
    
    // Obtener información de usuarios
    let userMap = {};
    if (userIds.size > 0) {
      const userIdsArray = Array.from(userIds);
      // Dividir en chunks para respetar límite de Firestore
      const chunkSize = 10;
      for (let i = 0; i < userIdsArray.length; i += chunkSize) {
        const chunk = userIdsArray.slice(i, i + chunkSize);
        const usersSnapshot = await db.collection('users')
          .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
          .get();
        
        usersSnapshot.forEach(doc => {
          const userData = doc.data();
          userMap[doc.id] = {
            _id: doc.id,
            username: userData.username,
            email: userData.email
          };
        });
      }
    }
    
    // Obtener información de grupos
    let groupMap = {};
    if (groupIds.size > 0) {
      const groupIdsArray = Array.from(groupIds);
      // Dividir en chunks para respetar límite de Firestore
      const chunkSize = 10;
      for (let i = 0; i < groupIdsArray.length; i += chunkSize) {
        const chunk = groupIdsArray.slice(i, i + chunkSize);
        const groupsSnapshot = await db.collection('groups')
          .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
          .get();
        
        groupsSnapshot.forEach(doc => {
          const groupData = doc.data();
          groupMap[doc.id] = {
            _id: doc.id,
            name: groupData.name
          };
        });
      }
    }
    
    // Reemplazar IDs con datos completos
    tasks.forEach(task => {
      // Reemplazar userId con datos de usuario
      if (task.userId && userMap[task.userId]) {
        task.userId = userMap[task.userId];
      }
      
      // Reemplazar groupId con datos de grupo
      if (task.groupId && groupMap[task.groupId]) {
        task.groupId = groupMap[task.groupId];
      }
      
      // Reemplazar assignedTo con datos de usuarios
      if (task.assignedTo && Array.isArray(task.assignedTo)) {
        task.assignedTo = task.assignedTo.map(userId => userMap[userId] || userId);
      }
    });
    
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error al obtener todas las tareas:", error);
    res.status(500).json({ message: 'Error al obtener todas las tareas.', error: error.message });
  }
});

// Actualizar tarea
app.put('/api/tasks/:taskId', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;
    
    // Verificar que la tarea existe
    const taskDoc = await db.collection('tasks').doc(taskId).get();
    
    if (!taskDoc.exists) {
      return res.status(404).json({ message: 'Tarea no encontrada.' });
    }
    
    const taskData = taskDoc.data();
    
    // Verificar permisos
    const isCreator = taskData.userId === req.userId;
    const isAssigned = taskData.assignedTo && taskData.assignedTo.includes(req.userId);
    
    // Verificar si es admin
    const userDoc = await db.collection('users').doc(req.userId).get();
    const isAdmin = userDoc.exists && userDoc.data().role === 'admin';
    
    if (!isCreator && !isAssigned && !isAdmin) {
      return res.status(403).json({ message: 'No tienes permiso para actualizar esta tarea.' });
    }
    
    // Si solo es asignado, solo puede actualizar el estado
    if (!isAdmin && !isCreator && isAssigned) {
      if (Object.keys(updates).length > 1 || !updates.hasOwnProperty('status')) {
        return res.status(403).json({ message: 'Solo puedes actualizar el estado de esta tarea.' });
      }
    }
    
    // Campos permitidos para actualizar
    const allowedUpdates = ['name_task', 'description', 'dead_line', 'status', 'category', 'assignedTo'];
    const updateData = {};
    
    for (const field of allowedUpdates) {
      if (updates[field] !== undefined) {
        // Convertir la fecha si es necesario
        if (field === 'dead_line' && updates[field]) {
          updateData[field] = new Date(updates[field]);
        } else {
          updateData[field] = updates[field];
        }
      }
    }
    
    // Actualizar la tarea
    await db.collection('tasks').doc(taskId).update(updateData);
    
    // Obtener la tarea actualizada
    const updatedTaskDoc = await db.collection('tasks').doc(taskId).get();
    const updatedTaskData = updatedTaskDoc.data();
    
    // Obtener información de usuarios asignados
    let assignedUsers = [];
    if (updatedTaskData.assignedTo && updatedTaskData.assignedTo.length > 0) {
      const usersSnapshot = await db.collection('users')
        .where(admin.firestore.FieldPath.documentId(), 'in', updatedTaskData.assignedTo)
        .get();
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        assignedUsers.push({
          _id: doc.id,
          username: userData.username,
          email: userData.email
        });
      });
    }
    
    res.status(200).json({ 
      message: 'Tarea actualizada correctamente.',
      task: {
        _id: taskId,
        ...updatedTaskData,
        dead_line: updatedTaskData.dead_line.toDate(),
        createdAt: updatedTaskData.createdAt?.toDate() || null,
        assignedTo: assignedUsers
      }
    });
  
} catch (error) {
  console.error("Error al actualizar tarea:", error);
  res.status(500).json({ message: 'Error al actualizar la tarea.', error: error.message });
}
});

// Eliminar tarea
app.delete('/api/tasks/:taskId', authenticate, async (req, res) => {
try {
  // Verificar que la tarea existe
  const taskDoc = await db.collection('tasks').doc(req.params.taskId).get();
  
  if (!taskDoc.exists) {
    return res.status(404).json({ message: 'Tarea no encontrada.' });
  }
  
  const taskData = taskDoc.data();
  
  // Verificar permisos
  const isCreator = taskData.userId === req.userId;
  
  // Verificar si es admin
  const userDoc = await db.collection('users').doc(req.userId).get();
  const isAdmin = userDoc.exists && userDoc.data().role === 'admin';
  
  if (!isCreator && !isAdmin) {
    return res.status(403).json({ message: 'No tienes permiso para eliminar esta tarea.' });
  }
  
  // Eliminar la tarea
  await db.collection('tasks').doc(req.params.taskId).delete();
  
  res.status(200).json({ message: 'Tarea eliminada con éxito.' });
} catch (error) {
  console.error("Error al eliminar tarea:", error);
  res.status(500).json({ message: 'Error al eliminar la tarea.', error: error.message });
}
});

// RUTAS DE GRUPOS
// =======================================

// Crear grupo
app.post('/api/groups', authenticate, async (req, res) => {
try {
  const { name, user } = req.body;
  
  if (!name) {
    return res.status(400).json({ message: 'El nombre del grupo es requerido' });
  }

  // Validar que el array de usuarios sea válido
  let usersToAdd = [];
  if (user && Array.isArray(user)) {
    usersToAdd = user;
  }

  const newGroup = {
    name,
    ownerId: req.userId,
    user: usersToAdd,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  // Crear el grupo
  const groupRef = await db.collection('groups').add(newGroup);
  
  console.log(`Grupo creado: ${name} con ${usersToAdd.length} usuarios`);
  
  res.status(201).json({ 
    message: 'Grupo creado con éxito.',
    group: {
      _id: groupRef.id,
      ...newGroup,
      createdAt: null // La marca de tiempo del servidor aún no está disponible
    }
  });
} catch (error) {
  console.error("Error al crear grupo:", error);
  res.status(500).json({ message: 'Error al crear el grupo.', error: error.message });
}
});

// Obtener grupos de un usuario
app.get('/api/groups/:userId', authenticate, async (req, res) => {
try {
  console.log("Token decodificado userId:", req.userId);
  console.log("Params userId:", req.params.userId);
  
  // Verificar que el usuario solicita sus propios grupos
  if (req.userId !== req.params.userId) {
    console.log("Los IDs no coinciden");
    return res.status(403).json({ 
      message: 'No autorizado para ver estos grupos.',
      details: {
        requestUserId: req.userId,
        paramUserId: req.params.userId
      }
    });
  }
  
  // Buscar grupos donde el usuario es propietario o miembro
  const groupsOwnerSnapshot = await db.collection('groups').where('ownerId', '==', req.params.userId).get();
  const groupsMemberSnapshot = await db.collection('groups').where('user', 'array-contains', req.params.userId).get();
  
  const groups = [];
  const processedGroupIds = new Set();
  
  // Procesar grupos donde el usuario es propietario
  groupsOwnerSnapshot.forEach(doc => {
    const groupData = doc.data();
    processedGroupIds.add(doc.id);
    
    groups.push({
      _id: doc.id,
      ...groupData,
      createdAt: groupData.createdAt?.toDate() || null
    });
  });
  
  // Procesar grupos donde el usuario es miembro (evitando duplicados)
  groupsMemberSnapshot.forEach(doc => {
    if (!processedGroupIds.has(doc.id)) {
      const groupData = doc.data();
      groups.push({
        _id: doc.id,
        ...groupData,
        createdAt: groupData.createdAt?.toDate() || null
      });
    }
  });
  
  // Obtener información de usuarios de cada grupo
  const userIds = new Set();
  groups.forEach(group => {
    if (group.user && Array.isArray(group.user)) {
      group.user.forEach(userId => userIds.add(userId));
    }
  });
  
  // Solo buscar usuarios si hay IDs para buscar
  let userMap = {};
  if (userIds.size > 0) {
    const userIdsArray = Array.from(userIds);
    // Dividir en chunks para respetar límite de Firestore
    const chunkSize = 10;
    for (let i = 0; i < userIdsArray.length; i += chunkSize) {
      const chunk = userIdsArray.slice(i, i + chunkSize);
      const usersSnapshot = await db.collection('users')
        .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
        .get();
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        userMap[doc.id] = {
          _id: doc.id,
          username: userData.username,
          email: userData.email
        };
      });
    }
  }
  
  // Reemplazar IDs de usuarios con sus datos
  groups.forEach(group => {
    if (group.user && Array.isArray(group.user)) {
      group.user = group.user.map(userId => userMap[userId] || userId);
    }
  });
  
  console.log(`Encontrados ${groups.length} grupos para el usuario ${req.params.userId}`);
  res.status(200).json(groups);
} catch (error) {
  console.error("Error al obtener grupos:", error);
  res.status(500).json({ message: 'Error al obtener los grupos.', error: error.message });
}
});

// Obtener todos los grupos (solo admin)
app.get('/api/groups', authenticate, async (req, res) => {
try {
  // Verificar si el usuario es administrador
  const adminDoc = await db.collection('users').doc(req.userId).get();
  
  if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
    return res.status(403).json({ message: 'No autorizado para esta acción.' });
  }
  
  // Obtener todos los grupos
  const groupsSnapshot = await db.collection('groups').get();
  const groups = [];
  
  // Recopilar todos los IDs de usuario
  const userIds = new Set();
  
  groupsSnapshot.forEach(doc => {
    const groupData = doc.data();
    
    // Recopilar IDs de usuario
    if (groupData.ownerId) userIds.add(groupData.ownerId);
    if (groupData.user && Array.isArray(groupData.user)) {
      groupData.user.forEach(id => userIds.add(id));
    }
    
    groups.push({
      _id: doc.id,
      ...groupData,
      createdAt: groupData.createdAt?.toDate() || null
    });
  });
  
  // Obtener información de usuarios
  let userMap = {};
  if (userIds.size > 0) {
    const userIdsArray = Array.from(userIds);
    // Dividir en chunks para respetar límite de Firestore
    const chunkSize = 10;
    for (let i = 0; i < userIdsArray.length; i += chunkSize) {
      const chunk = userIdsArray.slice(i, i + chunkSize);
      const usersSnapshot = await db.collection('users')
        .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
        .get();
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        userMap[doc.id] = {
          _id: doc.id,
          username: userData.username,
          email: userData.email
        };
      });
    }
  }
  
  // Reemplazar IDs con datos completos
  groups.forEach(group => {
    // Reemplazar ownerId con datos de usuario
    if (group.ownerId && userMap[group.ownerId]) {
      group.ownerId = userMap[group.ownerId];
    }
    
    // Reemplazar user con datos de usuarios
    if (group.user && Array.isArray(group.user)) {
      group.user = group.user.map(userId => userMap[userId] || userId);
    }
  });
  
  res.status(200).json(groups);
} catch (error) {
  console.error("Error al obtener todos los grupos:", error);
  res.status(500).json({ message: 'Error al obtener todos los grupos.', error: error.message });
}
});

// Actualizar grupo
app.put('/api/groups/:groupId', authenticate, async (req, res) => {
try {
  // Verificar que el grupo existe
  const groupDoc = await db.collection('groups').doc(req.params.groupId).get();
  
  if (!groupDoc.exists) {
    return res.status(404).json({ message: 'Grupo no encontrado.' });
  }
  
  const groupData = groupDoc.data();
  
  // Verificar permisos
  const isOwner = groupData.ownerId === req.userId;
  
  // Verificar si es admin
  const userDoc = await db.collection('users').doc(req.userId).get();
  const isAdmin = userDoc.exists && userDoc.data().role === 'admin';
  
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: 'No tienes permiso para actualizar este grupo.' });
  }
  
  const { name, user } = req.body;
  const updateData = {};
  
  if (name) updateData.name = name;
  if (user && Array.isArray(user)) updateData.user = user;
  
  // Actualizar el grupo
  await db.collection('groups').doc(req.params.groupId).update(updateData);
  
  // Obtener el grupo actualizado
  const updatedGroupDoc = await db.collection('groups').doc(req.params.groupId).get();
  const updatedGroupData = updatedGroupDoc.data();
  
  // Obtener información de usuarios del grupo
  let usersInfo = [];
  if (updatedGroupData.user && updatedGroupData.user.length > 0) {
    const usersSnapshot = await db.collection('users')
      .where(admin.firestore.FieldPath.documentId(), 'in', updatedGroupData.user)
      .get();
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      usersInfo.push({
        _id: doc.id,
        username: userData.username,
        email: userData.email
      });
    });
  }
  
  res.status(200).json({
    message: 'Grupo actualizado con éxito.',
    group: {
      _id: req.params.groupId,
      ...updatedGroupData,
      createdAt: updatedGroupData.createdAt?.toDate() || null,
      user: usersInfo
    }
  });
} catch (error) {
  console.error("Error al actualizar grupo:", error);
  res.status(500).json({ message: 'Error al actualizar el grupo.', error: error.message });
}
});

// Agregar usuario a un grupo
app.post('/api/groups/:groupId/users', authenticate, async (req, res) => {
try {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ message: 'El ID de usuario es requerido.' });
  }
  
  // Verificar que el grupo existe
  const groupDoc = await db.collection('groups').doc(req.params.groupId).get();
  
  if (!groupDoc.exists) {
    return res.status(404).json({ message: 'Grupo no encontrado.' });
  }
  
  const groupData = groupDoc.data();
  
  // Verificar permisos
  const isOwner = groupData.ownerId === req.userId;
  
  // Verificar si es admin
  const userDoc = await db.collection('users').doc(req.userId).get();
  const isAdmin = userDoc.exists && userDoc.data().role === 'admin';
  
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: 'No tienes permiso para agregar usuarios a este grupo.' });
  }
  
  // Verificar si el usuario ya está en el grupo
  if (groupData.user && groupData.user.includes(userId)) {
    return res.status(400).json({ message: 'El usuario ya está en el grupo.' });
  }
  
  // Añadir el usuario al grupo
  const updatedUsers = groupData.user || [];
  updatedUsers.push(userId);
  
  await db.collection('groups').doc(req.params.groupId).update({ 
    user: updatedUsers
  });
  
  // Obtener el grupo actualizado
  const updatedGroupDoc = await db.collection('groups').doc(req.params.groupId).get();
  const updatedGroupData = updatedGroupDoc.data();
  
  // Obtener información de usuarios del grupo
  let usersInfo = [];
  if (updatedGroupData.user && updatedGroupData.user.length > 0) {
    const usersSnapshot = await db.collection('users')
      .where(admin.firestore.FieldPath.documentId(), 'in', updatedGroupData.user)
      .get();
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      usersInfo.push({
        _id: doc.id,
        username: userData.username,
        email: userData.email
      });
    });
  }
  
  res.status(200).json({
    message: 'Usuario agregado al grupo con éxito.',
    group: {
      _id: req.params.groupId,
      ...updatedGroupData,
      createdAt: updatedGroupData.createdAt?.toDate() || null,
      user: usersInfo
    }
  });
} catch (error) {
  console.error("Error al agregar usuario al grupo:", error);
  res.status(500).json({ message: 'Error al agregar usuario al grupo.', error: error.message });
}
});

// Eliminar usuario de un grupo
app.delete('/api/groups/:groupId/users/:userId', authenticate, async (req, res) => {
try {
  // Verificar que el grupo existe
  const groupDoc = await db.collection('groups').doc(req.params.groupId).get();
  
  if (!groupDoc.exists) {
    return res.status(404).json({ message: 'Grupo no encontrado.' });
  }
  
  const groupData = groupDoc.data();
  
  // Verificar permisos
  const isOwner = groupData.ownerId === req.userId;
  
  // Verificar si es admin
  const userDoc = await db.collection('users').doc(req.userId).get();
  const isAdmin = userDoc.exists && userDoc.data().role === 'admin';
  
  // El propio usuario puede salir del grupo
  const isSelfRemoval = req.params.userId === req.userId;
  
  if (!isOwner && !isAdmin && !isSelfRemoval) {
    return res.status(403).json({ message: 'No tienes permiso para eliminar usuarios de este grupo.' });
  }
  
  // Verificar si el usuario está en el grupo
  if (!groupData.user || !groupData.user.includes(req.params.userId)) {
    return res.status(400).json({ message: 'El usuario no está en el grupo.' });
  }
  
  // Eliminar el usuario del grupo
  const updatedUsers = groupData.user.filter(id => id !== req.params.userId);
  
  await db.collection('groups').doc(req.params.groupId).update({ 
    user: updatedUsers
  });
  
  // Obtener el grupo actualizado
  const updatedGroupDoc = await db.collection('groups').doc(req.params.groupId).get();
  const updatedGroupData = updatedGroupDoc.data();
  
  // Obtener información de usuarios del grupo
  let usersInfo = [];
  if (updatedGroupData.user && updatedGroupData.user.length > 0) {
    const usersSnapshot = await db.collection('users')
      .where(admin.firestore.FieldPath.documentId(), 'in', updatedGroupData.user)
      .get();
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      usersInfo.push({
        _id: doc.id,
        username: userData.username,
        email: userData.email
      });
    });
  }
  
  res.status(200).json({
    message: 'Usuario eliminado del grupo con éxito.',
    group: {
      _id: req.params.groupId,
      ...updatedGroupData,
      createdAt: updatedGroupData.createdAt?.toDate() || null,
      user: usersInfo
    }
  });
} catch (error) {
  console.error("Error al eliminar usuario del grupo:", error);
  res.status(500).json({ message: 'Error al eliminar usuario del grupo.', error: error.message });
}
});

// Eliminar grupo
app.delete('/api/groups/:groupId', authenticate, async (req, res) => {
try {
  // Verificar que el grupo existe
  const groupDoc = await db.collection('groups').doc(req.params.groupId).get();
  
  if (!groupDoc.exists) {
    return res.status(404).json({ message: 'Grupo no encontrado.' });
  }
  
  const groupData = groupDoc.data();
  
  // Verificar permisos
  const isOwner = groupData.ownerId === req.userId;
  
  // Verificar si es admin
  const userDoc = await db.collection('users').doc(req.userId).get();
  const isAdmin = userDoc.exists && userDoc.data().role === 'admin';
  
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: 'No tienes permiso para eliminar este grupo.' });
  }
  
  // Primero eliminar todas las tareas asociadas al grupo
  const tasksSnapshot = await db.collection('tasks').where('groupId', '==', req.params.groupId).get();
  
  // Usar un batch para eliminar todas las tareas de manera eficiente
  const batch = db.batch();
  
  tasksSnapshot.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  // Eliminar el grupo
  batch.delete(db.collection('groups').doc(req.params.groupId));
  
  // Ejecutar todas las operaciones en batch
  await batch.commit();
  
  res.status(200).json({ message: 'Grupo eliminado con éxito.' });
} catch (error) {
  console.error("Error al eliminar grupo:", error);
  res.status(500).json({ message: 'Error al eliminar el grupo.', error: error.message });
}
});

module.exports = app;

// Start server only in non-Vercel environments
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}