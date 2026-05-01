import Groq from 'groq-sdk';
import { success, error } from '../utils/response.js';
import prisma from '../lib/prisma.js';

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

if (!groq) {
  console.warn('GROQ_API_KEY is not defined in .env. AI features will be disabled.');
}

export const generateTasks = async (req, res) => {
  try {
    if (!groq) return error(res, 'AI Service is not configured', 503);
    const { prompt, projectId } = req.body;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true, description: true }
    });

    if (!project) return error(res, 'Project not found', 404);

    const systemPrompt = `You are a senior software project manager.
    The user is working on a project named: "${project.name}".
    Project description: "${project.description || 'No description provided'}".
    
    Break down the user's feature request or goal into structured tasks and subtasks.
    ALWAYS respond with valid JSON matching this exact structure:
    {
      "title": "Main Task Title",
      "type": "EPIC",
      "priority": "LOW|MEDIUM|HIGH|URGENT",
      "description": "Short overview of the task",
      "subtasks": [
        { "title": "Subtask title", "type": "TASK|BUG|STORY", "priority": "LOW|MEDIUM|HIGH|URGENT" }
      ]
    }
    
    Make subtasks realistic, actionable, and sized for developer work.
    If the prompt is vague, make reasonable assumptions based on industry standards.`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return success(res, { generated: result });
  } catch (err) {
    console.error('AI generate tasks error:', err);
    return error(res, 'Failed to generate tasks with AI', 500);
  }
};

export const chat = async (req, res) => {
  try {
    if (!groq) return error(res, 'AI Service is not configured', 503);
    const { message, history, projectId } = req.body;
    console.log('AI Chat Request:', { message, projectId, historyLength: history?.length });

    if (!projectId) return error(res, 'Project ID is required', 400);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: { include: { assignee: { select: { name: true } } } },
        members: { include: { user: { select: { name: true } } } },
        columns: true
      }
    });

    if (!project) {
      console.log('Project not found for AI chat:', projectId);
      return error(res, 'Project not found', 404);
    }

    const overdueTasks = project.tasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE'
    );

    const systemPrompt = `You are a smart AI project manager assistant for the project "${project.name}".
    
    IMPORTANT: You CANNOT create, edit, or delete tasks directly. 
    If a user asks you to "create a task" or "add something to the board", you MUST:
    1. Provide a suggested breakdown of the task in your message.
    2. Explicitly tell the user: "Please use the ✨ 'AI Generate' button in the top header to actually add these tasks to your board."
    
    CURRENT PROJECT SNAPSHOT:
    - Total tasks: ${project.tasks.length}
    - Overdue tasks: ${overdueTasks.length} (${overdueTasks.slice(0, 5).map(t => t.title).join(', ')}${overdueTasks.length > 5 ? '...' : ''})
    - Team members: ${project.members.map(m => m.user.name).join(', ')}
    - Board columns: ${project.columns.map(c => c.name).join(' -> ')}
    
    TASK STATUS BREAKDOWN:
    ${project.columns.map(c => 
      `${c.name}: ${project.tasks.filter(t => t.status === c.name).length} tasks`
    ).join('\n')}
    
    Be concise, helpful, and professional. You have access to real-time project data.`;

    console.log('Calling Groq with model: llama-3.1-8b-instant');
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...(history || []).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: message }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 1024
    });

    return success(res, { response: completion.choices[0].message.content });
  } catch (err) {
    console.error('AI chat error details:', err.message, err.stack);
    return error(res, `AI assistant error: ${err.message}`, 500);
  }
};

export const suggestPriority = async (req, res) => {
  try {
    if (!groq) return success(res, { type: 'TASK', priority: 'MEDIUM' });
    const { title } = req.body;
    if (!title || title.length < 5) return success(res, { type: 'TASK', priority: 'MEDIUM' });

    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: 'Predict task type (TASK, BUG, STORY, EPIC) and priority (LOW, MEDIUM, HIGH, URGENT) based on the title. Respond ONLY with JSON: {"type": "...", "priority": "..."}' 
        },
        { role: 'user', content: title }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return success(res, result);
  } catch (err) {
    return success(res, { type: 'TASK', priority: 'MEDIUM' }); // Silent fallback
  }
};

export const analyzeProject = async (req, res) => {
  try {
    if (!groq) return error(res, 'AI Service is not configured', 503);
    const { projectId } = req.body;
    
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: { include: { assignee: true } },
        members: true,
        columns: true
      }
    });

    if (!project) return error(res, 'Project not found', 404);

    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: 'You are a project auditor. Analyze the project data and provide 3-4 concise, high-impact bullet points about health, risks, and productivity. Respond ONLY with JSON: {"health": "GOOD|AT_RISK|CRITICAL", "insights": ["...", "..."]}' 
        },
        { role: 'user', content: JSON.stringify(project) }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return success(res, result);
  } catch (err) {
    console.error('Analyze project error:', err);
    return error(res, 'Analysis failed', 500);
  }
};
