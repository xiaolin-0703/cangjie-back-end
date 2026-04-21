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

function formatPost(row) {
  if (!row) return null

  return {
    id: row.id,
    circleId: row.circle_id,
    userId: row.user_id,
    title: row.title,
    content: row.content,
    nickname: row.nickname || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function listCirclePosts(circleId, limit = 20) {
  const [rows] = await pool.query(
    `
    SELECT
      p.id,
      p.circle_id,
      p.user_id,
      p.title,
      p.content,
      p.created_at,
      p.updated_at,
      u.nickname
    FROM posts p
    LEFT JOIN users u ON u.id = p.user_id
    WHERE p.circle_id = ? AND p.status = 'active'
    ORDER BY p.created_at DESC
    LIMIT ?
    `,
    [circleId, limit]
  )

  return rows.map(formatPost)
}

async function findPostById(postId) {
  const [rows] = await pool.query(
    `
    SELECT
      p.id,
      p.circle_id,
      p.user_id,
      p.title,
      p.content,
      p.created_at,
      p.updated_at,
      u.nickname
    FROM posts p
    LEFT JOIN users u ON u.id = p.user_id
    WHERE p.id = ? AND p.status = 'active'
    LIMIT 1
    `,
    [postId]
  )

  return formatPost(rows[0])
}

async function createPost(data) {
  const [result] = await pool.query(
    `
    INSERT INTO posts (circle_id, user_id, title, content, status)
    VALUES (?, ?, ?, ?, 'active')
    `,
    [data.circleId, data.userId, data.title, data.content]
  )

  return result.insertId
}

async function listHotCircles(limit = 3) {
  const [rows] = await pool.query(
    `
    SELECT
      c.id,
      c.name,
      c.description,
      c.cover_url,
      c.creator_id,
      c.is_public,
      c.status,
      c.created_at,
      c.updated_at,
      COUNT(cm.id) AS member_count
    FROM circles c
    LEFT JOIN circle_members cm
      ON cm.circle_id = c.id
    WHERE c.status = 'active'
    GROUP BY
      c.id, c.name, c.description, c.cover_url,
      c.creator_id, c.is_public, c.status,
      c.created_at, c.updated_at
    ORDER BY member_count DESC, c.created_at DESC
    LIMIT ?
    `,
    [limit]
  )

  return rows.map(formatCircle)
}

async function listCircles(limit = 20) {
  const [rows] = await pool.query(
    `
    SELECT
      c.id,
      c.name,
      c.description,
      c.cover_url,
      c.creator_id,
      c.is_public,
      c.status,
      c.created_at,
      c.updated_at,
      COUNT(cm.id) AS member_count
    FROM circles c
    LEFT JOIN circle_members cm
      ON cm.circle_id = c.id
    WHERE c.status = 'active'
    GROUP BY
      c.id, c.name, c.description, c.cover_url,
      c.creator_id, c.is_public, c.status,
      c.created_at, c.updated_at
    ORDER BY member_count DESC, c.created_at DESC
    LIMIT ?
    `,
    [limit]
  )

  return rows.map(formatCircle)
}

async function findCircleById(circleId) {
  const [rows] = await pool.query(
    `
    SELECT
      c.id,
      c.name,
      c.description,
      c.cover_url,
      c.creator_id,
      c.is_public,
      c.status,
      c.created_at,
      c.updated_at,
      COUNT(cm.id) AS member_count
    FROM circles c
    LEFT JOIN circle_members cm
      ON cm.circle_id = c.id
    WHERE c.id = ?
    GROUP BY
      c.id, c.name, c.description, c.cover_url,
      c.creator_id, c.is_public, c.status,
      c.created_at, c.updated_at
    LIMIT 1
    `,
    [circleId]
  )

  return formatCircle(rows[0])
}

async function hasJoinedCircle(circleId, userId) {
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

async function createCircle(data) {
  const [result] = await pool.query(
    `
    INSERT INTO circles (name, description, creator_id, is_public, status)
    VALUES (?, ?, ?, ?, 'active')
    `,
    [
      data.name,
      data.description || null,
      data.creatorId,
      data.isPublic ? 1 : 0,
    ]
  )

  return result.insertId
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
}

async function joinCircle(circleId, userId) {
  await addCircleMember(circleId, userId, 'member')
  return findCircleById(circleId)
}

module.exports = {
  listHotCircles,
  listCircles,
  findCircleById,
  hasJoinedCircle,
  createCircle,
  addCircleMember,
  joinCircle,
  listCirclePosts,
  findPostById,
  createPost,
}