import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './App.css'; // Import the updated CSS file

// Initialize Supabase client
const supabaseUrl = 'your supabase url'; // Replace with your Supabase URL
const supabaseAnonKey = 'your AnonKey'; // Replace with your Supabase anon key

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [editingTodoId, setEditingTodoId] = useState(null);
  const [editingTodoTitle, setEditingTodoTitle] = useState('');

  // Authentication state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Listen for authentication state changes
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && session.user) {
        setUser(session.user);
        fetchTodos();
      } else {
        setUser(null);
        setTodos([]);
      }
    });

    // Check for existing session
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) console.error(error);
      if (session?.user) {
        setUser(session.user);
        fetchTodos();
      }
    };
    checkSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Fetch todos from Supabase
  const fetchTodos = async () => {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching todos:', error.message);
    else setTodos(data);
  };

  // Handle sign in
  const handleSignIn = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) alert(error.message);
  };

  // Handle sign out
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) alert(error.message);
  };

  // Add a new todo
  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (newTodoTitle.trim() === '') return;
    const { error } = await supabase
      .from('todos')
      .insert([{ title: newTodoTitle, user_id: user.id }]);
    if (error) console.error('Error adding todo:', error.message);
    else {
      setNewTodoTitle('');
      fetchTodos();
    }
  };

  // Edit a todo
  const handleEditTodo = (id, title) => {
    setEditingTodoId(id);
    setEditingTodoTitle(title);
  };

  // Update a todo
  const handleUpdateTodo = async (e) => {
    e.preventDefault();
    if (editingTodoTitle.trim() === '') return;
    const { error } = await supabase
      .from('todos')
      .update({ title: editingTodoTitle })
      .eq('id', editingTodoId);
    if (error) console.error('Error updating todo:', error.message);
    else {
      setEditingTodoId(null);
      setEditingTodoTitle('');
      fetchTodos();
    }
  };

  // Delete a todo
  const handleDeleteTodo = async (id) => {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);
    if (error) console.error('Error deleting todo:', error.message);
    else fetchTodos();
  };

  return (
    <div className="app-container">
      <h1>📝 Vultr's To do app</h1>
      {user ? (
        <div>
          <div className="header">
            <p>Welcome, {user.email}</p>
            <button className="sign-out-button" onClick={handleSignOut}>Sign Out</button>
          </div>

          <form onSubmit={handleAddTodo} className="todo-form">
            <input
              type="text"
              placeholder="What needs to be done?"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
            />
            <button type="submit">Add</button>
          </form>

          <ul className="todo-list">
            {todos.map((todo) => (
              <li key={todo.id}>
                {editingTodoId === todo.id ? (
                  <form onSubmit={handleUpdateTodo} className="edit-form">
                    <input
                      type="text"
                      value={editingTodoTitle}
                      onChange={(e) => setEditingTodoTitle(e.target.value)}
                    />
                    <button type="submit">Save</button>
                    <button type="button" onClick={() => setEditingTodoId(null)}>Cancel</button>
                  </form>
                ) : (
                  <div className="todo-item">
                    <span>{todo.title}</span>
                    <div className="todo-actions">
                      <button onClick={() => handleEditTodo(todo.id, todo.title)}>✏️</button>
                      <button onClick={() => handleDeleteTodo(todo.id)}>🗑️</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="auth-container">
          <form onSubmit={handleSignIn} className="auth-form">
            <h2>Sign In</h2>
            <input
              type="email"
              placeholder="Email"
              value={email}
              autoComplete="username"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Sign In</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
