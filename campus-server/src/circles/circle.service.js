const {
  listHotCircles,
  listCircles,
  findCircleById,
  hasJoinedCircle,
  joinCircle,
  createCircle,
  addCircleMember,
} = require('./circle.repository')

async function getHotCircles(userId) {
  const circles = await listHotCircles(3)
  return Promise.all(
    circles.map(async (circle) => ({
      ...circle,
      joined: await hasJoinedCircle(circle.id, userId),
    }))
  )
}

async function getCircles(userId) {
  const circles = await listCircles(20)
  return Promise.all(
    circles.map(async (circle) => ({
      ...circle,
      joined: await hasJoinedCircle(circle.id, userId),
    }))
  )
}

async function createCircleByUser(userId, data) {
  const name = String(data.name || '').trim()
  const description = String(data.description || '').trim()
  const isPublic = data.isPublic !== false

  if (!name) {
    throw new Error('圈子名称不能为空')
  }

  if (name.length > 100) {
    throw new Error('圈子名称不能超过 100 个字符')
  }

  if (description.length > 255) {
    throw new Error('圈子简介不能超过 255 个字符')
  }

  const circleId = await createCircle({
    name,
    description,
    creatorId: userId,
    isPublic,
  })

  await addCircleMember(circleId, userId, 'owner')

  const circle = await findCircleById(circleId)

  return {
    message: '圈子创建成功',
    circle: {
      ...circle,
      joined: true,
    },
  }
}

async function getCircleDetail(userId, circleId) {
  const circle = await findCircleById(circleId)
  if (!circle) {
    throw new Error('圈子不存在')
  }

  return {
    ...circle,
    joined: await hasJoinedCircle(circle.id, userId),
  }
}

async function joinCircleByUser(userId, circleId) {
  const circle = await findCircleById(circleId)
  if (!circle) {
    throw new Error('圈子不存在')
  }

  const joined = await hasJoinedCircle(circleId, userId)
  if (joined) {
    return {
      message: '你已经加入过该圈子',
      circle: {
        ...circle,
        joined: true,
      },
    }
  }

  const updatedCircle = await joinCircle(circleId, userId)

  return {
    message: '加入成功',
    circle: {
      ...updatedCircle,
      joined: true,
    },
  }
}

module.exports = {
  getHotCircles,
  getCircles,
  createCircleByUser,
  getCircleDetail,
  joinCircleByUser,
}