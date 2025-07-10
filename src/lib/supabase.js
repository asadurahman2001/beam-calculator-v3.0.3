import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ocyajssmyaywmyxqggzm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jeWFqc3NteWF5d215eHFnZ3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNjQ1MDcsImV4cCI6MjA2Nzc0MDUwN30.K-nAjhhZrOiXKfxHaux19lb1PxkvX9Zm76eoqmTMpgU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helper functions
export const signUp = async (email, password, fullName) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      }
    }
  })
  return { data, error }
}

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const resetPassword = async (email) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email)
  return { data, error }
}

// Project management functions
export const saveProject = async (projectData, userId) => {
  const { data, error } = await supabase
    .from('projects')
    .insert([
      {
        user_id: userId,
        name: projectData.name,
        description: projectData.description,
        beam_data: projectData.beamData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ])
    .select()
  
  return { data, error }
}

export const updateProject = async (projectId, projectData) => {
  const { data, error } = await supabase
    .from('projects')
    .update({
      name: projectData.name,
      description: projectData.description,
      beam_data: projectData.beamData,
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)
    .select()
  
  return { data, error }
}

export const getUserProjects = async (userId) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  
  return { data, error }
}

export const deleteProject = async (projectId) => {
  const { data, error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
  
  return { data, error }
}

export const getProject = async (projectId) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()
  
  return { data, error }
}