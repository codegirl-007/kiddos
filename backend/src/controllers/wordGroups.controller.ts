import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { db } from '../config/database.js';

export async function getAllWordGroups(req: AuthRequest, res: Response) {
  try {
    const groups = await db.execute(`
      SELECT wg.*, COUNT(w.id) as word_count
      FROM word_groups wg
      LEFT JOIN words w ON wg.id = w.word_group_id
      GROUP BY wg.id
      ORDER BY wg.created_at DESC
    `);
    
    const groupsWithWords = await Promise.all(
      groups.rows.map(async (group) => {
        const words = await db.execute({
          sql: 'SELECT id, word FROM words WHERE word_group_id = ? ORDER BY word',
          args: [group.id]
        });
        
        return {
          id: group.id,
          name: group.name,
          wordCount: group.word_count,
          words: words.rows.map(w => ({
            id: w.id,
            word: w.word
          })),
          createdAt: group.created_at,
          updatedAt: group.updated_at
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        groups: groupsWithWords
      },
      meta: {
        total: groupsWithWords.length
      }
    });
  } catch (error: any) {
    console.error('Get word groups error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_WORD_GROUPS_ERROR',
        message: 'Error fetching word groups'
      }
    });
  }
}

export async function createWordGroup(req: AuthRequest, res: Response) {
  try {
    const { name } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_NAME',
          message: 'Group name is required'
        }
      });
    }
    
    const result = await db.execute({
      sql: `INSERT INTO word_groups (name, updated_at)
            VALUES (?, ?)`,
      args: [name.trim(), new Date().toISOString()]
    });
    
    const groupId = Number(result.lastInsertRowid);
    
    res.status(201).json({
      success: true,
      data: {
        group: {
          id: groupId,
          name: name.trim(),
          wordCount: 0,
          words: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    });
  } catch (error: any) {
    console.error('Create word group error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_WORD_GROUP_ERROR',
        message: 'Error creating word group'
      }
    });
  }
}

export async function updateWordGroup(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_NAME',
          message: 'Group name is required'
        }
      });
    }
    
    await db.execute({
      sql: `UPDATE word_groups 
            SET name = ?, updated_at = ?
            WHERE id = ?`,
      args: [name.trim(), new Date().toISOString(), id]
    });
    
    res.json({
      success: true,
      data: {
        message: 'Word group updated successfully'
      }
    });
  } catch (error: any) {
    console.error('Update word group error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_WORD_GROUP_ERROR',
        message: 'Error updating word group'
      }
    });
  }
}

export async function deleteWordGroup(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    
    await db.execute({
      sql: 'DELETE FROM word_groups WHERE id = ?',
      args: [id]
    });
    
    res.json({
      success: true,
      data: {
        message: 'Word group deleted successfully'
      }
    });
  } catch (error: any) {
    console.error('Delete word group error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_WORD_GROUP_ERROR',
        message: 'Error deleting word group'
      }
    });
  }
}

export async function addWord(req: AuthRequest, res: Response) {
  try {
    // Try both possible parameter names (groupId from route, id if wrong route matched)
    const groupId = req.params.groupId || req.params.id;
    const { word } = req.body;
    
    if (!groupId) {
      console.error('addWord - Missing groupId. req.params:', req.params, 'req.url:', req.url);
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_GROUP_ID',
          message: 'Group ID is required'
        }
      });
    }
    
    if (!word || typeof word !== 'string' || word.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_WORD',
          message: 'Word is required'
        }
      });
    }
    
    // Check if group exists
    const groupCheck = await db.execute({
      sql: 'SELECT id FROM word_groups WHERE id = ?',
      args: [parseInt(groupId, 10)]
    });
    
    if (groupCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'GROUP_NOT_FOUND',
          message: 'Word group not found'
        }
      });
    }
    
    const result = await db.execute({
      sql: 'INSERT INTO words (word_group_id, word) VALUES (?, ?)',
      args: [parseInt(groupId, 10), word.trim()]
    });
    
    res.status(201).json({
      success: true,
      data: {
        word: {
          id: Number(result.lastInsertRowid),
          word: word.trim(),
          wordGroupId: parseInt(groupId, 10)
        }
      }
    });
  } catch (error: any) {
    console.error('Add word error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ADD_WORD_ERROR',
        message: 'Error adding word'
      }
    });
  }
}

export async function deleteWord(req: AuthRequest, res: Response) {
  try {
    const id = req.params.wordId || req.params.id;
    
    await db.execute({
      sql: 'DELETE FROM words WHERE id = ?',
      args: [id]
    });
    
    res.json({
      success: true,
      data: {
        message: 'Word deleted successfully'
      }
    });
  } catch (error: any) {
    console.error('Delete word error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_WORD_ERROR',
        message: 'Error deleting word'
      }
    });
  }
}
