const pool = require('../db/db')

function formatCircle(row) {
  if (!row) return null

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    coverUrl: row.cover_url,
    creatorId: row.creator_id,
    isPublic: Boolean(row.is_public),
    status: row.status,
    memberCount: Number(row.member_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function findCircleById(circleId) {
  const [rows] = await pool.query(
    `
    SELECT
      c.*,
      COUNT(cm.id) AS member_count
    FROM circles c
    LEFT JOIN circle_members cm ON cm.circle_id = c.id
    WHERE c.id = ?
    GROUP BY c.id
    LIMIT 1
    `,
    [circleId]
  )

  return formatCircle(rows[0])
}

async function listHotCircles(limit = 6) {
  const [rows] = await pool.query(
    `
    SELECT
      c.*,
      COUNT(cm.id) AS member_count
    FROM circles c
    LEFT JOIN circle_members cm ON cm.circle_id = c.id
    WHERE c.status = 'active'
    GROUP BY c.id
    ORDER BY member_count DESC, c.created_at DESC
    LIMIT ?
    `,
    [limit]
  )

  return rows.map(formatCircle)
}

async function listMyCircles(userId) {
  const [rows] = await pool.query(
    `
    SELECT
      c.*,
      COUNT(all_members.id) AS member_count
    FROM circle_members mine
    JOIN circles c ON c.id = mine.circle_id
    LEFT JOIN circle_members all_members ON all_members.circle_id = c.id
    WHERE mine.user_id = ?
      AND c.status = 'active'
    GROUP BY c.id
    ORDER BY mine.joined_at DESC
    `,
    [userId]
  )

  return rows.map(formatCircle)
}

async function isUserInCircle(circleId, userId) {
  const [rows] = await pool.query(
    `
    SELECT id
    FROM circle_members
    WHERE circle_id = ? AND user_id = ?
    LIMIT 1
    `,
    [circleId, userId]
  )

  return rows.length > 0
}

async function addCircleMember(circleId, userId, role = 'member') {
  await pool.query(
    `
    INSERT INTO circle_members (circle_id, user_id, role)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE role = role
    `,
    [circleId, userId, role]
  )

  return findCircleById(circleId)
}

module.exports = {
  findCircleById,
  listHotCircles,
  listMyCircles,
  isUserInCircle,
  addCircleMember,
}