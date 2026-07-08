import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserGamification } from "@/lib/memory/memoryService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    console.log('?? API called for user:', userId?.substring(0, 10) + '...');
    
    // Use the named export directly
    const data = await getUserGamification(userId);
    
    // Return success
    return res.status(200).json(data);
    
  } catch (error: any) {
    console.error('? API error:', error);
    
    // Return fallback data
    return res.status(200).json({
      level: 2,
      points: 200,
      achievements: ["Error occurred"],
      streak: { current: 1, longest: 1, lastActivity: new Date().toISOString() },
      nextMilestone: "Fix server error",
      totalInterviews: 0,
      success: false,
      error: error.message
    });
  }
}
