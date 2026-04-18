const { findUserById } = require('../users/user.repository')
const {
  findEventById,
  listFeaturedEvents,
  listMyEvents,
  listCreatedEvents,
  listEventRegistrations,
  hasUserRegistered,
  createRegistration,
  createEventRecord,
} = require('./event.repository')

async function getFeaturedEvents() {
  return listFeaturedEvents(20)
}

async function getMyEvents(userId) {
  const user = await findUserById(userId)

  if (!user) {
    throw new Error('用户不存在')
  }

  return listMyEvents(userId)
}

async function getCreatedEvents(userId) {
  const user = await findUserById(userId)

  if (!user) {
    throw new Error('用户不存在')
  }

  return listCreatedEvents(userId)
}

async function getEventRegistrations(userId, eventId) {
  const user = await findUserById(userId)

  if (!user) {
    throw new Error('用户不存在')
  }

  const event = await findEventById(eventId)

  if (!event) {
    throw new Error('活动不存在')
  }

  if (Number(event.creatorId) !== Number(userId)) {
    throw new Error('只有活动发起人可以查看报名名单')
  }

  const registrations = await listEventRegistrations(eventId)

  return {
    event,
    registrations,
  }
}

async function createEvent(userId, data) {
  const user = await findUserById(userId)

  if (!user) {
    throw new Error('用户不存在')
  }

  const title = String(data.title || '').trim()
  const type = String(data.type || 'offline').trim()
  const startTime = String(data.startTime || '').trim()
  const location = String(data.location || '').trim()
  const capacity = Number(data.capacity || 0)
  const signupDeadline = String(data.signupDeadline || '').trim()
  const description = String(data.description || '').trim()
  const coverUrl = String(data.coverUrl || '').trim()

  if (!title) {
    throw new Error('活动标题不能为空')
  }

  if (!startTime) {
    throw new Error('活动时间不能为空')
  }

  if (!['online', 'offline'].includes(type)) {
    throw new Error('活动类型非法')
  }

  if (capacity < 1) {
    throw new Error('人数上限必须大于 0')
  }

  const event = await createEventRecord({
    title,
    type,
    startTime,
    location,
    capacity,
    signupDeadline: signupDeadline || null,
    description: description || null,
    coverUrl: coverUrl || null,
    creatorId: userId,
  })

  return {
    message: '活动创建成功',
    event,
  }
}

async function registerEvent(userId, eventId) {
  const user = await findUserById(userId)

  if (!user) {
    throw new Error('用户不存在')
  }

  const event = await findEventById(eventId)

  if (!event) {
    throw new Error('活动不存在')
  }

  if (event.status !== 'published') {
    throw new Error('当前活动不可报名')
  }

  if (event.signupDeadline && new Date(event.signupDeadline).getTime() < Date.now()) {
    throw new Error('报名已截止')
  }

  if (event.capacity > 0 && event.registeredCount >= event.capacity) {
    throw new Error('活动名额已满')
  }

  const registered = await hasUserRegistered(eventId, userId)

  if (registered) {
    return {
      message: '你已经报名过该活动',
      event,
    }
  }

  const updatedEvent = await createRegistration(eventId, userId)

  return {
    message: '报名成功',
    event: updatedEvent,
  }
}

module.exports = {
  getFeaturedEvents,
  getMyEvents,
  getCreatedEvents,
  getEventRegistrations,
  createEvent,
  registerEvent,
}