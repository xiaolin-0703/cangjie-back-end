const pool = require('../db/db')

function formatDateText(dateValue) {
  if (!dateValue) return '时间待定'

  const date = new Date(dateValue)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hour = `${date.getHours()}`.padStart(2, '0')
  const minute = `${date.getMinutes()}`.padStart(2, '0')

  return `${month}-${day} ${hour}:${minute}`
}

function formatEvent(row) {
  if (!row) return null

  return {
    id: row.id,
    title: row.title,
    type: row.type,
    startTime: row.start_time,
    startTimeText: formatDateText(row.start_time),
    location: row.location,
    capacity: Number(row.capacity || 0),
    signupDeadline: row.signup_deadline,
    description: row.description,
    coverUrl: row.cover_url,
    creatorId: row.creator_id,
    status: row.status,
    registeredCount: Number(row.registered_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function findEventById(eventId) {
  const [rows] = await pool.query(
    `
    SELECT
      e.*,
      COUNT(er.id) AS registered_count
    FROM events e
    LEFT JOIN event_registrations er
      ON er.event_id = e.id
     AND er.status = 'registered'
    WHERE e.id = ?
    GROUP BY e.id
    LIMIT 1
    `,
    [eventId]
  )

  return formatEvent(rows[0])
}

async function listFeaturedEvents(limit = 6) {
  const [rows] = await pool.query(
    `
    SELECT
      e.*,
      COUNT(er.id) AS registered_count
    FROM events e
    LEFT JOIN event_registrations er
      ON er.event_id = e.id
     AND er.status = 'registered'
    WHERE e.status = 'published'
      AND e.start_time >= NOW()
    GROUP BY e.id
    ORDER BY e.start_time ASC, e.created_at DESC
    LIMIT ?
    `,
    [limit]
  )

  return rows.map(formatEvent)
}

async function listMyEvents(userId) {
  const [rows] = await pool.query(
    `
    SELECT
      e.*,
      COUNT(all_reg.id) AS registered_count
    FROM event_registrations mine
    JOIN events e
      ON e.id = mine.event_id
    LEFT JOIN event_registrations all_reg
      ON all_reg.event_id = e.id
     AND all_reg.status = 'registered'
    WHERE mine.user_id = ?
      AND mine.status = 'registered'
    GROUP BY e.id
    ORDER BY e.start_time ASC
    `,
    [userId]
  )

  return rows.map(formatEvent)
}

async function hasUserRegistered(eventId, userId) {
  const [rows] = await pool.query(
    `
    SELECT id
    FROM event_registrations
    WHERE event_id = ? AND user_id = ? AND status = 'registered'
    LIMIT 1
    `,
    [eventId, userId]
  )

  return rows.length > 0
}

async function createRegistration(eventId, userId) {
  await pool.query(
    `
    INSERT INTO event_registrations (event_id, user_id, status)
    VALUES (?, ?, 'registered')
    ON DUPLICATE KEY UPDATE status = 'registered'
    `,
    [eventId, userId]
  )

  return findEventById(eventId)
}


async function createEventRecord(data) {
  const [result] = await pool.query(
    `
    INSERT INTO events (
      title,
      type,
      start_time,
      location,
      capacity,
      signup_deadline,
      description,
      cover_url,
      creator_id,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')
    `,
    [
      data.title,
      data.type,
      data.startTime,
      data.location,
      data.capacity,
      data.signupDeadline,
      data.description,
      data.coverUrl,
      data.creatorId,
    ]
  )

  return await findEventById(result.insertId)
}

module.exports = {
  findEventById,
  listFeaturedEvents,
  listMyEvents,
  hasUserRegistered,
  createRegistration,
  createEventRecord,
}